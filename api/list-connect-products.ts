import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: "accountId is required" });
    }

    // Get account info
    const account = await stripe.accounts.retrieve(accountId);
    const storeName =
      (account as Record<string, unknown>).business_profile &&
      ((account as Record<string, unknown>).business_profile as Record<string, unknown>)?.name
        ? String(((account as Record<string, unknown>).business_profile as Record<string, unknown>).name)
        : "Store";

    // List active products on the connected account
    const products = await stripe.products.list(
      { active: true, limit: 100 },
      { stripeAccount: accountId }
    );

    // Get prices for each product
    const formattedProducts = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list(
          { product: product.id, active: true, limit: 1 },
          { stripeAccount: accountId }
        );

        const price = prices.data[0];
        if (!price) return null;

        const amount = price.unit_amount || 0;
        const currency = price.currency || "gbp";

        return {
          id: product.id,
          name: product.name,
          description: product.description || "",
          images: product.images || [],
          priceId: price.id,
          priceAmount: amount,
          currency,
          formattedPrice: new Intl.NumberFormat("en-GB", {
            style: "currency",
            currency: currency.toUpperCase(),
          }).format(amount / 100),
        };
      })
    );

    return res.status(200).json({
      store: { name: storeName, accountId },
      products: formattedProducts.filter(Boolean),
    });
  } catch (error) {
    console.error("List products error:", error);
    const message = error instanceof Error ? error.message : "Failed to list products";
    return res.status(500).json({ error: message });
  }
}
