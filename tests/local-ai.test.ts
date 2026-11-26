import {describe,it,expect} from "vitest";
import {accountIntent,formatLinks} from "../src/lib/account-intents";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
describe("account tools and local pilot",()=>{
 it("recognises the exact failed requests",()=>{expect(accountIntent("Show me all my current links")).toBe("links");expect(accountIntent("MANAGE MY LINKS")).toBe("manage");expect(accountIntent("Show my analytics")).toBe("analytics");expect(accountIntent("Delete my links")).toBeNull();expect(accountIntent("Show my active links")).toBeNull();});
 it("formats actual links and states truncation",()=>{expect(formatLinks([{title:"LinkedIn",url:"https://example.com",is_active:true}],51)).toContain("showing first 1");expect(formatLinks([],0)).toContain("no links");});
 it("reads account data before quota and model access",()=>{const api=read("api/_lib/creator-ai.ts");expect(api.indexOf("await accountAnswer")).toBeLessThan(api.indexOf("await consumeBuilder"));expect(read("api/_lib/account-assistant.ts")).toContain('.order("position"');expect(read("src/pages/CreatorAI.tsx")).toContain("const canGenerate=direct||");});
 it("isolates the worker, jobs, and claims",()=>{const api=read("api/_lib/local-ai.ts");expect(api).toContain("userId===process.env.LOCAL_AI_PILOT_USER_ID");expect(api).toContain("timingSafeEqual");expect(api).toContain('.eq("user_id",userId).eq("id",id)');expect(api).toContain("validateCreatorResult");const sql=read("supabase/migrations/20261126190000_local_ai_queue.sql");expect(sql).toContain("for update skip locked");expect(sql).toContain("revoke all on public.local_ai_jobs");expect(read("scripts/ollama-worker.mjs")).toContain("http://127.0.0.1:11434/api/chat");});
});
