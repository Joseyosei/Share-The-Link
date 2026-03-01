import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors";
import { verifyAuth, unauthorized } from "./_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";
import { isOneOf, badRequest } from "./_lib/validate";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 10)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    const { action } = req.body;
    if (action && !isOneOf(action, ["cancel", "reactivate"])) return badRequest(res, "Invalid action");

    const email = auth.email;
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
