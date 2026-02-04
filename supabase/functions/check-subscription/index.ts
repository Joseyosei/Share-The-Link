/**
 * CHECK SUBSCRIPTION - Edge Function
 * 
 * Checks the current subscription status for a user.
 * Returns subscription details including plan, status, and expiration.
 * 
 * Called on login, page load, and periodically to keep state in sync.
 * 
 * @see https://docs.stripe.com/billing/subscriptions/overview
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
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Map product IDs to tier names
const PRODUCT_TO_TIER: Record<string, string> = {
  "prod_TuQRMlT6Gfn7Sv": "free",
  "prod_TuQTRlytxHScfY": "pro",
  "prod_TuQUStzRn07sTU": "business",
  "prod_TuQWHzMKX8eKbS": "enterprise",
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
    logStep("User authenticated", { userId: user.id, email: user.email });

    // ============================================
    // STEP 3: Initialize Stripe and find customer
    // ============================================
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // First check for connected account
    const { data: connectedAccount } = await supabaseClient
      .from("connected_accounts")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    let subscriptions: Stripe.Subscription[] = [];

    if (connectedAccount?.stripe_account_id) {
      // For V2 accounts, check subscriptions where customer_account matches
      // Note: V2 API may handle this differently - adjust as needed
      logStep("Checking subscriptions for connected account");
      
      // Search for subscriptions with this account as customer_account
      // This is a workaround since V2 subscriptions use customer_account
      const allSubs = await stripeClient.subscriptions.list({
        limit: 10,
        status: "active",
      });
      
      // Filter for subscriptions that match this user's account
      subscriptions = allSubs.data.filter((sub: Stripe.Subscription) => {
        // Check metadata for userId or use customer_account matching
        return sub.metadata?.userId === user.id;
      });
    } else {
      // For regular customers, find by email
      const customers = await stripeClient.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        logStep("No Stripe customer found");
        return new Response(
          JSON.stringify({
            subscribed: false,
            tier: "free",
            message: "No subscription found",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }

      const customerId = customers.data[0].id;
      logStep("Found customer", { customerId });

      // Fetch active subscriptions
      const subList = await stripeClient.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      subscriptions = subList.data;
    }

    // ============================================
    // STEP 4: Determine subscription status
    // ============================================
    if (subscriptions.length === 0) {
      logStep("No active subscription found");
      
      // Update database to reflect no subscription
      await supabaseClient
        .from("user_subscriptions")
        .upsert({
          user_id: user.id,
          status: "inactive",
          plan_name: "free",
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "user_id",
        });

      return new Response(
        JSON.stringify({
          subscribed: false,
          tier: "free",
          message: "No active subscription",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ============================================
    // STEP 5: Extract subscription details
    // ============================================
    const subscription = subscriptions[0];
    const subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
    const subscriptionStart = new Date(subscription.current_period_start * 1000).toISOString();

    // Get the product ID to determine tier
    // For V2 accounts, use customer_account instead of customer
    const productId = subscription.items.data[0]?.price?.product;
    const productIdStr = typeof productId === "string" ? productId : productId?.id;
    const tier = PRODUCT_TO_TIER[productIdStr || ""] || "pro";

    logStep("Active subscription found", {
      subscriptionId: subscription.id,
      productId: productIdStr,
      tier,
      endDate: subscriptionEnd,
    });

    // ============================================
    // STEP 6: Update database with subscription info
    // ============================================
    await supabaseClient
      .from("user_subscriptions")
      .upsert({
        user_id: user.id,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0]?.price?.id,
        plan_name: tier,
        status: subscription.status,
        current_period_start: subscriptionStart,
        current_period_end: subscriptionEnd,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });

    logStep("Database updated with subscription status");

    // ============================================
    // STEP 7: Return subscription details
    // ============================================
    return new Response(
      JSON.stringify({
        subscribed: true,
        tier: tier,
        planName: tier.charAt(0).toUpperCase() + tier.slice(1),
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscriptionEnd,
        currentPeriodStart: subscriptionStart,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
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
