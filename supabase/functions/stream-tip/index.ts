import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { streamId, amount, tipperName, message } = await req.json();

    if (!streamId || !amount || amount < 1) {
      throw new Error("Stream ID and valid amount are required");
    }

    // Get stream info
    const { data: stream, error: streamError } = await supabaseClient
      .from("streams")
      .select("*")
      .eq("id", streamId)
      .single();

    if (streamError || !stream) {
      throw new Error("Stream not found");
    }

    // Calculate 90/10 split
    const creatorAmount = amount * 0.9;
    const platformFee = amount * 0.1;

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Create Stripe checkout session for the tip
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Tip for ${stream.title}`,
              description: message ? `Message: ${message}` : "Support the creator!",
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/stream/${streamId}?tip=success`,
      cancel_url: `${req.headers.get("origin")}/stream/${streamId}?tip=cancelled`,
      metadata: {
        streamId,
        tipperName: tipperName || "Anonymous",
        message: message || "",
        creatorAmount: creatorAmount.toString(),
        platformFee: platformFee.toString(),
      },
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
