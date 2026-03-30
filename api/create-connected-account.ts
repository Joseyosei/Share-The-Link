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

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured" });

  const stripe = new Stripe(stripeSecretKey);
  const { action } = req.body || {};

  // --- ACTION: form-checkout (PUBLIC — no auth required) ---
  // Creates a Stripe Checkout session for form payments.
  // Payment goes to the creator's connected account via transfer.
  if (action === "form-checkout") {
    try {
      const {
        formId, formTitle, amountInCents, currency = "usd",
        customerEmail, customerName, connectedAccountId,
      } = req.body || {};

      if (!formId || !amountInCents || !connectedAccountId) {
        return res.status(400).json({ error: "formId, amountInCents, and connectedAccountId are required" });
      }
      if (typeof amountInCents !== "number" || amountInCents < 50) {
        return res.status(400).json({ error: "Amount must be at least 50 cents" });
      }

      const origin = req.headers.origin || "https://share-the-link.vercel.app";
      const applicationFee = Math.round(amountInCents * 0.05);

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency,
            product_data: {
              name: sanitize(String(formTitle || "Payment")).slice(0, 200),
              description: `Payment for form: ${sanitize(String(formTitle || formId)).slice(0, 200)}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        }],
        customer_email: customerEmail || undefined,
        payment_intent_data: {
          application_fee_amount: applicationFee,
          transfer_data: { destination: connectedAccountId },
          metadata: { form_id: formId, customer_name: customerName || "" },
        },
        success_url: `${origin}/form/${formId}?payment=success`,
        cancel_url: `${origin}/form/${formId}?payment=cancelled`,
        metadata: { form_id: formId, platform: "share-the-link" },
      });

      return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("form-checkout error:", message);
      return res.status(500).json({ error: message });
    }
  }

  // All other actions require authentication
  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

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

  // --- ACTION: create-product (on connected account) ---
  if (action === "create-product") {
    try {
      const { accountId, name, description, priceInCents, currency = "gbp" } = req.body || {};

      if (!accountId || !name || !priceInCents) {
        return res.status(400).json({ error: "accountId, name, and priceInCents are required" });
      }

      const safeName = sanitize(String(name)).slice(0, 200);
      const safeDesc = description ? sanitize(String(description)).slice(0, 500) : undefined;
      if (typeof priceInCents !== "number" || priceInCents < 50 || priceInCents > 99999999) {
        return badRequest(res, "Invalid price");
      }
      const validCurrencies = ["gbp", "usd", "eur"];
      if (!isOneOf(currency, validCurrencies)) return badRequest(res, "Invalid currency");

      const product = await stripe.products.create(
        { name: safeName, description: safeDesc },
        { stripeAccount: accountId }
      );

      const price = await stripe.prices.create(
        { product: product.id, unit_amount: priceInCents, currency },
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
