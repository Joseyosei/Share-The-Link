/**
 * STRIPE CONNECT WEBHOOK - Edge Function
 * 
 * Handles Stripe webhooks for:
 * 1. Connect account updates (thin events - V2 API)
 * 2. Subscription updates (standard events)
 * 
 * For V2 accounts, use thin events with:
 * - v2.core.account[requirements].updated
 * - v2.core.account[configuration.merchant].capability_status_updated
 * 
 * For subscriptions, handle standard events:
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * 
 * @see https://docs.stripe.com/webhooks
 * @see https://docs.stripe.com/connect/webhooks
 */

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-CONNECT-WEBHOOK] ${step}${detailsStr}`);
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
    logStep("Webhook received");

    // ============================================
    // STEP 1: Validate environment
    // ============================================
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Note: Webhook secret is optional for development
    // In production, you should always verify the signature
    if (!webhookSecret) {
      logStep("WARNING: STRIPE_WEBHOOK_SECRET not configured - signature verification skipped");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: { persistSession: false },
    });

    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: "2025-08-27.basil",
    });

    // ============================================
    // STEP 2: Get the raw body and signature
    // ============================================
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    // ============================================
    // STEP 3: Determine event type (thin vs standard)
    // ============================================
    // Check if this is a thin event (V2 API) by looking at the payload structure
    let event: Stripe.Event;
    let isThinEvent = false;

    try {
      const parsed = JSON.parse(body);
      
      // Thin events have a different structure
      if (parsed.type?.startsWith("v2.")) {
        isThinEvent = true;
        logStep("Processing thin event (V2 API)");
        
        // For thin events, use parseThinEvent if signature is provided
        if (webhookSecret && signature) {
          const thinEvent = stripeClient.parseThinEvent(body, signature, webhookSecret);
          logStep("Thin event parsed", { id: thinEvent.id, type: thinEvent.type });
          
          // Fetch the full event data
          const fullEvent = await stripeClient.v2.core.events.retrieve(thinEvent.id);
          
          // Handle V2 account events
          await handleV2AccountEvent(supabaseClient, stripeClient, thinEvent.type, fullEvent);
        } else {
          // Without signature verification (development only)
          await handleV2AccountEvent(supabaseClient, stripeClient, parsed.type, parsed);
        }
        
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
    } catch (parseError) {
      logStep("Parse error (might be standard event)", { error: String(parseError) });
    }

    // ============================================
    // STEP 4: Process standard webhook events
    // ============================================
    if (webhookSecret && signature) {
      try {
        event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        logStep("Signature verification failed", { error: String(err) });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      // Development mode - parse without verification
      event = JSON.parse(body) as Stripe.Event;
    }

    logStep("Processing event", { type: event.type, id: event.id });

    // ============================================
    // STEP 5: Handle standard subscription events
    // ============================================
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabaseClient, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseClient, subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Invoice paid", { 
          invoiceId: invoice.id, 
          customerId: invoice.customer,
          amount: invoice.amount_paid,
        });
        break;
      }

      case "payment_method.attached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        logStep("Payment method attached", { 
          methodId: paymentMethod.id, 
          customerId: paymentMethod.customer,
        });
        break;
      }

      case "payment_method.detached": {
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        logStep("Payment method detached", { methodId: paymentMethod.id });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/**
 * Handle V2 Account events (thin events)
 */
// deno-lint-ignore no-explicit-any
async function handleV2AccountEvent(
  supabaseClient: any,
  stripeClient: Stripe,
  eventType: string,
  eventData: unknown
) {
  logStep("Handling V2 account event", { type: eventType });

  // Extract account ID from the event
  // V2 events have different structures - adjust based on actual event format
  const event = eventData as { related_object?: { id: string } };
  const accountId = event.related_object?.id;

  if (!accountId) {
    logStep("No account ID found in event");
    return;
  }

  switch (eventType) {
    case "v2.core.account[requirements].updated": {
      // Requirements changed - fetch fresh status and update DB
      logStep("Account requirements updated", { accountId });
      
      try {
        const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
          include: ["configuration.merchant", "requirements"],
        });

        // Determine onboarding status
        const requirementsStatus = account.requirements?.summary?.minimum_deadline?.status;
        const onboardingComplete = requirementsStatus !== "currently_due" && 
                                   requirementsStatus !== "past_due";

        // Update database
        await supabaseClient
          .from("connected_accounts")
          .update({
            onboarding_complete: onboardingComplete,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", accountId);

        logStep("Requirements status updated in DB", { onboardingComplete });
      } catch (err) {
        logStep("Error fetching account details", { error: String(err) });
      }
      break;
    }

    case "v2.core.account[configuration.merchant].capability_status_updated": {
      // Capability status changed
      logStep("Merchant capability updated", { accountId });
      
      try {
        const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
          include: ["configuration.merchant"],
        });

        const cardPaymentsStatus = account.configuration?.merchant?.capabilities?.card_payments?.status;
        const chargesEnabled = cardPaymentsStatus === "active";

        await supabaseClient
          .from("connected_accounts")
          .update({
            charges_enabled: chargesEnabled,
            payouts_enabled: chargesEnabled, // Simplified - adjust as needed
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_account_id", accountId);

        logStep("Capability status updated in DB", { chargesEnabled });
      } catch (err) {
        logStep("Error updating capability status", { error: String(err) });
      }
      break;
    }

    default:
      logStep("Unhandled V2 event type", { type: eventType });
  }
}

/**
 * Handle subscription update events
 */
// deno-lint-ignore no-explicit-any
async function handleSubscriptionUpdate(
  supabaseClient: any,
  subscription: Stripe.Subscription
) {
  logStep("Handling subscription update", { 
    subscriptionId: subscription.id,
    status: subscription.status,
  });

  // Get user ID from subscription metadata
  const userId = subscription.metadata?.userId;
  
  // For V2 accounts, get the account from customer_account
  // Note: customer_account is used instead of customer for V2
  const accountId = (subscription as unknown as { customer_account?: string }).customer_account;

  if (!userId && !accountId) {
    logStep("No user ID or account ID found in subscription");
    return;
  }

  // Get product ID to determine tier
  const productId = subscription.items.data[0]?.price?.product;
  const productIdStr = typeof productId === "string" ? productId : productId?.id;
  const tier = PRODUCT_TO_TIER[productIdStr || ""] || "unknown";

  // Determine user ID from connected account if not in metadata
  let finalUserId = userId;
  if (!finalUserId && accountId) {
    const { data: connectedAccount } = await supabaseClient
      .from("connected_accounts")
      .select("user_id")
      .eq("stripe_account_id", accountId)
      .single();
    
    finalUserId = connectedAccount?.user_id;
  }

  if (!finalUserId) {
    logStep("Could not determine user ID for subscription");
    return;
  }

  // Update or insert subscription record
  const { error } = await supabaseClient
    .from("user_subscriptions")
    .upsert({
      user_id: finalUserId,
      stripe_account_id: accountId || null,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price?.id,
      plan_name: tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    });

  if (error) {
    logStep("Error updating subscription in DB", { error: error.message });
  } else {
    logStep("Subscription updated in DB", { userId: finalUserId, tier, status: subscription.status });
  }
}

/**
 * Handle subscription deletion events
 */
// deno-lint-ignore no-explicit-any
async function handleSubscriptionDeleted(
  supabaseClient: any,
  subscription: Stripe.Subscription
) {
  logStep("Handling subscription deletion", { subscriptionId: subscription.id });

  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    logStep("No user ID found in deleted subscription");
    return;
  }

  // Mark subscription as inactive
  const { error } = await supabaseClient
    .from("user_subscriptions")
    .update({
      status: "canceled",
      plan_name: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    logStep("Error updating deleted subscription in DB", { error: error.message });
  } else {
    logStep("Subscription marked as canceled in DB", { userId });
  }
}
