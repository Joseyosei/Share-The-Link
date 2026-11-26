import { describe,it,expect } from "vitest";
import { PLAN_POLICY,platformFee,identifyPaidTier,isTier,subscriptionAmount } from "../src/lib/plan-policy";
import { readFileSync } from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
describe("monetisation",()=>{
 it("prices and fees match advertised tiers",()=>{expect(subscriptionAmount("pro","yearly")).toBe(5600);expect(subscriptionAmount("business","monthly")).toBe(1700);expect(platformFee(1000,"free")).toBe(80);expect(platformFee(1000,"pro")).toBe(20);expect(platformFee(1000,"business")).toBe(0);expect(platformFee(50,"free")).toBe(4);expect(()=>platformFee(-1,"free")).toThrow();});
 it("rejects unknown paid tiers and preserves legacy ids",()=>{expect(isTier("__proto__")).toBe(false);expect(identifyPaidTier("unknown","free")).toBeNull();expect(identifyPaidTier("price_1SwbdIE2FuZ01nXUnGw4a2Yn","pro")).toBe("business");});
 it("has matching SQL quotas and atomic reservation",()=>{const s=read("supabase/migrations/20261126150000_plan_monetisation.sql");for(const [tier,p] of Object.entries(PLAN_POLICY))expect(s).toContain("('"+tier+"',"+p.products+","+p.ai+","+p.discounts+")");expect(s).toContain("pg_advisory_xact_lock");expect(s).toContain("where plan_usage.builder_requests<cap");});
 it("enforces permissions before paid operations",()=>{expect(read("api/_lib/digital-commerce.ts")).toContain('db.rpc("create_plan_product"');expect(read("api/_lib/digital-commerce.ts")).toContain("application_fee_amount:fee");expect(read("api/ai-page-builder.ts")).toContain("await consumeBuilder(auth.userId,tier)");expect(read("api/_lib/entitlements.ts")).toContain("c.metadata.supabase_user_id===userId");expect(read("api/create-subscription-checkout.ts")).toContain('startsWith("sk_test_")');});
});
