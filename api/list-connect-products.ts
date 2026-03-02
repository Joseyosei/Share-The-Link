import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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
