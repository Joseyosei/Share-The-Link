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

function detectTierFromSubscription(subscription: any): string {
  if (subscription.metadata?.tier) return subscription.metadata.tier;
  const amount = subscription.items?.data?.[0]?.price?.unit_amount;
  if (amount === 700) return "pro";
  if (amount === 2300) return "business";
  if (amount === 10000) return "enterprise";
  const productName = subscription.items?.data?.[0]?.price?.product?.name || "";
  if (typeof productName === "string") {
    const lower = productName.toLowerCase();
    if (lower.includes("enterprise")) return "enterprise";
    if (lower.includes("business")) return "business";
    if (lower.includes("pro")) return "pro";
  }
  return "pro";
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
    email = cust.email;
  } else if (customer.email) {
    email = customer.email;
  }
  if (!email) return null;
  const { data } = await (supabaseAdmin.auth as any).admin.listUsers();
  const user = data?.users?.find((u: any) => u.email === email);
  return user?.id || null;
}

async function upsertSubscription(userId: string, subscription: any, tier: string) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const planName = tier.charAt(0).toUpperCase() + tier.slice(1);
  const periodStart = subscription.current_period_start
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : new Date().toISOString();
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
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

  if (error) {
    console.error("Upsert sub error:", error);
    await supabaseAdmin.from("user_subscriptions").insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceId,
      plan_name: planName,
      status: subscription.status,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      cancel_at_period_end: subscription.cancel_at_period_end,
    });
  }
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
        console.log("Checkout completed:", session.customer_email, "Tier:", session.metadata?.tier);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const tier = detectTierFromSubscription(subscription);
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
          await supabaseAdmin.from("user_subscriptions").update({
            status: "canceled",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId);
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        console.log("Payment succeeded:", { customer: invoice.customer, amount: invoice.amount_paid });
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        console.log("Payment failed:", { customer: invoice.customer });
        if (invoice.subscription) {
          const userId = await findSupabaseUserId(invoice.customer);
          if (userId) {
            await supabaseAdmin.from("user_subscriptions").update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            }).eq("user_id", userId);
          }
        }
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
