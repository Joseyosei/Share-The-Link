import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured" });
    }

    const { accountId, name, description, priceInCents, currency = "gbp" } = req.body || {};

    if (!accountId || !name || !priceInCents) {
      return res.status(400).json({ error: "accountId, name, and priceInCents are required" });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Create product on connected account
    const product = await stripe.products.create(
      { name, description: description || undefined },
      { stripeAccount: accountId }
    );

    // Create price on connected account
    const price = await stripe.prices.create(
      {
        product: product.id,
        unit_amount: priceInCents,
        currency,
      },
      { stripeAccount: accountId }
    );

    return res.status(200).json({
      stripeProductId: product.id,
      stripePriceId: price.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-connect-product error:", message);
    return res.status(500).json({ error: message });
  }
}
