import { identifyPaidTier } from "../../src/lib/plan-policy.js";
import { recordFounderEvent } from "../_lib/founder-events.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { commerceWebhook } from "../_lib/digital-commerce.js";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

function detectTierFromSubscription(subscription: Stripe.Subscription) {
  return identifyPaidTier(subscription.items.data[0]?.price.id||"",subscription.metadata.tier);
}

export const config = { api: { bodyParser: false } };

async function buffer(readable: any): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function findSupabaseUserId(customer: any, metadata?: Record<string,string>): Promise<string|null> {
  if(!customer)return null;
  const cust=typeof customer==="string"?await stripe.customers.retrieve(customer):customer;
  if(cust.deleted)return null;
  const userId=cust.metadata?.supabase_user_id;
  if(!userId||(metadata?.supabase_user_id&&metadata.supabase_user_id!==userId))return null;
  return userId;
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

  if(error)throw error;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let event: Stripe.Event;
  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"] as string;
    if (!sig) return res.status(400).json({ error: "Missing stripe-signature header" });
    try { event = stripe.webhooks.constructEvent(buf, sig, webhookSecret); if(event.account) return res.status(400).json({error:"Connected event requires Connect signing secret"}); }
    catch (error) { const secret=process.env.STRIPE_CONNECT_WEBHOOK_SECRET; if(!secret)throw error; event=stripe.webhooks.constructEvent(buf,sig,secret); if(!event.account)return res.status(400).json({error:"Invalid Connect event"}); }
  } catch (err: any) {
    console.error("Webhook verification error:", err.message);
    return res.status(400).json({ error: err.message });
  }

  try {
    if(event.account){ await commerceWebhook(event); return res.status(200).json({received:true}); }
    switch (event.type) {
      case "checkout.session.async_payment_succeeded":
      case "checkout.session.completed": {
        const session = event.data.object as any;
        if (session.mode === "subscription" && session.metadata?.supabase_user_id && session.payment_status === "paid") {
          try{await recordFounderEvent(session.metadata.supabase_user_id,"checkout_completed",session.id);}catch{console.error("Checkout analytics unavailable");}
          if(typeof session.subscription==="string"){
            const sub=await stripe.subscriptions.retrieve(session.subscription);
            const tier=detectTierFromSubscription(sub);
            const owner=await findSupabaseUserId(sub.customer,sub.metadata);
            if(tier&&owner===session.metadata.supabase_user_id)await upsertSubscription(owner,sub,tier);
          }
        }
        console.log("Checkout completed");
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription=await stripe.subscriptions.retrieve((event.data.object as Stripe.Subscription).id);
        const tier = detectTierFromSubscription(subscription);
        if(!tier)break;
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
          const {error}=await supabaseAdmin.from("user_subscriptions").update({
            status: "canceled",
            cancel_at_period_end: true,
            updated_at: new Date().toISOString(),
          }).eq("user_id", userId).eq("stripe_subscription_id",subscription.id);
          if(error)throw error;
        }
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        console.log("Payment succeeded:", { customer: invoice.customer, amount: invoice.amount_paid });
        break;
      }
      case "invoice.payment_failed": {
        // Subscription update event reconciles actual status.
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
