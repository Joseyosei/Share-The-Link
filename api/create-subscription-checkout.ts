import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Server-side pricing tiers (source of truth)
const TIERS: Record<string, { priceId: string; name: string }> = {
  pro: {
    priceId: "price_1SwbcFE2FuZ01nXUSQxTa1zF",
    name: "Pro",
  },
  business: {
    priceId: "price_1SwbdIE2FuZ01nXUnGw4a2Yn",
    name: "Business",
  },
  enterprise: {
    priceId: "price_1SwbfRE2FuZ01nXU1UJvDqrO",
    name: "Enterprise",
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { tier, email, userId } = req.body;

    if (!tier || !TIERS[tier]) {
      return res.status(400).json({ error: "Invalid tier" });
    }

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const tierConfig = TIERS[tier];
    const origin = req.headers.origin || "https://sharethelink.com";

    // Find or create Stripe customer
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email,
        metadata: { supabase_user_id: userId || "" },
      });
      customerId = customer.id;
    }

    // Create Stripe Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: tierConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/dashboard?subscription=success`,
      cancel_url: `${origin}/pricing?subscription=cancelled`,
      metadata: {
        supabase_user_id: userId || "",
        tier,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Failed to create checkout";
    return res.status(500).json({ error: message });
  }
}
