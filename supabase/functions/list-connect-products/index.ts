/**
 * LIST CONNECT PRODUCTS - Edge Function
 * 
 * Lists products from a connected account's Stripe storefront.
 * Uses the Stripe-Account header to fetch products on behalf of connected accounts.
 * 
 * This can be called publicly (for storefront) or by the account owner.
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
  console.log(`[LIST-CONNECT-PRODUCTS] ${step}${detailsStr}`);
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    // ============================================
    // STEP 2: Parse request for account ID
    // ============================================
    // The accountId can come from URL params or request body
    const url = new URL(req.url);
    let accountId = url.searchParams.get("accountId");

    if (!accountId && req.method === "POST") {
      const body = await req.json();
      accountId = body.accountId;
    }

    // TODO: In production, you should use a different identifier (like username)
    // instead of exposing the Stripe account ID in the URL.
    // For this demo, we're using the account ID directly.

    if (!accountId) {
      throw new Error("Account ID is required. Pass it as ?accountId=acct_xxx or in the request body.");
    }

    logStep("Fetching products for account", { accountId });

    // ============================================
    // STEP 3: Verify the account exists in our database
    // ============================================
    const supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);

    const { data: connectedAccount, error: accountError } = await supabaseClient
      .from("connected_accounts")
      .select("*")
      .eq("stripe_account_id", accountId)
      .single();

    if (accountError || !connectedAccount) {
      throw new Error("Connected account not found");
    }

    logStep("Account verified", { displayName: connectedAccount.display_name });

    // ============================================
    // STEP 4: Fetch products from Stripe
    // ============================================
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // List products on the connected account with expanded price data
    // IMPORTANT: Use stripeAccount option to fetch from connected account
    const products = await stripeClient.products.list(
      {
        limit: 20,
        active: true,
        // Expand the default_price to get price details
        expand: ["data.default_price"],
      },
      {
        // This sets the Stripe-Account header
        stripeAccount: accountId,
      }
    );

    logStep("Products fetched from Stripe", { count: products.data.length });

    // ============================================
    // STEP 5: Format products for response
    // ============================================
    const formattedProducts = products.data.map((product: Stripe.Product) => {
      const price = product.default_price as Stripe.Price | null;
      
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        
        // Price details
        priceId: price?.id,
        priceAmount: price?.unit_amount || 0,
        currency: price?.currency || "gbp",
        
        // Formatted price for display
        formattedPrice: price?.unit_amount 
          ? `£${(price.unit_amount / 100).toFixed(2)}`
          : "Price not set",
        
        // Metadata
        active: product.active,
        created: product.created,
      };
    });

    // ============================================
    // STEP 6: Return products with store info
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        store: {
          name: connectedAccount.display_name,
          accountId: accountId,
        },
        products: formattedProducts,
        count: formattedProducts.length,
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
