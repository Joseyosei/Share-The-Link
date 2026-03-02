import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors";
import { verifyAuth, unauthorized } from "./_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 30)) return tooManyRequests(res);

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
    const account = await stripe.accounts.retrieve(accountId);

    const chargesEnabled = account.charges_enabled || false;
    const payoutsEnabled = account.payouts_enabled || false;
    const detailsSubmitted = account.details_submitted || false;

    let requirementsStatus = "none";
    if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
      requirementsStatus = "currently_due";
    } else if (account.requirements?.past_due && account.requirements.past_due.length > 0) {
      requirementsStatus = "past_due";
    } else if (account.requirements?.eventually_due && account.requirements.eventually_due.length > 0) {
      requirementsStatus = "eventually_due";
    }

    return res.status(200).json({
      onboardingComplete: detailsSubmitted,
      requirementsStatus,
      readyToProcessPayments: chargesEnabled && payoutsEnabled,
      chargesEnabled,
      payoutsEnabled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("get-account-status error:", message);
    return res.status(500).json({ error: message });
  }
}
