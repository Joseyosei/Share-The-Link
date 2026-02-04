/**
 * CREATE SUBSCRIPTION CHECKOUT - Edge Function
 * 
 * Creates a Stripe Checkout session for platform subscriptions.
 * This is for users subscribing to the platform's pricing plans (Free, Pro, Business, Enterprise).
 * 
 * Uses customer_account for V2 accounts where the connected account IS the customer.
 * 
 * @see https://docs.stripe.com/billing/subscriptions/checkout
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
  console.log(`[CREATE-SUBSCRIPTION-CHECKOUT] ${step}${detailsStr}`);
};

// Platform pricing tiers with their Stripe price IDs
// TODO: Update these with your actual Stripe price IDs
const PRICING_TIERS = {
  free: {
    name: "Free",
    priceId: "price_1SwbaTE2FuZ01nXUfyaL9wSS",
    productId: "prod_TuQRMlT6Gfn7Sv",
  },
  pro: {
    name: "Pro",
    priceId: "price_1SwbcFE2FuZ01nXUSQxTa1zF",
    productId: "prod_TuQTRlytxHScfY",
  },
  business: {
    name: "Business",
    priceId: "price_1SwbdIE2FuZ01nXUnGw4a2Yn",
    productId: "prod_TuQUStzRn07sTU",
  },
  enterprise: {
    name: "Enterprise",
    priceId: "price_1SwbfRE2FuZ01nXU1UJvDqrO",
    productId: "prod_TuQWHzMKX8eKbS",
  },
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
    // STEP 3: Parse subscription request
    // ============================================
    const { tier } = await req.json();

    if (!tier || !PRICING_TIERS[tier as keyof typeof PRICING_TIERS]) {
      throw new Error(`Invalid tier. Choose from: ${Object.keys(PRICING_TIERS).join(", ")}`);
    }

    const selectedTier = PRICING_TIERS[tier as keyof typeof PRICING_TIERS];
    logStep("Selected tier", { tier, priceId: selectedTier.priceId });

    // ============================================
    // STEP 4: Check for existing connected account
    // ============================================
    const { data: connectedAccount } = await supabaseClient
      .from("connected_accounts")
      .select("stripe_account_id")
      .eq("user_id", user.id)
      .single();

    const hasConnectedAccount = !!connectedAccount?.stripe_account_id;
    logStep("Connected account check", { hasConnectedAccount });

    // ============================================
    // STEP 5: Get the origin URL for redirects
    // ============================================
    const origin = req.headers.get("origin") || "http://localhost:5173";

    // ============================================
    // STEP 6: Create Stripe client and checkout session
    // ============================================
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer already exists
    const customers = await stripeClient.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    // Build checkout session options
    interface CheckoutSessionCreateParams {
      line_items: { price: string; quantity: number }[];
      mode: "subscription";
      success_url: string;
      cancel_url: string;
      customer?: string;
      customer_email?: string;
      customer_account?: string;
      subscription_data?: {
        metadata: Record<string, string>;
      };
      metadata: Record<string, string>;
    }

    const sessionParams: CheckoutSessionCreateParams = {
      line_items: [
        {
          price: selectedTier.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: {
        userId: user.id,
        tier: tier,
      },
    };

    // If user has a connected account, use customer_account
    // This is the V2 way - the connected account ID serves as both customer and account
    if (hasConnectedAccount) {
      // For V2 accounts, use customer_account instead of customer
      sessionParams.customer_account = connectedAccount!.stripe_account_id;
      logStep("Using customer_account for V2 account");
    } else if (customerId) {
      sessionParams.customer = customerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    // Add subscription metadata
    sessionParams.subscription_data = {
      metadata: {
        userId: user.id,
        tier: tier,
        planName: selectedTier.name,
      },
    };

    // Create the checkout session
    const session = await stripeClient.checkout.sessions.create(sessionParams as Stripe.Checkout.SessionCreateParams);

    logStep("Checkout session created", { sessionId: session.id });

    // ============================================
    // STEP 7: Return checkout URL
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        url: session.url,
        sessionId: session.id,
        tier: selectedTier.name,
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
