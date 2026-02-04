/**
 * GET ACCOUNT STATUS - Edge Function
 * 
 * Retrieves the current status of a Stripe Connected Account.
 * Always fetches fresh data from Stripe API (not cached in DB).
 * 
 * Returns:
 * - Onboarding status
 * - Whether charges are enabled
 * - Whether payouts are enabled
 * - Any pending requirements
 * 
 * @see https://docs.stripe.com/api/v2/core/accounts/object
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GET-ACCOUNT-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // ============================================
    // STEP 1: Validate environment
    // ============================================
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    // ============================================
    // STEP 2: Authenticate user
    // ============================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const supabaseClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication failed");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // ============================================
    // STEP 3: Get the user's connected account from DB
    // ============================================
    const { data: connectedAccount, error: accountError } = await supabaseClient
      .from("connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (accountError || !connectedAccount) {
      // No connected account exists yet
      return new Response(
        JSON.stringify({
          hasAccount: false,
          message: "No connected account found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const stripeAccountId = connectedAccount.stripe_account_id;
    logStep("Found connected account", { accountId: stripeAccountId });

    // ============================================
    // STEP 4: Fetch fresh status from Stripe V2 API
    // ============================================
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Retrieve account with expanded data for requirements and capabilities
    const account = await stripeClient.v2.core.accounts.retrieve(stripeAccountId, {
      include: ["configuration.merchant", "requirements"],
    });

    logStep("Retrieved Stripe account", { accountId: account.id });

    // ============================================
    // STEP 5: Determine account status
    // ============================================
    
    // Check if card payments capability is active
    const cardPaymentsStatus = account.configuration?.merchant?.capabilities?.card_payments?.status;
    const readyToProcessPayments = cardPaymentsStatus === "active";

    // Check requirements status
    const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
    const onboardingComplete = requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

    // Determine if charges and payouts are enabled
    // Note: V2 API structure may differ - adjust based on actual response
    const chargesEnabled = readyToProcessPayments;
    const payoutsEnabled = onboardingComplete && readyToProcessPayments;

    logStep("Account status determined", {
      readyToProcessPayments,
      onboardingComplete,
      requirementsStatus,
      cardPaymentsStatus,
    });

    // ============================================
    // STEP 6: Update database with latest status
    // ============================================
    await supabaseClient
      .from("connected_accounts")
      .update({
        onboarding_complete: onboardingComplete,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    logStep("Database updated with latest status");

    // ============================================
    // STEP 7: Return comprehensive status
    // ============================================
    return new Response(
      JSON.stringify({
        hasAccount: true,
        accountId: stripeAccountId,
        displayName: connectedAccount.display_name,
        contactEmail: connectedAccount.contact_email,
        
        // Onboarding status
        onboardingComplete,
        requirementsStatus: requirementsStatus || "none",
        
        // Payment processing status
        readyToProcessPayments,
        chargesEnabled,
        payoutsEnabled,
        
        // Capability details
        cardPaymentsStatus: cardPaymentsStatus || "inactive",
        
        // Timestamps
        createdAt: connectedAccount.created_at,
        updatedAt: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
