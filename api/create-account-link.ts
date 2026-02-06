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

    const stripe = new Stripe(stripeSecretKey);

    // Determine the base URL for return/refresh
    const origin = req.headers.origin || req.headers.referer || "https://localhost:3000";
    const baseUrl = origin.replace(/\/$/, "");

    const accountLink = await stripe.accountLinks.create({
      account: connectedAccount.stripe_account_id,
      refresh_url: `${baseUrl}/dashboard/sell?refresh=true`,
      return_url: `${baseUrl}/dashboard/sell?completed=true`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-account-link error:", message);
    return res.status(500).json({ error: message });
  }
}
