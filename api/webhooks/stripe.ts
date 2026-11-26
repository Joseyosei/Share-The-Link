import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

function detectTierFromSubscription(subscription: any): string | null {
  const price = subscription.items?.data?.[0]?.price;
  const ids: Record<string, string> = {
    "price_1SwbcFE2FuZ01nXUSQxTa1zF": "pro",
    "price_1SwbdIE2FuZ01nXUnGw4a2Yn": "business",
    "price_1SwbfRE2FuZ01nXU1UJvDqrO": "enterprise",
    "price_1T7lpzE2FuZ01nXU2dHWg9mn": "business",
    "price_1T7IcHE2FuZ01nXUub7JKnN3": "enterprise",
  };
  if (ids[price?.id]) return ids[price.id];
  const tier = subscription.metadata?.tier;
  return ["pro", "business", "enterprise"].includes(tier) ? tier : null;
}

export const config = { api: { bodyParser: false } };

async function buffer(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function findSupabaseUserId(customer: any, metadata?: Record<string, string>): Promise<string | null> {
  if (metadata?.supabase_user_id) return metadata.supabase_user_id;
  if (!customer) return null;
  let email: string | null = null;
  if (typeof customer === "string") {
    const cust: any = await stripe.customers.retrieve(customer);
    if (cust.deleted) return null;
    if (cust.metadata?.supabase_user_id) return cust.metadata.supabase_user_id;
    email = cust.email;
  } else if (customer.email) {
    email = customer.email;
  }
  if (!email) return null;
  for (let page = 1; ; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 100 });
    if (error) throw error;
    const user = data.users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    if (user) return user.id;
    if (data.users.length < 100) return null;
  }
}

async function upsertSubscription(userId: string, subscription: any, tier: string) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const rawPeriodStart = subscription.items?.data?.[0]?.current_period_start ?? subscription.current_period_start;
  const rawPeriodEnd = subscription.items?.data?.[0]?.current_period_end ?? subscription.current_period_end;
  const periodStart = rawPeriodStart
    ? new Date(rawPeriodStart * 1000).toISOString()
    : new Date().toISOString();
  const periodEnd = rawPeriodEnd
    ? new Date(rawPeriodEnd * 1000).toISOString()
    : new Date().toISOString();

  const { error } = await supabaseAdmin.from("user_subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_name: planName,
    status: subscription.status,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    cancel_at_period_end: subscription.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) throw error;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error("Webhook verification error:", err.message);
    return res.status(400).json({ error: err.message });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        if (session.mode === "subscription" && typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          const tier = detectTierFromSubscription(sub);
          const userId = await findSupabaseUserId(sub.customer, sub.metadata);
          if (tier && userId) await upsertSubscription(userId, sub, tier);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = await stripe.subscriptions.retrieve((event.data.object as Stripe.Subscription).id);
        const tier = detectTierFromSubscription(subscription);
        if (!tier) { console.warn("Unrecognised subscription", subscription.id); break; }
        console.log("Subscription event:", { type: event.type, tier, status: subscription.status });
        const userId = await findSupabaseUserId(subscription.customer, subscription.metadata);
        if (userId) {
          await upsertSubscription(userId, subscription, tier);
          console.log(`Subscription saved for user ${userId} (${tier})`);
        }
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const userId = await findSupabaseUserId(subscription.customer, subscription.metadata);
        if (userId) {
          const { error } = await supabaseAdmin.from("user_subscriptions").update({
            status: "canceled",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId).eq("stripe_subscription_id", subscription.id);
          if (error) throw error;
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        console.log("Payment succeeded:", { customer: invoice.customer, amount: invoice.amount_paid });
        break;
      }
      case "invoice.payment_failed": {
        // Subscription status is reconciled by customer.subscription.updated.
        console.log("Invoice payment failed");
        break;
      }
      default:
        console.log("Unhandled event:", event.type);
    }
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
