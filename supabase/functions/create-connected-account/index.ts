/**
 * CREATE CONNECTED ACCOUNT - Edge Function
 * 
 * Creates a new Stripe Connect account (V2 API) for a user.
 * This enables users to receive payments through the platform.
 * 
 * IMPORTANT: Uses Stripe Connect V2 API - do NOT use type: 'express' or 'standard'
 * 
 * @see https://docs.stripe.com/connect/interactive-platform-guide
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// CORS headers required for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper for consistent logging
const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONNECTED-ACCOUNT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // ============================================
    // STEP 1: Validate environment variables
    // ============================================
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      // PLACEHOLDER: Add your Stripe secret key in the Supabase dashboard
      throw new Error("STRIPE_SECRET_KEY is not configured. Please add it in your project secrets.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not configured.");
    }

    // ============================================
    // STEP 2: Authenticate the user
    // ============================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      throw new Error(`Authentication failed: ${userError?.message || "User not found"}`);
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    // ============================================
    // STEP 3: Check if user already has a connected account
    // ============================================
    const { data: existingAccount } = await supabaseClient
      .from("connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (existingAccount) {
      logStep("User already has connected account", { accountId: existingAccount.stripe_account_id });
      return new Response(
        JSON.stringify({ 
          success: true, 
          accountId: existingAccount.stripe_account_id,
          message: "Connected account already exists" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ============================================
    // STEP 4: Parse request body for account details
    // ============================================
    const { displayName, contactEmail } = await req.json();

    // Use provided values or fall back to user data
    const accountDisplayName = displayName || user.user_metadata?.full_name || "Creator";
    const accountEmail = contactEmail || user.email;

    if (!accountEmail) {
      throw new Error("Email is required to create a connected account");
    }

    logStep("Creating connected account", { displayName: accountDisplayName, email: accountEmail });

    // ============================================
    // STEP 5: Create Stripe Connected Account using V2 API
    // ============================================
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // IMPORTANT: Using V2 API structure - do NOT use type: 'express' or 'standard'
    // The V2 API uses a different structure with configuration objects
    const account = await stripeClient.v2.core.accounts.create({
      // Display name shown in the Stripe Dashboard
      display_name: accountDisplayName,
      
      // Primary contact email for the connected account
      contact_email: accountEmail,
      
      // Identity configuration - country determines available features
      identity: {
        country: "gb", // UK-based accounts (change as needed)
      },
      
      // Dashboard access level for the connected account
      // 'full' gives access to the full Stripe Dashboard
      dashboard: "full",
      
      // Default settings for the account
      defaults: {
        responsibilities: {
          // Platform collects fees via Stripe (recommended)
          fees_collector: "stripe",
          // Platform handles losses via Stripe (recommended)
          losses_collector: "stripe",
        },
      },
      
      // Configuration for different use cases
      configuration: {
        // Customer configuration (for managing customers)
        customer: {},
        
        // Merchant configuration (for accepting payments)
        merchant: {
          capabilities: {
            // Enable card payment processing
            card_payments: {
              requested: true,
            },
          },
        },
      },
    });

    logStep("Stripe account created", { stripeAccountId: account.id });

    // ============================================
    // STEP 6: Store the connected account in database
    // ============================================
    const { error: insertError } = await supabaseClient
      .from("connected_accounts")
      .insert({
        user_id: user.id,
        stripe_account_id: account.id,
        display_name: accountDisplayName,
        contact_email: accountEmail,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
      });

    if (insertError) {
      logStep("Database insert error", { error: insertError.message });
      // Account was created in Stripe but failed to save - this is a critical error
      throw new Error(`Failed to save connected account: ${insertError.message}`);
    }

    logStep("Connected account saved to database");

    // ============================================
    // STEP 7: Return success response
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        accountId: account.id,
        message: "Connected account created successfully",
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
