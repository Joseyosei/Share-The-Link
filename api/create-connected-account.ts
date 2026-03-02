import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors";
import { verifyAuth, unauthorized } from "./_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";
import { sanitize } from "./_lib/validate";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 10)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured" });

  const stripe = new Stripe(stripeSecretKey);
  const { action } = req.body || {};

  // --- ACTION: create-account-link (onboarding link) ---
  if (action === "create-link") {
    try {
      const { accountId } = req.body;
      if (!accountId) return res.status(400).json({ error: "accountId is required" });
      const origin = req.headers.origin || "https://share-the-link.vercel.app";
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/dashboard/sell`,
        return_url: `${origin}/dashboard/sell?onboarding=complete`,
        type: "account_onboarding",
      });
      return res.status(200).json({ url: accountLink.url });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ error: message });
    }
  }

  // --- ACTION: get-account-status ---
  if (action === "get-status") {
    try {
      const { accountId } = req.body;
      if (!accountId) return res.status(400).json({ error: "accountId is required" });
      const account = await stripe.accounts.retrieve(accountId);
      const chargesEnabled = account.charges_enabled || false;
      const payoutsEnabled = account.payouts_enabled || false;
      const detailsSubmitted = account.details_submitted || false;
      let requirementsStatus = "none";
      if (account.requirements?.currently_due?.length) requirementsStatus = "currently_due";
      else if (account.requirements?.past_due?.length) requirementsStatus = "past_due";
      else if (account.requirements?.eventually_due?.length) requirementsStatus = "eventually_due";
      return res.status(200).json({
        onboardingComplete: detailsSubmitted,
        requirementsStatus,
        readyToProcessPayments: chargesEnabled && payoutsEnabled,
        chargesEnabled,
        payoutsEnabled,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return res.status(500).json({ error: message });
    }
  }

  // --- DEFAULT: create connected account ---
  try {
    const userId = auth.userId;
    const contactEmail = auth.email;
    const { displayName } = req.body || {};

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
      metadata: { user_id: userId },
    });

    return res.status(200).json({ success: true, accountId: account.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
}
