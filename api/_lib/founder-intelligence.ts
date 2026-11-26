import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { verifyAuth, unauthorized } from "./auth.js";
import { handleCors } from "./cors.js";
import { isRateLimited, tooManyRequests } from "./rate-limit.js";
import { recordFounderEvent } from "./founder-events.js";
import { calculateRecurringRevenue } from "../../src/lib/founder-metrics.js";
import { PRICING_PLANS } from "../../src/lib/stripe-products.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "private, no-store");
  if (handleCors(req,res)) return;
  if (req.method !== "POST") return res.status(405).json({error:"Method not allowed"});
  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);
  if (isRateLimited("founder:"+auth.userId,30)) return tooManyRequests(res);
  try {
    const { action, event, days = 30 } = req.body || {};
    if (action === "track") {
      if (event !== "dashboard_opened" && event !== "pricing_viewed") return res.status(400).json({error:"Invalid event"});
      await recordFounderEvent(auth.userId,event,new Date().toISOString().slice(0,10));
      return res.status(200).json({success:true});
    }
    if (action !== "snapshot" || ![7,30,90].includes(days)) return res.status(400).json({error:"Invalid request"});
    const db = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",process.env.SUPABASE_SERVICE_ROLE_KEY || "");
    const {data: admin,error: adminError} = await db.from("admin_users").select("role").eq("user_id",auth.userId).maybeSingle();
    if (adminError) throw adminError;
    if (admin?.role !== "super_admin") return res.status(403).json({error:"Founder access required"});
    const {data,error} = await db.rpc("founder_snapshot",{p_admin:auth.userId,p_days:days});
    if (error) throw error;
    const onboardingResult = await db.rpc("founder_onboarding_snapshot",{p_admin:auth.userId});
    const onboarding = onboardingResult.error ? null : onboardingResult.data;
    let revenue = null;
    try {
      if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe not configured");
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY,{apiVersion:"2025-04-30.basil" as any});
      const known = new Set(PRICING_PLANS.filter(p=>p.id!=="free").flatMap(p=>[p.stripeProductId,...Object.values(p.stripePriceIds)].filter(Boolean)));
      const items: {amount:number;currency:string;interval:string;intervalCount:number;quantity:number}[] = [];
      let count = 0;
      for await (const sub of stripe.subscriptions.list({status:"active",limit:100})) {
        if (!["pro","business","enterprise"].includes(sub.metadata?.tier) && !sub.items.data.some(i=>known.has(i.price.id)||known.has(typeof i.price.product==="string"?i.price.product:i.price.product.id))) continue;
        count++;
        if (sub.items.has_more) throw new Error("Subscription items require pagination");
        for (const i of sub.items.data) {
          if (i.price.unit_amount === null || !i.price.recurring || i.price.recurring.usage_type==="metered") throw new Error("Unsupported recurring price");
          items.push({amount:i.price.unit_amount,currency:i.price.currency,interval:i.price.recurring.interval,intervalCount:i.price.recurring.interval_count,quantity:i.quantity??1});
        }
      }
      revenue = {...calculateRecurringRevenue(items),activeSubscriptions:count};
    } catch (err) { console.error("Founder revenue unavailable",err); }
    return res.status(200).json({...data,onboarding,revenue,generatedAt:new Date().toISOString(),days});
  } catch (err) {
    console.error("Founder intelligence unavailable",err);
    return res.status(503).json({error:"Analytics unavailable. Check database migration and server configuration."});
  }
}
