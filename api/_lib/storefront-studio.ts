import type { VercelRequest,VercelResponse } from "@vercel/node";
import { handleCors } from "./cors.js";
import { verifyAuth,unauthorized } from "./auth.js";
import { isRateLimited,getClientIp,tooManyRequests } from "./rate-limit.js";
import { entitlementDb,resolvePlan } from "./entitlements.js";
import { defaultWebsite,validateWebsite,needsPremium,visibleWebsiteLinks,safeWebUrl,type WebsiteSource } from "../../src/lib/storefront-studio.js";
import { isBlockedText,isBlockedUrl } from "../../src/lib/content-moderation.js";
const checked=<T>(r:{data:T;error:any}):T=>{if(r.error)throw r.error;return r.data;};
async function sourceFor(db:ReturnType<typeof entitlementDb>,profile:any):Promise<WebsiteSource>{
 const links=checked(await db.rpc("get_public_links",{lookup_username:profile.username}))||[];
 const productsResult=await db.from("commerce_products").select("id,name,amount").eq("seller_id",profile.user_id).eq("active",true).order("created_at",{ascending:false}).limit(12);
 return {username:profile.username,name:profile.full_name||profile.username,bio:profile.bio||"",avatar:safeWebUrl(profile.avatar_url),links:visibleWebsiteLinks(links).filter(l=>!isBlockedUrl(l.url)).slice(0,100),products:productsResult.error?[]:productsResult.data||[]};
}
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader("Cache-Control","private, no-store");
 if(handleCors(req,res))return;
 if(req.method!=="POST")return res.status(405).json({error:"Method not allowed"});
 if(isRateLimited("website:"+getClientIp(req),45))return tooManyRequests(res);
 const body=req.body||{};
 try{
  const db=entitlementDb();
  if(body.action==="public"){
   if(typeof body.username!=="string"||body.username.length>100||!body.username.trim())return res.status(400).json({error:"Invalid website"});
   const profile=checked(await db.from("profiles").select("user_id,username,full_name,bio,avatar_url").eq("username",body.username).maybeSingle());
   if(!profile)return res.status(404).json({error:"Website not found"});
   const row=checked(await db.from("creator_websites").select("published").eq("user_id",profile.user_id).maybeSingle());
   if(!row?.published)return res.status(404).json({error:"Website is not published"});
   return res.json({config:validateWebsite(row.published),source:await sourceFor(db,profile)});
  }
  const auth=await verifyAuth(req);if(!auth)return unauthorized(res);
  if(body.expectedUserId!==auth.userId)return res.status(403).json({error:"Account changed. Reload the studio."});
  const profile=checked(await db.from("profiles").select("user_id,username,full_name,bio,avatar_url").eq("user_id",auth.userId).maybeSingle());
  if(!profile?.username)return res.status(409).json({error:"Create a profile username first."});
  if(body.action==="load"){
   const row=checked(await db.from("creator_websites").select("draft,revision,published_at").eq("user_id",auth.userId).maybeSingle());
   let tier=null;try{tier=(await resolvePlan(auth.userId,auth.email)).tier;}catch{/* Free publishing remains available. */}
   return res.json({config:row?validateWebsite(row.draft):defaultWebsite(),revision:row?.revision||0,publishedAt:row?.published_at||null,tier,source:await sourceFor(db,profile)});
  }
  if(!["draft","publish","unpublish"].includes(body.action)||!Number.isSafeInteger(body.revision)||body.revision<0)return res.status(400).json({error:"Invalid action"});
  let config=null;
  if(body.action!=="unpublish"){
   try{config=validateWebsite(body.config);}catch(e){return res.status(400).json({error:e instanceof Error?e.message:"Invalid website"});}
   if(config.sections.some(s=>isBlockedText(s.heading)||isBlockedText(s.body)))return res.status(400).json({error:"Section text violates content guidelines"});
   if(body.action==="publish"&&needsPremium(config)){
    let tier;try{tier=(await resolvePlan(auth.userId,auth.email)).tier;}catch{return res.status(503).json({error:"Premium plan verification unavailable. Your published website is unchanged."});}
    if(tier==="free")return res.status(403).json({error:"Premium website publishing requires Creator Pro or Business.",code:"UPGRADE_REQUIRED"});
   }
  }
  const revision=checked(await db.rpc("save_creator_website",{p_user:auth.userId,p_revision:body.revision,p_config:config,p_action:body.action}));
  if(revision===-1)return res.status(409).json({error:"Another tab saved a newer version. Reload before saving.",code:"REVISION_CONFLICT"});
  return res.json({revision,publishedAt:body.action==="publish"?new Date().toISOString():body.action==="unpublish"?null:undefined});
 }catch(e){console.error("Website studio unavailable",e instanceof Error?e.message:(e as any)?.code);return res.status(503).json({error:"Website service unavailable. Verify the Storefront Studio migration."});}
}
