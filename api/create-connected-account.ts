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

    const { displayName, contactEmail, userId } = req.body || {};
    if (!userId || !contactEmail) {
      return res.status(400).json({ error: "userId and contactEmail are required" });
    }

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
        name: displayName || "Creator",
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
