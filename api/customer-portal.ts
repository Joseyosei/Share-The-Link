import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { handleCors } from "./_lib/cors";
import { verifyAuth, unauthorized } from "./_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 10)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    const email = auth.email;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) return res.status(404).json({ error: "No customer found" });

    const origin = req.headers.origin || "https://sharethelink.com";
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/dashboard`,
    });

    return res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error("Customer portal error:", error);
    return res.status(500).json({ error: error.message || "Failed to create portal session" });
  }
}
