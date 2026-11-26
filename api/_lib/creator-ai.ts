import {accountIntent} from "../../src/lib/account-intents.js";
import {accountAnswer} from "./account-assistant.js";
import {localEnabled,queueLocal,pollLocal} from "./local-ai.js";
import type { VercelRequest,VercelResponse } from "@vercel/node";
import { verifyAuth,unauthorized } from "./auth.js";
import { handleCors } from "./cors.js";
import { getClientIp,isRateLimited,tooManyRequests } from "./rate-limit.js";
import { entitlementDb,resolvePlan,consumeBuilder,usageSnapshot } from "./entitlements.js";
import { validateCreatorInput,growthTips,type CreatorMetrics } from "../../src/lib/creator-ai.js";
import { generateCreatorResult,providerConfig } from "./creator-ai-provider.js";
export async function creatorMetrics(userId:string):Promise<CreatorMetrics>{
 const db=entitlementDb(),windowEnd=new Date().toISOString(),windowStart=new Date(Date.now()-30*86400000).toISOString();
 const results=await Promise.allSettled([
 db.from("links").select("id",{count:"exact",head:true}).eq("user_id",userId).eq("is_active",true),
 db.from("links").select("id",{count:"exact",head:true}).eq("user_id",userId),
 db.from("analytics_events").select("id",{count:"exact",head:true}).eq("user_id",userId).in("event_type",["profile_view","page_view"]).gte("created_at",windowStart).lt("created_at",windowEnd),
 db.from("analytics_events").select("id",{count:"exact",head:true}).eq("user_id",userId).eq("event_type","link_click").gte("created_at",windowStart).lt("created_at",windowEnd),
 db.from("commerce_products").select("id",{count:"exact",head:true}).eq("seller_id",userId).eq("active",true)
 ]);
 const n=(i:number)=>{const r=results[i];return r.status==="fulfilled"&&!r.value.error&&typeof r.value.count==="number"?r.value.count:null;};
 return {activeLinks:n(0),totalLinks:n(1),views30d:n(2),clicks30d:n(3),publishedProducts:n(4),windowStart,windowEnd};
}
export default async function creatorHandler(req:VercelRequest,res:VercelResponse,legacy=false){
 res.setHeader("Cache-Control","private, no-store");
 if(handleCors(req,res))return;
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const auth=await verifyAuth(req);if(!auth)return unauthorized(res);
 const polling=req.body?.action==="poll"&&!legacy;
 if(isRateLimited("creator-ai:"+auth.userId+(polling?":poll":""),polling?35:12)||isRateLimited("creator-ai-ip:"+getClientIp(req)+(polling?":poll":""),polling?90:30))return tooManyRequests(res);
 const body=req.body||{};
 if(!legacy&&body.expectedUserId!==auth.userId)return res.status(403).json({error:"Account changed. Reload the assistant."});
 try{
  if(!legacy&&body.action==="status"){
   let usage=null;try{const {tier}=await resolvePlan(auth.userId,auth.email);usage=await usageSnapshot(auth.userId,tier);}catch{}
   return res.json({usage,enabled:process.env.CREATOR_AI_ENABLED==="true"&&!!providerConfig(),localEnabled:localEnabled(auth.userId)});
  }
  if(!legacy&&body.action==="metrics"){
   const metrics=await creatorMetrics(auth.userId);return res.json({metrics,tips:growthTips(metrics)});
  }
  if(!legacy&&body.action==="poll"){const job=await pollLocal(auth.userId,body.id);return job?res.json(job):res.status(404).json({error:"Local job expired or unavailable."});}
  let input;
  try{
   if(legacy){
    const messages=body.messages;
    if(!Array.isArray(messages)||messages.length<1||messages.length>20||messages.some(m=>!m||!["user","assistant"].includes(m.role)||typeof m.content!=="string"||m.content.length>2000)||messages[messages.length-1].role!=="user")throw Error("Invalid conversation");
    input=validateCreatorInput({mode:"chat",brief:messages[messages.length-1].content,includeMetrics:false});
   }else{
    if(body.action!=="generate")throw Error("Invalid action");
    input=validateCreatorInput(body);
   }
  }catch(e){return res.status(400).json({error:e instanceof Error?e.message:"Invalid request"});}
  const intent=input.mode==="chat"?accountIntent(input.brief):null;
  if(intent){const text=await accountAnswer(auth.userId,intent);return res.json(legacy?{reply:text,toolsUsed:true}:{text,website:null,model:"Account tools",metrics:null,accountTool:true});}
  const local=!legacy&&body.engine==="local";
  if(local&&(!localEnabled(auth.userId)||body.localConsent!==true))return res.status(403).json({error:"Local pilot is unavailable or consent missing."});
  if(!local&&(process.env.CREATOR_AI_ENABLED!=="true"||!providerConfig()))return res.status(503).json({error:"AI generation is not enabled yet. Account metrics remain available."});
  const {tier}=await resolvePlan(auth.userId,auth.email);
  // Only aggregate own-account data; no emails, tokens, customer details, raw events or URLs.
  const metrics=input.includeMetrics?await creatorMetrics(auth.userId):null;
  // Reserve once, atomically, before the only model call. Fail closed on missing quota schema.
  if(!await consumeBuilder(auth.userId,tier))return res.status(429).json({error:"Monthly AI allowance or platform budget reached. Check your plan.",code:"AI_LIMIT"});
  if(local){const id=await queueLocal(auth.userId,input,metrics);return res.status(202).json({jobId:id,metrics});}
  let result;
  try{result=await generateCreatorResult(input,metrics);}catch{return res.status(502).json({error:"Generation was unsuccessful. An attempt was counted against your allowance; please review before retrying."});}
  let usage=null;try{usage=await usageSnapshot(auth.userId,tier);}catch{}
  return res.json(legacy?{reply:result.text,toolsUsed:false,usage}:{...result,metrics,usage});
 }catch{console.error("Creator assistant request failed");return res.status(503).json({error:"AI workspace unavailable. Check billing and database configuration."});}
}
