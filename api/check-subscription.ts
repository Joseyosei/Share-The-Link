import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

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
    const { email } = req.body;

    if (!email) {
      return res.status(200).json({ subscribed: false, tier: "free" });
    }

    // Find customer by email
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
      const tier = PRICE_TO_TIER[priceId] || "free";

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
    const tier = PRICE_TO_TIER[priceId] || "free";

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
