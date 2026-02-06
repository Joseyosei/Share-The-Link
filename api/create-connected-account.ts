import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "authorization, content-type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!stripeSecretKey) {
      return res.status(500).json({ error: "STRIPE_SECRET_KEY is not configured" });
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Supabase environment variables are not configured" });
    }

    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    const user = userData.user;

    // Check if user already has a connected account
    const { data: existingAccount } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingAccount) {
      return res.status(200).json({
        success: true,
        accountId: existingAccount.stripe_account_id,
        message: "Connected account already exists",
      });
    }

    // Parse request body
    const { displayName, contactEmail } = req.body || {};
    const accountDisplayName = displayName || user.user_metadata?.full_name || "Creator";
    const accountEmail = contactEmail || user.email;

    if (!accountEmail) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Create Stripe Connect Express account
    const stripe = new Stripe(stripeSecretKey);

    const account = await stripe.accounts.create({
      type: "express",
      country: "GB",
      email: accountEmail,
      business_type: "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: {
        name: accountDisplayName,
      },
    });

    // Store in database
    const { error: insertError } = await supabase.from("connected_accounts").insert({
      user_id: user.id,
      stripe_account_id: account.id,
      display_name: accountDisplayName,
      contact_email: accountEmail,
      onboarding_complete: false,
      charges_enabled: false,
      payouts_enabled: false,
    });

    if (insertError) {
      console.error("DB insert error:", insertError);
      return res.status(500).json({ error: `Failed to save account: ${insertError.message}` });
    }

    return res.status(200).json({
      success: true,
      accountId: account.id,
      message: "Connected account created successfully",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("create-connected-account error:", message);
    return res.status(500).json({ error: message });
  }
}
