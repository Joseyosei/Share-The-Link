import { resolvePlan,usageSnapshot } from "./_lib/entitlements.js";
import { PLAN_POLICY,identifyPaidTier } from "../src/lib/plan-policy.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "./_lib/cors.js";
import { verifyAuth, unauthorized } from "./_lib/auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

const PRICE_TO_TIER: Record<string, string> = {
  "price_1SwbcFE2FuZ01nXUSQxTa1zF": "pro",
  "price_1SwbdIE2FuZ01nXUnGw4a2Yn": "business",
  "price_1T7lpzE2FuZ01nXU2dHWg9mn": "business",
  "price_1T7IcHE2FuZ01nXUub7JKnN3": "enterprise",
  "price_1SwbfRE2FuZ01nXU1UJvDqrO": "enterprise",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 30)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  const { action } = req.body || {};

  if (action === "confirm-checkout") {
    try {
      const { sessionId } = req.body;
      if (typeof sessionId !== "string" || !/^cs_(test|live)_[a-zA-Z0-9]+$/.test(sessionId)) return res.status(400).json({ error: "Invalid session" });
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.metadata?.supabase_user_id !== auth.userId || session.mode !== "subscription") return res.status(403).json({ error: "Checkout does not belong to this account" });
      if (session.status !== "complete" || typeof session.subscription !== "string") return res.status(200).json({ confirmed: false });
      const sub = await stripe.subscriptions.retrieve(session.subscription);
      const tier = PRICE_TO_TIER[sub.items.data[0]?.price.id] || sub.metadata?.tier;
      if (!["pro", "business", "enterprise"].includes(tier || "") || sub.metadata?.supabase_user_id !== auth.userId) return res.status(409).json({ error: "Subscription could not be verified" });
      return res.status(200).json({ confirmed: ["active", "trialing"].includes(sub.status), tier });
    } catch (error) {
      console.error("Checkout confirmation error:", error);
      return res.status(503).json({ error: "Checkout confirmation temporarily unavailable" });
    }
  }

  if(action==="usage"){
    try{const {tier}=await resolvePlan(auth.userId,auth.email);return res.json(await usageSnapshot(auth.userId,tier));}
    catch(error){return res.status(503).json({error:"Plan usage unavailable; verify billing and migrations."});}
  }
  // --- ACTION: cancel / reactivate subscription ---
  if (action === "cancel" || action === "reactivate") {
    try {
      const email = auth.email;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const result = await stripe.customers.list({ email, limit: 100 });
      const customers = { data: result.data.filter(c => c.metadata.supabase_user_id === auth.userId).sort((a,b) => Number(b.metadata.supabase_user_id === auth.userId) - Number(a.metadata.supabase_user_id === auth.userId)) };
      if (customers.data.length === 0) return res.status(404).json({ error: "No customer found" });
      const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
      if (subs.data.length === 0) return res.status(404).json({ error: "No active subscription found" });
      const updated: any = await stripe.subscriptions.update(subs.data[0].id, {
        cancel_at_period_end: action !== "reactivate",
      });
      return res.status(200).json({
        success: true,
        message: action === "reactivate" ? "Subscription reactivated" : "Subscription will cancel at end of billing period",
        cancelAtPeriodEnd: updated.cancel_at_period_end,
        currentPeriodEnd: (updated.items?.data?.[0]?.current_period_end ?? updated.current_period_end) ? new Date((updated.items?.data?.[0]?.current_period_end ?? updated.current_period_end) * 1000).toISOString() : null,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to update subscription" });
    }
  }

  // --- ACTION: customer portal ---
  if (action === "portal") {
    try {
      const email = auth.email;
      if (!email) return res.status(400).json({ error: "Email is required" });
      const result = await stripe.customers.list({ email, limit: 100 });
      const customers = { data: result.data.filter(c => c.metadata.supabase_user_id === auth.userId).sort((a,b) => Number(b.metadata.supabase_user_id === auth.userId) - Number(a.metadata.supabase_user_id === auth.userId)) };
      if (customers.data.length === 0) return res.status(404).json({ error: "No customer found" });
      const origin = process.env.APP_URL || "https://sharethelink.app";
      const session = await stripe.billingPortal.sessions.create({
        customer: customers.data[0].id,
        return_url: `${origin}/dashboard`,
      });
      return res.status(200).json({ url: session.url });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to create portal session" });
    }
  }

  // --- ACTION: create tip PaymentIntent ---
  if (action === "create-tip") {
    try {
      const { amount, streamId, tipperName, tipMessage } = req.body;
      if (!amount || amount < 1 || amount > 10000) return res.status(400).json({ error: "Invalid tip amount" });
      if (!streamId) return res.status(400).json({ error: "streamId required" });

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence/cents
        currency: "gbp",
        metadata: {
          type: "stream_tip",
          stream_id: streamId,
          tipper_id: auth.userId,
          tipper_name: tipperName || "Anonymous",
          tip_message: tipMessage || "",
        },
      });

      return res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || "Failed to create payment" });
    }
  }

  // Verified Stripe identity, not client-writable subscription rows.
  try{
   const {tier,subscription:sub}=await resolvePlan(auth.userId,auth.email);
   const item=sub?.items.data[0] as any;
   return res.json({subscribed:!!sub,tier,planName:PLAN_POLICY[tier].name,subscriptionId:sub?.id,status:sub?.status,currentPeriodStart:item?.current_period_start?new Date(item.current_period_start*1000).toISOString():null,currentPeriodEnd:item?.current_period_end?new Date(item.current_period_end*1000).toISOString():null,cancelAtPeriodEnd:sub?.cancel_at_period_end});
  }catch(error){console.error("Plan check unavailable");return res.status(503).json({error:"Billing verification unavailable. Contact support if you have a legacy subscription."});}
}
