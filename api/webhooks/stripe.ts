import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

// Supabase admin client for DB writes
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

/**
 * Determine the tier from subscription metadata, price amount, or product name.
 * The subscription_data.metadata.tier field set during checkout is the primary source.
 * Falls back to amount-based detection for live mode where price IDs are dynamic.
 */
function detectTierFromSubscription(subscription: Stripe.Subscription): string {
  // 1. Check subscription metadata (set by our checkout endpoint)
  if (subscription.metadata?.tier) {
    return subscription.metadata.tier;
  }

  // 2. Check the amount to detect tier
  const amount = subscription.items.data[0]?.price?.unit_amount;
  if (amount) {
    if (amount === 700) return "pro";
    if (amount === 2300) return "business";
    if (amount === 10000) return "enterprise";
  }

  // 3. Check product name
  const productName = (subscription.items.data[0]?.price?.product as any)?.name || "";
  if (typeof productName === "string") {
    const lower = productName.toLowerCase();
    if (lower.includes("enterprise")) return "enterprise";
    if (lower.includes("business")) return "business";
    if (lower.includes("pro")) return "pro";
  }

  return "pro"; // default fallback
}

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Find Supabase user_id from Stripe customer email or metadata
 */
async function findSupabaseUserId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null, metadata?: Record<string, string>): Promise<string | null> {
  // Check metadata first
  if (metadata?.supabase_user_id) {
    return metadata.supabase_user_id;
  }

  if (!customer) return null;

  // Get the customer's email
  let email: string | null = null;
  if (typeof customer === "string") {
    const cust = await stripe.customers.retrieve(customer);
    if ("deleted" in cust && cust.deleted) return null;
    email = cust.email;
  } else if ("email" in customer) {
    email = customer.email;
  }

  if (!email) return null;

  // Look up user in Supabase auth by email
  const { data } = await supabaseAdmin.auth.admin.listUsers();
  const user = data?.users?.find((u) => u.email === email);
  return user?.id || null;
}

/**
 * Upsert subscription in user_subscriptions table
 */
async function upsertSubscription(
  userId: string,
  subscription: Stripe.Subscription,
  tier: string,
) {
  const priceId = subscription.items.data[0]?.price.id;
  const planName = tier.charAt(0).toUpperCase() + tier.slice(1);

  const { error } = await supabaseAdmin
    .from("user_subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        plan_name: planName,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("Failed to upsert subscription:", error);
    // Try insert if upsert fails on conflict
    await supabaseAdmin
      .from("user_subscriptions")
      .insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: priceId,
        plan_name: planName,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
      });
  }
}

/**
 * Mark subscription as cancelled in DB
 */
async function cancelSubscriptionInDB(userId: string, subscription: Stripe.Subscription) {
  await supabaseAdmin
    .from("user_subscriptions")
    .update({
      status: "canceled",
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let event: Stripe.Event;

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"] as string;

    if (!sig) {
      return res.status(400).json({ error: "Missing stripe-signature header" });
    }

    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error("Webhook verification error:", message);
    return res.status(400).json({ error: message });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed for:", session.customer_email, "Tier:", session.metadata?.tier);

        // If this is a subscription checkout, the subscription events will handle DB writes
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const tier = detectTierFromSubscription(subscription);
        const status = subscription.status;

        console.log("Subscription event:", {
          type: event.type,
          customerId: subscription.customer,
          tier,
          status,
          amount: subscription.items.data[0]?.price?.unit_amount,
          metadata: subscription.metadata,
        });

        // Find the Supabase user
        const userId = await findSupabaseUserId(
          subscription.customer as string,
          subscription.metadata as Record<string, string>,
        );

        if (userId) {
          await upsertSubscription(userId, subscription, tier);
          console.log(`Subscription ${event.type} saved for user ${userId} (${tier})`);
        } else {
          console.warn("Could not find Supabase user for subscription:", subscription.customer);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription cancelled:", {
          customerId: subscription.customer,
          status: subscription.status,
        });

        const userId = await findSupabaseUserId(
          subscription.customer as string,
          subscription.metadata as Record<string, string>,
        );

        if (userId) {
          await cancelSubscriptionInDB(userId, subscription);
          console.log(`Subscription cancelled for user ${userId}`);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment succeeded:", {
          customerId: invoice.customer,
          amount: invoice.amount_paid,
          currency: invoice.currency,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed:", {
          customerId: invoice.customer,
          amount: invoice.amount_due,
        });

        // Optionally mark subscription as past_due
        if (invoice.subscription) {
          const userId = await findSupabaseUserId(invoice.customer as string);
          if (userId) {
            await supabaseAdmin
              .from("user_subscriptions")
              .update({ status: "past_due", updated_at: new Date().toISOString() })
              .eq("user_id", userId);
          }
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
