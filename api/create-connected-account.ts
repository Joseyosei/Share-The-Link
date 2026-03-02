import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors";
import { verifyAuth, unauthorized } from "./_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";
import { sanitize } from "./_lib/validate";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 5)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured" });
    }

    // Use verified identity, not req.body
    const userId = auth.userId;
    const contactEmail = auth.email;
    const { displayName } = req.body || {};

    const stripe = new Stripe(stripeSecretKey);

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "GB",
      email: contactEmail,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: displayName ? sanitize(String(displayName)).slice(0, 100) : "Creator",
      },
      metadata: {
        user_id: userId,
      },
    });

    return res.status(200).json({
      success: true,
      accountId: account.id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-connected-account error:", message);
    return res.status(500).json({ error: message });
  }
}
