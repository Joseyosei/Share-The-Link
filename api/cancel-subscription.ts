import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, action } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find customer by email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: "No customer found" });
    }

    const customerId = customers.data[0].id;

    // Get active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: "No active subscription found" });
    }

    const subscription = subscriptions.data[0];

    if (action === "reactivate") {
      // Reactivate: remove the cancel_at_period_end flag
      const updated = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      return res.status(200).json({
        success: true,
        message: "Subscription reactivated",
        cancelAtPeriodEnd: updated.cancel_at_period_end,
      });
    }

    // Default action: cancel at period end (not immediate)
    const updated = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription will cancel at end of billing period",
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: new Date(updated.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    const message = error instanceof Error ? error.message : "Failed to cancel subscription";
    return res.status(500).json({ error: message });
  }
}
