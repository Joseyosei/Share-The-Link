import type {VercelRequest,VercelResponse} from "@vercel/node";
import {randomUUID} from "node:crypto";
import {handleCors} from "./cors.js";
import {verifyAuth,unauthorized} from "./auth.js";
import {isRateLimited,getClientIp,tooManyRequests} from "./rate-limit.js";
import {entitlementDb,resolvePlan} from "./entitlements.js";
import {randomSecret,digest,sameSecret,seal,unseal} from "./social-crypto.js";
import {authorizeUrl,configured,exchange,refresh,revoke,fetchFeed,type Tokens} from "./social-providers.js";
import {PROVIDERS,isProvider,publicItems,type Provider} from "../../src/lib/social-content.js";
const available=(p:Provider)=>process.env.SOCIAL_INTEGRATIONS_ENABLED==="true"&&configured(p);
const checked=<T>(r:{data:T;error:any}):T=>{if(r.error)throw Error("Social database unavailable");return r.data;};
const iso=(ms=0)=>new Date(Date.now()+ms).toISOString();
const aad=(u:string,p:string)=>u+":"+p;
const day=86400000;
const publicFields="provider,status,published,media,pins,last_sync,access_until,next_sync,account_name";
const fresh=(row:any)=>row.status==="connected"&&Date.parse(row.access_until)>Date.now()&&Date.parse(row.last_sync)>Date.now()-2*day;
async function paid(userId:string,email?:string){return (await resolvePlan(userId,email)).tier!=="free";}
async function sync(db:ReturnType<typeof entitlementDb>,userId:string,p:Provider,force=false){
 if(!available(p))return "unavailable";
 const lease=randomUUID();
 let claim=db.from("social_connections").update({lease_id:lease,lease_until:iso(90000),last_attempt:iso(),next_sync:iso(3600000)}).eq("user_id",userId).eq("provider",p).eq("status","connected").or("lease_until.is.null,lease_until.lt."+iso());
 if(!force)claim=claim.lte("next_sync",iso());
 claim=claim.or("last_attempt.is.null,last_attempt.lt."+iso(-15*60000));
 const row=checked(await claim.select("*").maybeSingle());
 if(!row)return "busy_or_not_due";
 const owned=()=>db.from("social_connections").update({lease_id:null,lease_until:null}).eq("user_id",userId).eq("provider",p).eq("generation",row.generation).eq("lease_id",lease);
 const update=(values:Record<string,unknown>)=>db.from("social_connections").update(values).eq("user_id",userId).eq("provider",p).eq("generation",row.generation).eq("lease_id",lease);
 try{
  if(!await paid(userId)){checked(await update({access_until:null,next_sync:iso(day),lease_id:null,lease_until:null}));return "upgrade_required";}
  const tokens=await refresh(p,unseal<Tokens>(row.token_cipher,aad(userId,p)));
  const saved=checked(await update({token_cipher:seal(tokens,aad(userId,p))}).select("generation").maybeSingle());
  if(!saved)return "disconnected";
  const feed=await fetchFeed(p,tokens);
  if(feed.accountId!==row.account_id)throw Error("REAUTHORIZE");
  const result=checked(await update({media:feed.media,account_name:feed.name,last_sync:iso(),next_sync:iso(day),access_until:iso(2*day),lease_id:null,lease_until:null}).select("generation").maybeSingle());
  return result?"synced":"disconnected";
 }catch(e){
  const reauth=e instanceof Error&&e.message==="REAUTHORIZE";
  if(reauth)checked(await update({status:"reauthorize",published:false,media:[],pins:[],token_cipher:null,access_until:null,lease_id:null,lease_until:null}));
  else checked(await owned());
  return reauth?"reauthorize":"unavailable";
 }
}
async function cron(req:VercelRequest,res:VercelResponse){
 const secret=process.env.CRON_SECRET;
 if(!secret||!sameSecret(req.headers.authorization||"","Bearer "+secret))return unauthorized(res);
 if(process.env.SOCIAL_INTEGRATIONS_ENABLED!=="true")return res.json({enabled:false});
 const db=entitlementDb();
 const rows=checked(await db.from("social_connections").select("user_id,provider").eq("status","connected").lte("next_sync",iso()).order("next_sync",{ascending:true}).limit(12));
 const results:string[]=[];
 // Bounded batch; dashboard refresh handles other accounts. Do not exceed Hobby runtime.
 const deadline=Date.now()+22000;
 // Remove expired abandoned authorizations; no credentials were issued for these rows.
 checked(await db.from("social_connections").delete().eq("status","pending").lt("state_expires",iso()));
 for(let i=0;i<rows.length&&Date.now()<deadline;i+=3){const batch=await Promise.allSettled(rows.slice(i,i+3).map(r=>isProvider(r.provider)?sync(db,r.user_id,r.provider):Promise.resolve("invalid")));results.push(...batch.map(r=>r.status==="fulfilled"?r.value:"unavailable"));}
 return res.json({processed:results.length,synced:results.filter(x=>x==="synced").length});
}
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader("Cache-Control","private, no-store");
 if(handleCors(req,res))return;
 try{
  if(req.method==="GET"&&req.query.op==="cron")return await cron(req,res);
  if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
  if(isRateLimited("social:"+getClientIp(req),60))return tooManyRequests(res);
  const db=entitlementDb(),body=req.body||{};
  if(body.action==="public"){
   if(process.env.SOCIAL_INTEGRATIONS_ENABLED!=="true")return res.json({items:[]});
   if(typeof body.username!=="string"||!body.username.trim()||body.username.length>100)return res.status(400).json({error:"Invalid username"});
   const profile=checked(await db.from("profiles").select("user_id").eq("username",body.username).maybeSingle());
   if(!profile)return res.json({items:[]});
   const rows=checked(await db.from("social_connections").select(publicFields).eq("user_id",profile.user_id).eq("published",true).eq("status","connected"));
   return res.json({items:rows.filter(r=>fresh(r)&&isProvider(r.provider)&&available(r.provider)).flatMap(r=>publicItems(r.media,r.pins,r.provider as Provider)).sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||b.publishedAt.localeCompare(a.publishedAt)).slice(0,24)});
  }
  const auth=await verifyAuth(req);if(!auth)return unauthorized(res);
  const userId=auth.userId;
  if(body.action==="list"){
   const rows=checked(await db.from("social_connections").select(publicFields).eq("user_id",userId));
   let premium=false;try{premium=await paid(userId,auth.email);}catch{/* fail closed */}
   return res.json({premium,providers:PROVIDERS.map(p=>{const r=rows.find(r=>r.provider===p);return {provider:p,configured:available(p),status:r?.status||"disconnected",published:!!r?.published,accountName:r?.account_name||null,lastSync:r?.last_sync||null,due:r?.status==="connected"&&Date.parse(r.next_sync)<=Date.now(),items:r?publicItems(r.media,r.pins,p):[]};})});
  }
  const p=body.provider;if(!isProvider(p))return res.status(400).json({error:"Invalid provider"});
  if(body.action==="disconnect"){
   const row=checked(await db.from("social_connections").delete().eq("user_id",userId).eq("provider",p).select("token_cipher").maybeSingle());
   let revoked=false;try{if(row?.token_cipher)revoked=await revoke(p,unseal<Tokens>(row.token_cipher,aad(userId,p)));}catch{/* local removal already complete */}
   return res.json({success:true,revoked});
  }
  if(body.action==="visibility"&&body.published===false){
   checked(await db.from("social_connections").update({published:false}).eq("user_id",userId).eq("provider",p));
   return res.json({success:true});
  }
  if(!available(p))return res.status(503).json({error:"This social integration is not configured yet."});
  if(!await paid(userId,auth.email))return res.status(403).json({error:"Automatic social imports require Creator Pro or Business.",code:"UPGRADE_REQUIRED"});
  if(body.action==="start"){
   const existing=checked(await db.from("social_connections").select("status").eq("user_id",userId).eq("provider",p).maybeSingle());
   if(existing?.status==="connected")return res.status(409).json({error:"Disconnect the existing account first."});
   const state=randomSecret(),verifier=randomSecret();
   checked(await db.from("social_connections").delete().eq("user_id",userId).eq("provider",p).neq("status","connected"));
   checked(await db.from("social_connections").insert({user_id:userId,provider:p,state_hash:digest(state),state_expires:iso(10*60000),verifier_cipher:seal(verifier,aad(userId,p))}));
   return res.json({url:authorizeUrl(p,state,verifier)});
  }
  if(body.action==="callback"){
   if(typeof body.state!=="string"||! /^[A-Za-z0-9_-]{43}$/.test(body.state)||typeof body.code!=="string"||!body.code||body.code.length>4096)return res.status(400).json({error:"Invalid authorization response. Connect again."});
   const row=checked(await db.from("social_connections").update({state_hash:null,state_expires:null}).eq("user_id",userId).eq("provider",p).eq("status","pending").eq("state_hash",digest(body.state)).gt("state_expires",iso()).select("generation,verifier_cipher").maybeSingle());
   if(!row)return res.status(400).json({error:"Authorization expired or already used. Connect again."});
   const tokens=await exchange(p,body.code,unseal<string>(row.verifier_cipher,aad(userId,p)));
   let feed;try{feed=await fetchFeed(p,tokens);}catch(e){try{await revoke(p,tokens);}catch{}throw e;}
   const saved=checked(await db.from("social_connections").update({status:"connected",token_cipher:seal(tokens,aad(userId,p)),verifier_cipher:null,account_id:feed.accountId,account_name:feed.name,media:feed.media,published:false,last_sync:iso(),next_sync:iso(day),access_until:iso(2*day)}).eq("user_id",userId).eq("provider",p).eq("generation",row.generation).eq("status","pending").select("generation").maybeSingle());
   if(!saved){try{await revoke(p,tokens);}catch{}return res.status(409).json({error:"Connection was cancelled."});}
   return res.json({success:true});
  }
  if(body.action==="sync"){
   // Database cooldown applies to manual and automatic requests; do not override an active lease.
   const row=checked(await db.from("social_connections").select("last_sync").eq("user_id",userId).eq("provider",p).maybeSingle());
   if(row?.last_sync&&Date.parse(row.last_sync)>Date.now()-15*60000)return res.status(429).json({error:"Please wait 15 minutes between refreshes."});
   const result=await sync(db,userId,p,true);
   if(result!=="synced")return res.status(409).json({error:result==="reauthorize"?"Reconnect your social account.":"Sync unavailable or already running.",code:result});
   return res.json({success:true});
  }
  if(body.action==="visibility"&&body.published===true){
   const row=checked(await db.from("social_connections").select("generation,status,last_sync,access_until").eq("user_id",userId).eq("provider",p).maybeSingle());
   if(!row||!fresh(row))return res.status(409).json({error:"Refresh your connected account before publishing."});
   checked(await db.from("social_connections").update({published:true}).eq("user_id",userId).eq("provider",p).eq("generation",row.generation).eq("status","connected"));
   return res.json({success:true});
  }
  if(body.action==="pin"){
   if(typeof body.key!=="string"||typeof body.pinned!=="boolean")return res.status(400).json({error:"Invalid pin"});
   const row=checked(await db.from("social_connections").select("generation,media,pins").eq("user_id",userId).eq("provider",p).eq("status","connected").maybeSingle());
   if(!row||!publicItems(row.media,[],p).some(i=>i.key===body.key))return res.status(404).json({error:"Post not available"});
   const pins=[...new Set(body.pinned?[...row.pins,body.key]:row.pins.filter((k:string)=>k!==body.key))].filter(k=>publicItems(row.media,[],p).some(i=>i.key===k));
   if(pins.length>3)return res.status(409).json({error:"Pin up to three posts per platform."});
   checked(await db.from("social_connections").update({pins}).eq("user_id",userId).eq("provider",p).eq("generation",row.generation));
   return res.json({success:true});
  }
  return res.status(400).json({error:"Invalid social action"});
 }catch{console.error("Social content request failed");return res.status(503).json({error:"Social integration unavailable. Check provider configuration and database migration."});}
}
