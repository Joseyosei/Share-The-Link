import type {VercelRequest,VercelResponse} from "@vercel/node";
import {timingSafeEqual} from "node:crypto";
import {entitlementDb} from "./entitlements.js";
import {modelMessages,validateCreatorResult,type CreatorInput,type CreatorMetrics} from "../../src/lib/creator-ai.js";
const uuid=(v:unknown):v is string=>typeof v==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
export function localEnabled(userId:string){return process.env.LOCAL_AI_ENABLED==="true"&&uuid(process.env.LOCAL_AI_PILOT_USER_ID)&&userId===process.env.LOCAL_AI_PILOT_USER_ID&&/^[a-f0-9]{64}$/i.test(process.env.LOCAL_AI_WORKER_SECRET||"");}
export async function queueLocal(userId:string,input:CreatorInput,metrics:CreatorMetrics|null){
 const db=entitlementDb();
 const cleanup=await db.from("local_ai_jobs").delete().eq("user_id",userId).lt("expires_at",new Date().toISOString());if(cleanup.error)throw cleanup.error;
 const {data,error}=await db.from("local_ai_jobs").insert({user_id:userId,mode:input.mode,messages:modelMessages(input,metrics)}).select("id").single();
 if(error)throw Error(error.code==="23505"?"Another local generation is pending.":"Local queue unavailable");
 return data.id;
}
export async function pollLocal(userId:string,id:unknown){
 if(!uuid(id)||!localEnabled(userId))return null;
 const {data,error}=await entitlementDb().from("local_ai_jobs").select("status,result,expires_at").eq("user_id",userId).eq("id",id).maybeSingle();
 if(error)throw error;
 if(!data||Date.parse(data.expires_at)<=Date.now())return null;
 return {status:data.status,result:data.status==="done"?data.result:null};
}
export async function localWorker(req:VercelRequest,res:VercelResponse){
 res.setHeader("Cache-Control","no-store");
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 const userId=process.env.LOCAL_AI_PILOT_USER_ID||"",secret=process.env.LOCAL_AI_WORKER_SECRET||"",auth=req.headers.authorization||"";
 const expected="Bearer "+secret;
 if(!localEnabled(userId)||auth.length!==expected.length||!timingSafeEqual(Buffer.from(auth),Buffer.from(expected)))return res.status(401).json({error:"Unauthorized"});
 try{
  const db=entitlementDb(),body=req.body||{};
  if(body.action==="claim"){
   const {data,error}=await db.rpc("claim_local_ai_job",{p_user:userId});if(error)throw error;return res.json({job:data});
  }
  if(body.action!=="complete"||!uuid(body.id)||!uuid(body.lease))return res.status(400).json({error:"Invalid job"});
  const {data:job,error}=await db.from("local_ai_jobs").select("mode").eq("user_id",userId).eq("id",body.id).eq("lease",body.lease).eq("status","running").gt("expires_at",new Date().toISOString()).maybeSingle();
  if(error)throw error;if(!job)return res.status(409).json({error:"Job expired"});
  let result=null;try{if(body.success===true)result=validateCreatorResult(body.result,job.mode);}catch{}
  const saved=await db.from("local_ai_jobs").update({status:result?"done":"failed",result:result?{...result,model:"Local Ollama"}:null,messages:[],lease:null}).eq("user_id",userId).eq("id",body.id).eq("lease",body.lease).eq("status","running").gt("expires_at",new Date().toISOString()).select("id").maybeSingle();
  if(saved.error)throw saved.error;if(!saved.data)return res.status(409).json({error:"Job expired"});
  return res.json({success:true});
 }catch{return res.status(503).json({error:"Local AI queue unavailable"});}
}
