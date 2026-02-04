/**
 * CREATE CONNECT CHECKOUT - Edge Function
 * 
 * Creates a Stripe Checkout session for purchasing from a connected account.
 * Uses Direct Charges with an application fee for platform monetization.
 * 
 * @see https://docs.stripe.com/connect/direct-charges
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
  console.log(`[CREATE-CONNECT-CHECKOUT] ${step}${detailsStr}`);
};

// Application fee percentage (10% = 0.10)
// TODO: Adjust this percentage based on your business model
const APPLICATION_FEE_PERCENT = 0.10;

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
    // STEP 2: Parse checkout request
    // ============================================
    const { 
      accountId,      // The connected account selling the product
      priceId,        // The Stripe price ID to charge
      productName,    // Product name for display
      quantity = 1,   // Quantity to purchase
    } = await req.json();

    if (!accountId || !priceId) {
      throw new Error("Account ID and Price ID are required");
    }

    logStep("Checkout request", { accountId, priceId, quantity });

    // ============================================
    // STEP 3: Verify the connected account exists
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

    if (!connectedAccount.charges_enabled) {
      throw new Error("This seller is not yet ready to accept payments");
    }

    logStep("Account verified", { displayName: connectedAccount.display_name });

    // ============================================
    // STEP 4: Get the origin URL for redirects
    // ============================================
    const origin = req.headers.get("origin") || "http://localhost:5173";

    // ============================================
    // STEP 5: Fetch price details to calculate application fee
    // ============================================
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Fetch the price from the connected account
    const price = await stripeClient.prices.retrieve(priceId, {}, {
      stripeAccount: accountId,
    });

    if (!price.unit_amount) {
      throw new Error("Price does not have a valid amount");
    }

    // Calculate application fee (platform's cut)
    const totalAmount = price.unit_amount * quantity;
    const applicationFeeAmount = Math.round(totalAmount * APPLICATION_FEE_PERCENT);

    logStep("Price calculated", {
      priceAmount: price.unit_amount,
      quantity,
      totalAmount,
      applicationFeeAmount,
    });

    // ============================================
    // STEP 6: Create Checkout Session with Direct Charge
    // ============================================
    const session = await stripeClient.checkout.sessions.create(
      {
        // Line items for the checkout
        line_items: [
          {
            price: priceId,
            quantity: quantity,
          },
        ],
        
        // Payment intent data with application fee
        payment_intent_data: {
          // This is where you set the platform's application fee
          // The connected account receives (total - applicationFee)
          application_fee_amount: applicationFeeAmount,
        },
        
        // One-time payment mode
        mode: "payment",
        
        // Redirect URLs after checkout
        // Include session_id so we can verify the payment
        success_url: `${origin}/store/${accountId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/store/${accountId}`,
        
        // Optional: Collect customer email
        customer_creation: "if_required",
        
        // Metadata for tracking
        metadata: {
          connectedAccountId: accountId,
          productName: productName || "Product",
        },
      },
      {
        // IMPORTANT: Create the checkout session on the connected account
        // This is a Direct Charge - the connected account is the merchant of record
        stripeAccount: accountId,
      }
    );

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    // ============================================
    // STEP 7: Return checkout URL
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        sessionId: session.id,
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
