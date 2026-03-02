import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors";
import { verifyAuth, unauthorized } from "./_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";

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

    const { accountId } = req.body || {};
    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }

    const stripe = new Stripe(stripeSecretKey);
    const origin = req.headers.origin || req.headers.referer?.replace(/\/$/, "") || "https://share-the-link.vercel.app";

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard/sell`,
      return_url: `${origin}/dashboard/sell?onboarding=complete`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-account-link error:", message);
    return res.status(500).json({ error: message });
  }
}
