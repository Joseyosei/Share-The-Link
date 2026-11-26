import { describe,it,expect } from "vitest";
import { isCreatorGoal,setupProgress,GOALS,parseLocalSetup,mergeServerSetup,setupStorageKey,emptySetup } from "../src/lib/creator-onboarding";
import { readFileSync } from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
describe("creator onboarding",()=>{
 it("validates goal allowlist",()=>{for(const g of Object.keys(GOALS))expect(isCreatorGoal(g)).toBe(true);expect(isCreatorGoal("__proto__")).toBe(false);expect(isCreatorGoal(null)).toBe(false);});
 it("does not mark an empty page as activated or copied",()=>{const v=setupProgress({goal:"sell",profileReady:true,hasPage:true,activeLinks:0,copied:true});expect(v.ready).toBe(false);expect(v.completed).toBe(2);});
 it("calculates real completion",()=>{expect(setupProgress({goal:"audience",profileReady:true,hasPage:true,activeLinks:1,copied:true}).completed).toBe(4);});
 it("keeps routing within existing function and verifies server identity",()=>{expect(read("api/analytics-data.ts")).toContain('req.query.scope === "onboarding"');expect(read("api/_lib/creator-onboarding.ts")).toContain("p_user:auth.userId");expect(read("supabase/migrations/20261126130000_creator_onboarding.sql")).toContain("revoke all on function public.sync_creator_onboarding(uuid,text,boolean) from public, anon, authenticated");});
});

describe("offline onboarding",()=>{
 it("isolates local setup by account and rejects corrupted cache",()=>{
  expect(setupStorageKey("a")).not.toBe(setupStorageKey("b"));
  expect(parseLocalSetup("{broken")).toEqual(emptySetup());
  expect(parseLocalSetup('{"goal":"__proto__","copied":"true","pendingGoal":true}')).toEqual(emptySetup());
 });
 it("preserves unsynced local choices while accepting server preferences when clean",()=>{
  const local=parseLocalSetup('{"goal":"sell","copied":true,"pendingGoal":true,"pendingCopy":true}');
  expect(mergeServerSetup(local,{goal:"audience",copied:false})).toEqual(local);
  expect(mergeServerSetup(emptySetup(),{goal:"bookings",copied:true})).toEqual({goal:"bookings",copied:true,pendingGoal:false,pendingCopy:false});
 });
 it("keeps goals and clipboard usable without server preferences",()=>{
  const ui=read("src/components/dashboard/CreatorOnboarding.tsx");
  expect(ui).not.toContain("busy||!saved");
  expect(ui).toContain('disabled={!progress.ready||copying}');
  expect(ui).toContain("Setup works on this device");
  expect(read("api/_lib/creator-onboarding.ts")).toContain("expectedUserId!==auth.userId");
 });
});
