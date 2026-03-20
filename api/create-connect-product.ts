import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors.js";
import { verifyAuth, unauthorized } from "./_lib/auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";
import { sanitize, isOneOf, badRequest } from "./_lib/validate.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 10)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured" });
    }

    const { accountId, name, description, priceInCents, currency = "gbp" } = req.body || {};

    if (!accountId || !name || !priceInCents) {
      return res.status(400).json({ error: "accountId, name, and priceInCents are required" });
    }

    // Validate and sanitize inputs
    const safeName = sanitize(String(name)).slice(0, 200);
    const safeDesc = description ? sanitize(String(description)).slice(0, 500) : undefined;
    if (typeof priceInCents !== "number" || priceInCents < 50 || priceInCents > 99999999) {
      return badRequest(res, "Invalid price");
    }
    const validCurrencies = ["gbp", "usd", "eur"];
    if (!isOneOf(currency, validCurrencies)) return badRequest(res, "Invalid currency");

    const stripe = new Stripe(stripeSecretKey);

    // Create product on connected account
    const product = await stripe.products.create(
      { name: safeName, description: safeDesc },
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
