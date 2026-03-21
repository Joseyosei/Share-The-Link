/**
 * Consolidated Connect Store API endpoint.
 * Routes based on ?action= query parameter.
 *
 * POST /api/connect-store?action=list-products
 * POST /api/connect-store?action=create-checkout
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";
import { sanitizeString, isValidUUID, badRequest } from "./_lib/validate.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const action = req.query.action as string || "";

  switch (action) {
    case "list-products":
      return handleListProducts(req, res);
    case "create-checkout":
      return handleCreateCheckout(req, res);
    default:
      return res.status(400).json({ error: "Missing or invalid action parameter" });
  }
}

async function handleListProducts(req: VercelRequest, res: VercelResponse) {
  if (isRateLimited(getClientIp(req), 30)) return tooManyRequests(res);

  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: "accountId is required" });

    const account: any = await stripe.accounts.retrieve(accountId);
    const storeName = account.business_profile?.name || "Store";

    const products = await stripe.products.list(
      { active: true, limit: 100 },
      { stripeAccount: accountId },
    );

    const formattedProducts = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list(
          { product: product.id, active: true, limit: 1 },
          { stripeAccount: accountId },
        );
        const price: any = prices.data[0];
        if (!price) return null;
        const amount = price.unit_amount || 0;
        const currency = price.currency || "gbp";
        return {
          id: product.id, name: product.name,
          description: product.description || "", images: product.images || [],
          priceId: price.id, priceAmount: amount, currency,
          formattedPrice: new Intl.NumberFormat("en-GB", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100),
        };
      }),
    );

    return res.status(200).json({
      store: { name: storeName, accountId },
      products: formattedProducts.filter(Boolean),
    });
  } catch (error: any) {
    console.error("List products error:", error);
    return res.status(500).json({ error: error.message || "Failed to list products" });
  }
}

async function handleCreateCheckout(req: VercelRequest, res: VercelResponse) {
  if (isRateLimited(getClientIp(req), 20)) return tooManyRequests(res);

  try {
    const { accountId, priceId, productName, quantity = 1 } = req.body;
    if (!accountId || !priceId) return res.status(400).json({ error: "accountId and priceId are required" });
    const safeName = productName ? sanitizeString(String(productName)).slice(0, 200) : "";

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
