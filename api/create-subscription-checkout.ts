import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

const TIERS: Record<string, { name: string; monthlyPriceInPence: number; currency: string }> = {
  pro: { name: "Share The Link Pro", monthlyPriceInPence: 700, currency: "gbp" },
  business: { name: "Share The Link Business", monthlyPriceInPence: 2300, currency: "gbp" },
  enterprise: { name: "Share The Link Enterprise", monthlyPriceInPence: 10000, currency: "gbp" },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { tier, email, userId } = req.body;
    if (!tier || !TIERS[tier]) return res.status(400).json({ error: "Invalid tier" });
    if (!email) return res.status(400).json({ error: "Email is required" });

    const tierConfig = TIERS[tier];
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "https://share-the-link.vercel.app";

    const customers = await stripe.customers.list({ email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      if (userId) await stripe.customers.update(customerId, { metadata: { supabase_user_id: userId } });
    } else {
      const customer = await stripe.customers.create({ email, metadata: { supabase_user_id: userId || "" } });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{
        price_data: {
          currency: tierConfig.currency,
          product_data: { name: tierConfig.name, metadata: { tier } },
          unit_amount: tierConfig.monthlyPriceInPence,
          recurring: { interval: "month" },
        },
        quantity: 1,
      }],
      subscription_data: { metadata: { supabase_user_id: userId || "", tier } },
      success_url: `${origin}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?subscription=cancelled`,
      metadata: { supabase_user_id: userId || "", tier },
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return res.status(500).json({ error: error.message || "Failed to create checkout" });
  }
}
