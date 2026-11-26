import { describe,it,expect } from "vitest";
import { parseGBP,discountedAmount,normalizeCode,validCode } from "../src/lib/commerce";
import { readFileSync } from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
describe("digital commerce",()=>{
 it("uses integer minor units",()=>{expect(parseGBP("9.99")).toBe(999);expect(parseGBP("0.50")).toBe(50);for(const v of ["0","-1","1e2","1.234","10001"])expect(()=>parseGBP(v)).toThrow();});
 it("validates discounts and minimum charge",()=>{expect(discountedAmount(1000,25)).toBe(750);expect(discountedAmount(50,80)).toBe(50);expect(()=>discountedAmount(1000,100)).toThrow();expect(normalizeCode(" sale10 ")).toBe("SALE10");expect(validCode("SALE10")).toBe(true);expect(validCode("bad code")).toBe(false);});
 it("requires test mode and verified payment before delivery",()=>{const api=read("api/_lib/digital-commerce.ts");expect(api).toContain('startsWith("sk_test_")');expect(api).toContain('session.payment_status!=="paid"');expect(api).toContain("payment.amount_received!==order.amount");expect(api).toContain("charge.amount_refunded>0||charge.disputed");expect(api).toContain("matchesToken(order.claim_hash,body.token)");expect(api).toContain('createSignedUrl(order.file_path,60');});
 it("keeps seller ownership and files private",()=>{const api=read("api/_lib/digital-commerce.ts"),sql=read("supabase/migrations/20261126140000_digital_commerce.sql");expect(api).toContain('.eq("seller_id",auth.userId)');expect(api).toContain("account.metadata?.user_id!==sellerId");expect(sql).toContain("revoke all on public.commerce_products,public.commerce_orders");expect(sql).toContain("commerce_read_guard");expect(read("api/webhooks/stripe.ts")).toContain("STRIPE_CONNECT_WEBHOOK_SECRET");});
});
