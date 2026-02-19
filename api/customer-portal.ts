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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Find customer by email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.status(404).json({ error: "No customer found" });
    }

    const origin = req.headers.origin || "https://sharethelink.com";

    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/dashboard`,
      configuration: "bpc_1T2LYgE2FuZ01nXUTrRkozXK",
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Customer portal error:", error);
    const message = error instanceof Error ? error.message : "Failed to create portal session";
    return res.status(500).json({ error: message });
  }
}
