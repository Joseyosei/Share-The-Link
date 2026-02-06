import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Server configuration missing" });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No authorization header" });

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) return res.status(401).json({ error: "Authentication failed" });

    // Get connected account
    const { data: connectedAccount } = await supabase
      .from("connected_accounts")
      .select("stripe_account_id")
      .eq("user_id", userData.user.id)
      .single();

    if (!connectedAccount) {
      return res.status(400).json({ error: "No connected account found" });
    }

    const { name, description, priceInCents, currency = "gbp" } = req.body || {};

    if (!name || !priceInCents) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const stripe = new Stripe(stripeSecretKey);
    const stripeAccountId = connectedAccount.stripe_account_id;

    // Create product on connected account
    const product = await stripe.products.create(
      { name, description: description || undefined },
      { stripeAccount: stripeAccountId }
    );

    // Create price on connected account
    const price = await stripe.prices.create(
      {
        product: product.id,
        unit_amount: priceInCents,
        currency,
      },
      { stripeAccount: stripeAccountId }
    );

    // Store in database
    await supabase.from("connect_products").insert({
      user_id: userData.user.id,
      stripe_account_id: stripeAccountId,
      stripe_product_id: product.id,
      stripe_price_id: price.id,
      name,
      description: description || null,
      price_in_cents: priceInCents,
      currency,
    });

    return res.status(200).json({
      product: {
        id: product.id,
        stripeProductId: product.id,
        stripePriceId: price.id,
        name,
        description,
        priceInCents,
        currency,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-connect-product error:", message);
    return res.status(500).json({ error: message });
  }
}
