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

    const user = userData.user;

    // Get connected account from DB
    const { data: connectedAccount, error: accountError } = await supabase
      .from("connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (accountError || !connectedAccount) {
      return res.status(200).json({ hasAccount: false });
    }

    const stripeAccountId = connectedAccount.stripe_account_id;

    // Fetch fresh status from Stripe
    const stripe = new Stripe(stripeSecretKey);
    const account = await stripe.accounts.retrieve(stripeAccountId);

    const chargesEnabled = account.charges_enabled || false;
    const payoutsEnabled = account.payouts_enabled || false;
    const detailsSubmitted = account.details_submitted || false;

    // Determine requirements status
    let requirementsStatus = "none";
    if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
      requirementsStatus = "currently_due";
    } else if (account.requirements?.past_due && account.requirements.past_due.length > 0) {
      requirementsStatus = "past_due";
    } else if (account.requirements?.eventually_due && account.requirements.eventually_due.length > 0) {
      requirementsStatus = "eventually_due";
    }

    const onboardingComplete = detailsSubmitted;
    const readyToProcessPayments = chargesEnabled && payoutsEnabled;

    // Update DB
    await supabase
      .from("connected_accounts")
      .update({
        onboarding_complete: onboardingComplete,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return res.status(200).json({
      hasAccount: true,
      accountId: stripeAccountId,
      displayName: connectedAccount.display_name,
      contactEmail: connectedAccount.contact_email,
      onboardingComplete,
      requirementsStatus,
      readyToProcessPayments,
      chargesEnabled,
      payoutsEnabled,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("get-account-status error:", message);
    return res.status(500).json({ error: message });
  }
}
