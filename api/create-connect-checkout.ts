import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";
import { sanitize, isUuid, badRequest } from "./_lib/validate.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 20)) return tooManyRequests(res);

  try {
    const { accountId, priceId, productName, quantity = 1 } = req.body;
    if (!accountId || !priceId) return res.status(400).json({ error: "accountId and priceId are required" });
    // Sanitize product name to prevent injection
    const safeName = productName ? sanitize(String(productName)).slice(0, 200) : "";

    const origin = req.headers.origin || "https://sharethelink.com";
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        line_items: [{ price: priceId, quantity: quantity || 1 }],
        payment_intent_data: { application_fee_amount: 0 },
        success_url: `${origin}/store/${accountId}?success=true`,
        cancel_url: `${origin}/store/${accountId}?cancelled=true`,
        metadata: { product_name: safeName, connected_account_id: accountId },
      },
      { stripeAccount: accountId },
    );

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Connect checkout error:", error);
    return res.status(500).json({ error: error.message || "Failed to create checkout" });
  }
}
