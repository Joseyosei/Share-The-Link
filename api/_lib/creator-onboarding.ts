import type { VercelRequest,VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { verifyAuth,unauthorized } from "./auth.js";
import { handleCors } from "./cors.js";
import { isRateLimited,tooManyRequests } from "./rate-limit.js";
import { isCreatorGoal } from "../../src/lib/creator-onboarding.js";
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader("Cache-Control","private, no-store");
 if(handleCors(req,res))return;
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const auth=await verifyAuth(req);
 if(!auth)return unauthorized(res);
 if(isRateLimited("onboarding:"+auth.userId,30))return tooManyRequests(res);
 const {action,goal,expectedUserId}=req.body||{};
 if(expectedUserId!==undefined&&expectedUserId!==auth.userId)return res.status(403).json({error:"Account changed. Reload your dashboard."});
 if(!["sync","goal","copied"].includes(action)||(action==="goal"&&!isCreatorGoal(goal)))return res.status(400).json({error:"Invalid onboarding action"});
 try{
  const db=createClient(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||"",process.env.SUPABASE_SERVICE_ROLE_KEY||"");
  const {data,error}=await db.rpc("sync_creator_onboarding",{p_user:auth.userId,p_goal:action==="goal"?goal:null,p_copied:action==="copied"});
  if(error){
   if(error.code==="PGRST202"||error.code==="PGRST205"){console.error("Creator onboarding migration missing",error.code);return res.status(503).json({error:"Setup sync is not configured yet.",code:"ONBOARDING_SCHEMA_UNAVAILABLE"});}
   throw error;
  }
  return res.status(200).json(data);
 }catch(error){console.error("Onboarding unavailable",error);return res.status(503).json({error:"Setup preferences unavailable. Your page and links still work."});}
}
