import { describe,it,expect } from "vitest";
import { calculateRecurringRevenue,percent } from "../src/lib/founder-metrics";
import { readFileSync } from "node:fs";
const read=(path:string)=>readFileSync(new URL("../"+path,import.meta.url),"utf8");
describe("founder metrics",()=>{
 it("normalises annual and monthly prices and quantity",()=>{
  expect(calculateRecurringRevenue([{amount:12000,currency:"gbp",interval:"year",intervalCount:1,quantity:1},{amount:700,currency:"gbp",interval:"month",intervalCount:1,quantity:2}])).toEqual({mrrByCurrency:{gbp:2400},arrByCurrency:{gbp:28800}});
 });
 it("keeps currencies separate and handles empty inputs",()=>{
  expect(calculateRecurringRevenue([]).mrrByCurrency).toEqual({});
  expect(calculateRecurringRevenue([{amount:100,currency:"usd",interval:"month",intervalCount:2,quantity:1},{amount:200,currency:"gbp",interval:"month",intervalCount:1,quantity:1}]).mrrByCurrency).toEqual({usd:50,gbp:200});
 });
 it("rejects invalid intervals and counts",()=>{expect(()=>calculateRecurringRevenue([{amount:100,currency:"gbp",interval:"month",intervalCount:0,quantity:1}])).toThrow();});
 it("handles empty denominators",()=>{expect(percent(0,0)).toBeNull();expect(percent(5,87)).toBe(5.7);});
 it("requires server-side super admin and service role RPC",()=>{
  const api=read("api/founder-intelligence.ts"),sql=read("supabase/migrations/20261126120000_founder_intelligence.sql");
  expect(api).toContain('admin?.role !== "super_admin"');
  expect(api).toContain("verifyAuth(req)");
  expect(sql).toContain("revoke all on function public.founder_snapshot(uuid,integer) from public, anon, authenticated");
  expect(sql).toContain("unique(user_id,event_type,event_key)");
 });
});
