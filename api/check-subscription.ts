import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

// Price-to-tier mapping (source of truth)
const PRICE_TO_TIER: Record<string, string> = {
  "price_1SwbcFE2FuZ01nXUSQxTa1zF": "pro",
  "price_1SwbdIE2FuZ01nXUnGw4a2Yn": "business",
  "price_1SwbfRE2FuZ01nXU1UJvDqrO": "enterprise",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, userId } = req.body;

    if (!email) {
      return res.status(200).json({ subscribed: false, tier: "free" });
    }

    // First, check Supabase user_subscriptions table for faster response
    if (userId) {
      const { data: dbSub } = await supabaseAdmin
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["active", "trialing"])
        .single();

      if (dbSub) {
        const tier = PRICE_TO_TIER[dbSub.stripe_price_id] || dbSub.plan_name?.toLowerCase() || "pro";
        return res.status(200).json({
          subscribed: true,
          tier,
          planName: tier.charAt(0).toUpperCase() + tier.slice(1),
          subscriptionId: dbSub.stripe_subscription_id,
          status: dbSub.status,
          currentPeriodStart: dbSub.current_period_start,
          currentPeriodEnd: dbSub.current_period_end,
          cancelAtPeriodEnd: dbSub.cancel_at_period_end,
        });
      }
    }

    // Fallback: Check Stripe directly
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(200).json({ subscribed: false, tier: "free" });
    }

    const customerId = customers.data[0].id;

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // Check for trialing subscriptions too
      const trialSubs = await stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      });

      if (trialSubs.data.length === 0) {
        return res.status(200).json({ subscribed: false, tier: "free" });
      }

      const sub = trialSubs.data[0];
      const priceId = sub.items.data[0]?.price.id;
      const tier = PRICE_TO_TIER[priceId] || "pro";

      // Also save to DB for next time
      if (userId) {
        await supabaseAdmin.from("user_subscriptions").upsert({
          user_id: userId,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId,
          plan_name: tier.charAt(0).toUpperCase() + tier.slice(1),
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      }

      return res.status(200).json({
        subscribed: true,
        tier,
        planName: tier.charAt(0).toUpperCase() + tier.slice(1),
        subscriptionId: sub.id,
        status: sub.status,
        currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
        currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
      });
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price.id;
    const tier = PRICE_TO_TIER[priceId] || "pro";

    // Save to DB for next time
    if (userId) {
      await supabaseAdmin.from("user_subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_price_id: priceId,
        plan_name: tier.charAt(0).toUpperCase() + tier.slice(1),
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
    }

    return res.status(200).json({
      subscribed: true,
      tier,
      planName: tier.charAt(0).toUpperCase() + tier.slice(1),
      subscriptionId: sub.id,
      status: sub.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(sub.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return res.status(200).json({ subscribed: false, tier: "free" });
  }
}
