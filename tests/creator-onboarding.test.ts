import { describe,it,expect } from "vitest";
import { isCreatorGoal,setupProgress,GOALS } from "../src/lib/creator-onboarding";
import { readFileSync } from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
describe("creator onboarding",()=>{
 it("validates goal allowlist",()=>{for(const g of Object.keys(GOALS))expect(isCreatorGoal(g)).toBe(true);expect(isCreatorGoal("__proto__")).toBe(false);expect(isCreatorGoal(null)).toBe(false);});
 it("does not mark an empty page as activated or copied",()=>{const v=setupProgress({goal:"sell",profileReady:true,hasPage:true,activeLinks:0,copied:true});expect(v.ready).toBe(false);expect(v.completed).toBe(2);});
 it("calculates real completion",()=>{expect(setupProgress({goal:"audience",profileReady:true,hasPage:true,activeLinks:1,copied:true}).completed).toBe(4);});
 it("keeps routing within existing function and verifies server identity",()=>{expect(read("api/analytics-data.ts")).toContain('req.query.scope === "onboarding"');expect(read("api/_lib/creator-onboarding.ts")).toContain("p_user:auth.userId");expect(read("supabase/migrations/20261126130000_creator_onboarding.sql")).toContain("revoke all on function public.sync_creator_onboarding(uuid,text,boolean) from public, anon, authenticated");});
});
