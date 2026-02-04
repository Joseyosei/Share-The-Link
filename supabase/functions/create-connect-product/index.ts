/**
 * CREATE CONNECT PRODUCT - Edge Function
 * 
 * Creates a product on a connected account's Stripe.
 * Uses the Stripe-Account header to create products on behalf of connected accounts.
 * 
 * @see https://docs.stripe.com/connect/authentication
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
  console.log(`[CREATE-CONNECT-PRODUCT] ${step}${detailsStr}`);
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
    // STEP 3: Get user's connected account
    // ============================================
    const { data: connectedAccount, error: accountError } = await supabaseClient
      .from("connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (accountError || !connectedAccount) {
      throw new Error("No connected account found. Please complete onboarding first.");
    }

    if (!connectedAccount.charges_enabled) {
      throw new Error("Your account is not yet ready to accept payments. Please complete onboarding.");
    }

    const stripeAccountId = connectedAccount.stripe_account_id;
    logStep("Found connected account", { accountId: stripeAccountId });

    // ============================================
    // STEP 4: Parse product details from request
    // ============================================
    const { name, description, priceInCents, currency = "gbp" } = await req.json();

    if (!name || !priceInCents) {
      throw new Error("Product name and price are required");
    }

    if (priceInCents < 50) {
      throw new Error("Minimum price is 50 pence (£0.50)");
    }

    logStep("Creating product", { name, priceInCents, currency });

    // ============================================
    // STEP 5: Create product on connected account
    // ============================================
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // IMPORTANT: Use stripeAccount option to create on connected account
    // This sets the Stripe-Account header for the request
    const product = await stripeClient.products.create(
      {
        name: name,
        description: description || undefined,
        // Create the default price at the same time
        default_price_data: {
          unit_amount: priceInCents,
          currency: currency.toLowerCase(),
        },
      },
      {
        // This is how you pass the connected account header in the Node/Deno SDK
        stripeAccount: stripeAccountId,
      }
    );

    logStep("Product created on Stripe", { productId: product.id });

    // ============================================
    // STEP 6: Save product to database
    // ============================================
    const { data: savedProduct, error: insertError } = await supabaseClient
      .from("connect_products")
      .insert({
        connected_account_id: connectedAccount.id,
        stripe_product_id: product.id,
        stripe_price_id: typeof product.default_price === "string" 
          ? product.default_price 
          : product.default_price?.id,
        name: name,
        description: description || null,
        price_amount: priceInCents,
        currency: currency.toLowerCase(),
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      logStep("Database insert error", { error: insertError.message });
      throw new Error(`Failed to save product: ${insertError.message}`);
    }

    logStep("Product saved to database", { productId: savedProduct.id });

    // ============================================
    // STEP 7: Return success response
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        product: {
          id: savedProduct.id,
          stripeProductId: product.id,
          stripePriceId: savedProduct.stripe_price_id,
          name: name,
          description: description,
          priceInCents: priceInCents,
          currency: currency,
        },
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
