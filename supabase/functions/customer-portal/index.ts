/**
 * CUSTOMER PORTAL - Edge Function
 * 
 * Creates a Stripe Billing Portal session for subscription management.
 * Allows users to manage their subscription, update payment methods,
 * view invoices, and cancel/upgrade/downgrade plans.
 * 
 * IMPORTANT: The Stripe Customer Portal must be configured in your Stripe Dashboard:
 * @see https://docs.stripe.com/customer-management/activate-no-code-customer-portal
 * 
 * @see https://docs.stripe.com/billing/subscriptions/integrating-customer-portal
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
  console.log(`[CUSTOMER-PORTAL] ${step}${detailsStr}`);
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
      throw new Error("No authorization header provided. Please log in.");
    }

    const supabaseClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error("Authentication failed. Please log in.");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // ============================================
    // STEP 3: Check for connected account (V2)
    // ============================================
    const { data: connectedAccount } = await supabaseClient
      .from("connected_accounts")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // ============================================
    // STEP 4: Get the origin URL for return
    // ============================================
    const origin = req.headers.get("origin") || "http://localhost:5173";

    // ============================================
    // STEP 5: Create billing portal session
    // ============================================
    let portalSession;

    if (connectedAccount?.stripe_account_id) {
      // For V2 accounts, use customer_account instead of customer
      // This uses the connected account as the customer
      logStep("Creating portal for connected account", { 
        accountId: connectedAccount.stripe_account_id 
      });
      
      portalSession = await stripeClient.billingPortal.sessions.create({
        // For V2 accounts, use customer_account
        customer_account: connectedAccount.stripe_account_id,
        return_url: `${origin}/dashboard`,
      } as Stripe.BillingPortal.SessionCreateParams);
    } else {
      // For regular customers without a connected account
      // Find the customer by email
      const customers = await stripeClient.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        throw new Error("No Stripe customer found. Please subscribe to a plan first.");
      }

      const customerId = customers.data[0].id;
      logStep("Found customer", { customerId });

      portalSession = await stripeClient.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/dashboard`,
      });
    }

    logStep("Portal session created", { url: portalSession.url });

    // ============================================
    // STEP 6: Return portal URL
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        url: portalSession.url,
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
