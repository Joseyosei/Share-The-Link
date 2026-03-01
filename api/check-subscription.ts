import type { VercelRequest, VercelResponse } from "@vercel/node";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "./_lib/cors";
import { verifyAuth, unauthorized } from "./_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil" as any,
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

const PRICE_TO_TIER: Record<string, string> = {
  "price_1SwbcFE2FuZ01nXUSQxTa1zF": "pro",
  "price_1SwbdIE2FuZ01nXUnGw4a2Yn": "business",
  "price_1SwbfRE2FuZ01nXU1UJvDqrO": "enterprise",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit: 30 req/min per IP
  if (isRateLimited(getClientIp(req), 30)) return tooManyRequests(res);

  // Auth: verify identity from JWT, never trust req.body
  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    const email = auth.email;
    const userId = auth.userId;
    if (!email) return res.status(200).json({ subscribed: false, tier: "free" });

    const { data: dbSub } = await supabaseAdmin
      .from("user_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .in("status", ["active", "trialing"])
      .single();

    if (dbSub) {
      const tier = PRICE_TO_TIER[dbSub.stripe_price_id] || dbSub.plan_name?.toLowerCase() || "pro";
      return res.status(200).json({
        subscribed: true, tier,
        planName: tier.charAt(0).toUpperCase() + tier.slice(1),
        subscriptionId: dbSub.stripe_subscription_id,
        status: dbSub.status,
        currentPeriodStart: dbSub.current_period_start,
        currentPeriodEnd: dbSub.current_period_end,
        cancelAtPeriodEnd: dbSub.cancel_at_period_end,
      });
    }

    const customers = await stripe.customers.list({ email, limit: 1 });
    if (customers.data.length === 0) return res.status(200).json({ subscribed: false, tier: "free" });

    const customerId = customers.data[0].id;

    for (const status of ["active", "trialing"] as const) {
      const subs = await stripe.subscriptions.list({ customer: customerId, status, limit: 1 });
      if (subs.data.length > 0) {
        const sub: any = subs.data[0];
        const priceId = sub.items.data[0]?.price.id;
        const tier = PRICE_TO_TIER[priceId] || sub.metadata?.tier || "pro";

        await supabaseAdmin.from("user_subscriptions").upsert({
            user_id: userId,
            stripe_subscription_id: sub.id,
            stripe_price_id: priceId,
            plan_name: tier.charAt(0).toUpperCase() + tier.slice(1),
            status: sub.status,
            current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
            current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

        return res.status(200).json({
          subscribed: true, tier,
          planName: tier.charAt(0).toUpperCase() + tier.slice(1),
          subscriptionId: sub.id,
          status: sub.status,
          currentPeriodStart: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          currentPeriodEnd: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        });
      }
    }

    return res.status(200).json({ subscribed: false, tier: "free" });
  } catch (error) {
    console.error("Subscription check error:", error);
    return res.status(200).json({ subscribed: false, tier: "free" });
  }
}
