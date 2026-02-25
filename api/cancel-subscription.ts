import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { email, action } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) return res.status(404).json({ error: "No customer found" });

    const subs = await stripe.subscriptions.list({ customer: customers.data[0].id, status: "active", limit: 1 });
    if (subs.data.length === 0) return res.status(404).json({ error: "No active subscription found" });

    const subscription = subs.data[0];
    const updated: any = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: action !== "reactivate",
    });

    return res.status(200).json({
      success: true,
      message: action === "reactivate" ? "Subscription reactivated" : "Subscription will cancel at end of billing period",
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      currentPeriodEnd: updated.current_period_end ? new Date(updated.current_period_end * 1000).toISOString() : null,
    });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return res.status(500).json({ error: error.message || "Failed to cancel subscription" });
  }
}
