import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors.js";
import { verifyAuth, unauthorized } from "./_lib/auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";
import { isOneOf, badRequest } from "./_lib/validate.js";
import { PRICING_PLANS } from "../src/lib/stripe-products.js";

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
    const { tier, interval = "monthly" } = req.body || {};
    if (!isOneOf(tier, ["pro", "business", "enterprise"])) return badRequest(res, "Invalid tier");

    if (interval !== "monthly" && interval !== "yearly") return badRequest(res, "Invalid billing interval");
    const email = auth.email;
    if (!email) return badRequest(res, "Account email required");
    const userId = auth.userId;

    const tierConfig = PRICING_PLANS.find(plan => plan.id === tier);
    if (!tierConfig || tierConfig.monthlyPrice <= 0) return badRequest(res, "Invalid paid plan");
    const origin = process.env.APP_URL || "https://sharethelink.app";
    const amount = (interval === "yearly" ? tierConfig.yearlyPrice : tierConfig.monthlyPrice) * 100;

    const customers = await stripe.customers.list({ email, limit: 100 });
    const owned = customers.data.find(c => c.metadata.supabase_user_id === userId);
    const legacy = customers.data.find(c => !c.metadata.supabase_user_id);
    const existing = owned || legacy;
    let customerId: string;
    if (existing) {
      customerId = existing.id;
      if (userId) await stripe.customers.update(customerId, { metadata: { supabase_user_id: userId } });
    } else {
      const customer = await stripe.customers.create({ email, metadata: { supabase_user_id: userId || "" } });
      customerId = customer.id;
    }

    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 100 });
    if (subscriptions.data.some(s => ["active", "trialing", "past_due", "unpaid", "incomplete", "paused"].includes(s.status))) {
      return res.status(409).json({ error: "You already have a subscription. Manage it in your account billing settings." });
    }
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: tierConfig.currency.toLowerCase(),
          product_data: { name: `Share The Link ${tierConfig.name}`, metadata: { tier } },
          unit_amount: amount,
          recurring: { interval: interval === "yearly" ? "year" : "month" },
        },
        quantity: 1,
      }],
      subscription_data: { metadata: { supabase_user_id: userId || "", tier } },
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?subscription=cancelled`,
      metadata: { supabase_user_id: userId || "", tier },
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return res.status(500).json({ error: "Unable to start checkout. Please try again." });
  }
}
