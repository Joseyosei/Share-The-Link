/**
 * CREATE ACCOUNT LINK - Edge Function
 * 
 * Creates a Stripe Account Link for onboarding connected accounts.
 * This generates a URL where users complete their Stripe onboarding.
 * 
 * @see https://docs.stripe.com/connect/account-links
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
  console.log(`[CREATE-ACCOUNT-LINK] ${step}${detailsStr}`);
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
    // STEP 3: Get the user's connected account
    // ============================================
    const { data: connectedAccount, error: accountError } = await supabaseClient
      .from("connected_accounts")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    if (accountError || !connectedAccount) {
      throw new Error("No connected account found. Please create one first.");
    }

    const accountId = connectedAccount.stripe_account_id;
    logStep("Found connected account", { accountId });

    // ============================================
    // STEP 4: Get the origin URL for redirects
    // ============================================
    const origin = req.headers.get("origin") || "http://localhost:5173";

    // ============================================
    // STEP 5: Create Account Link using V2 API
    // ============================================
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Using V2 Account Links API for onboarding
    const accountLink = await stripeClient.v2.core.accountLinks.create({
      // The connected account to onboard
      account: accountId,
      
      // Use case configuration
      use_case: {
        // Type of account link
        type: "account_onboarding",
        
        // Onboarding-specific configuration
        account_onboarding: {
          // Which configurations to set up during onboarding
          configurations: ["merchant", "customer"],
          
          // URL to redirect to if the link expires or user needs to restart
          refresh_url: `${origin}/connect/onboarding?refresh=true`,
          
          // URL to redirect to after successful onboarding
          // Include accountId so we can verify the account on return
          return_url: `${origin}/connect/onboarding?accountId=${accountId}&completed=true`,
        },
      },
    });

    logStep("Account link created", { url: accountLink.url });

    // ============================================
    // STEP 6: Return the onboarding URL
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        url: accountLink.url,
        accountId: accountId,
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
