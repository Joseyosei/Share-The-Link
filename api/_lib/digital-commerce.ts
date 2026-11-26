import { resolvePlan,usageSnapshot } from "./entitlements.js";
import { platformFee,PLAN_POLICY } from "../../src/lib/plan-policy.js";
import type { VercelRequest,VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { randomBytes,randomUUID,createHash,timingSafeEqual } from "node:crypto";
import { verifyAuth,unauthorized } from "./auth.js";
import { isRateLimited,getClientIp,tooManyRequests } from "./rate-limit.js";
import { isValidUUID,sanitizeString } from "./validate.js";
import { discountedAmount,normalizeCode,validCode } from "../../src/lib/commerce.js";
import { isBlockedText } from "../../src/lib/content-moderation.js";
const dbClient=()=>createClient(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||"",process.env.SUPABASE_SERVICE_ROLE_KEY||"",{auth:{persistSession:false,autoRefreshToken:false}});
const hash=(token:string)=>createHash("sha256").update(token).digest("hex");
const enabled=()=>process.env.VERCEL_ENV!=="production"&&process.env.COMMERCE_CHECKOUT_ENABLED==="true"&&!!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")&&!!process.env.STRIPE_CONNECT_WEBHOOK_SECRET;
const stripeClient=()=>new Stripe(process.env.STRIPE_SECRET_KEY!,{apiVersion:"2025-04-30.basil" as any});
const checked=<T>(result:{data:T;error:any}):T=>{if(result.error)throw result.error;return result.data;};
async function accountFor(db:ReturnType<typeof dbClient>,sellerId:string){
 const row=checked(await db.from("commerce_test_sellers").select("stripe_account_id").eq("seller_id",sellerId).maybeSingle());
 if(!row)return null;
 const account=await stripeClient().accounts.retrieve(row.stripe_account_id);
 if(account.metadata?.user_id!==sellerId||account.metadata?.commerce!=="test"||!account.charges_enabled||!account.payouts_enabled)return null;
 return account.id;
}
function origin(){const url=new URL(process.env.COMMERCE_APP_URL||"https://sharethelink.app");if(url.protocol!=="https:"||url.pathname!=="/"||url.search||url.hash||url.username||url.password)throw Error("Invalid commerce origin");return url.origin;}
function matchesToken(stored:string,token:unknown){return typeof token==="string"&&/^[a-f0-9]{64}$/.test(token)&&/^[a-f0-9]{64}$/.test(stored)&&timingSafeEqual(Buffer.from(stored,"hex"),Buffer.from(hash(token),"hex"));}
export async function reconcileOrder(db:ReturnType<typeof dbClient>,order:any,session:Stripe.Checkout.Session){
 if(session.id!==order.stripe_session_id||session.metadata?.commerce_order_id!==order.id||session.mode!=="payment"||session.livemode||session.amount_total!==order.amount||session.currency!==order.currency)throw Error("Order mismatch");
 if(session.payment_status!=="paid"||typeof session.payment_intent!=="string")return order;
 const payment=await stripeClient().paymentIntents.retrieve(session.payment_intent,{expand:["latest_charge"]},{stripeAccount:order.connected_account});
 const charge=payment.latest_charge;
 if(payment.status!=="succeeded"||payment.amount_received!==order.amount||payment.currency!==order.currency||!charge||typeof charge==="string")throw Error("Payment not verified");
 if(charge.amount_refunded>0||charge.disputed){checked(await db.from("commerce_orders").update({status:"revoked",payment_intent_id:payment.id}).eq("id",order.id));return {...order,status:"revoked"};}
 const updated=checked(await db.from("commerce_orders").update({status:"paid",payment_intent_id:payment.id,buyer_email:session.customer_details?.email||null,paid_at:order.paid_at||new Date().toISOString()}).eq("id",order.id).in("status",["pending","paid"]).select("*").maybeSingle());
 return updated||{...order,status:"revoked"};
}
export async function commerceWebhook(event:Stripe.Event){
 if(!event.account||event.livemode)return;
 const db=dbClient();
 if(event.type==="checkout.session.completed"||event.type==="checkout.session.async_payment_succeeded"){
  const session=event.data.object as Stripe.Checkout.Session;
  const id=session.metadata?.commerce_order_id;if(!isValidUUID(id))return;
  const order=checked(await db.from("commerce_orders").select("*").eq("id",id).maybeSingle());
  if(!order||order.connected_account!==event.account)throw Error("Commerce account mismatch");
  // A webhook arriving before the checkout response is persisted must be retried.
  if(!order.stripe_session_id)throw Error("Checkout not persisted yet");
  if(order.status!=="revoked")await reconcileOrder(db,order,session);
 }else if(event.type==="charge.refunded"||event.type==="charge.dispute.created"){
  const obj=event.data.object as any;
  const intent=typeof obj.payment_intent==="string"?obj.payment_intent:null;
  if(intent)checked(await db.from("commerce_orders").update({status:"revoked"}).eq("payment_intent_id",intent).eq("connected_account",event.account));
 }else if(event.type==="checkout.session.expired"){
  const session=event.data.object as Stripe.Checkout.Session;
  if(session.metadata?.commerce_order_id)checked(await db.from("commerce_orders").update({status:"expired"}).eq("stripe_session_id",session.id).eq("connected_account",event.account).eq("status","pending"));
 }
}
export default async function handler(req:VercelRequest,res:VercelResponse){
 res.setHeader("Cache-Control","private, no-store");
 if(isRateLimited("commerce:"+getClientIp(req),45))return tooManyRequests(res);
 const action=req.query.action;
 const body=req.body||{};
 try{
  const db=dbClient();
  if(action==="commerce-catalog"){
   if(typeof body.username!=="string"||body.username.length>100)return res.status(400).json({error:"Invalid shop"});
   const profile=checked(await db.from("profiles").select("user_id,username,full_name").eq("username",body.username).maybeSingle());
   if(!profile)return res.status(404).json({error:"Shop not found"});
   const products=checked(await db.from("commerce_products").select("id,name,description,amount,currency").eq("seller_id",profile.user_id).eq("active",true).order("created_at",{ascending:false}).limit(100));
   return res.json({name:profile.full_name||profile.username,products,checkoutEnabled:enabled()});
  }
  if(action==="commerce-checkout"){
   if(!enabled())return res.status(503).json({error:"Checkout is not enabled. No payment has been taken."});
   if(!isValidUUID(body.productId))return res.status(400).json({error:"Invalid product"});
   const product=checked(await db.from("commerce_products").select("*").eq("id",body.productId).eq("active",true).maybeSingle());
   if(!product)return res.status(404).json({error:"Product unavailable"});
   const code=normalizeCode(body.code);
   if(code&&code!==product.discount_code)return res.status(400).json({error:"Discount code is invalid"});
   const amount=discountedAmount(product.amount,code?product.discount_percent:0);
   const sellerPlan=await resolvePlan(product.seller_id);
   const fee=platformFee(amount,sellerPlan.tier);
   const account=await accountFor(db,product.seller_id);
   if(!account)return res.status(409).json({error:"Seller payments are not ready"});
   const id=randomUUID(),token=randomBytes(32).toString("hex");
   const base=origin();
   checked(await db.from("commerce_orders").insert({id,seller_id:product.seller_id,product_id:product.id,product_name:product.name,file_path:product.file_path,connected_account:account,amount,currency:"gbp",claim_hash:hash(token),platform_fee:fee,seller_tier:sellerPlan.tier}));
   const session=await stripeClient().checkout.sessions.create({mode:"payment",payment_method_types:["card"],line_items:[{price_data:{currency:"gbp",unit_amount:amount,product_data:{name:product.name}},quantity:1}],metadata:{commerce_order_id:id},payment_intent_data:{application_fee_amount:fee,metadata:{commerce_order_id:id}},success_url:base+"/commerce/order?order="+id+"#key="+token,cancel_url:base+"/commerce/order?cancelled=1",expires_at:Math.floor(Date.now()/1000)+3600},{stripeAccount:account,idempotencyKey:"commerce:"+id});
   checked(await db.from("commerce_orders").update({stripe_session_id:session.id}).eq("id",id));
   return res.json({url:session.url});
  }
  if(action==="commerce-claim"){
   if(!isValidUUID(body.orderId))return res.status(400).json({error:"Invalid order"});
   const order=checked(await db.from("commerce_orders").select("*").eq("id",body.orderId).maybeSingle());
   if(!order||!matchesToken(order.claim_hash,body.token))return res.status(404).json({error:"Order not found"});
   if(order.status==="revoked"||order.status==="expired")return res.status(409).json({error:"Download unavailable"});
   if(!order.stripe_session_id||!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"))return res.status(503).json({error:"Payment verification unavailable"});
   const session=await stripeClient().checkout.sessions.retrieve(order.stripe_session_id,{stripeAccount:order.connected_account});
   const verified=await reconcileOrder(db,order,session);
   if(verified.status!=="paid")return res.json({status:verified.status});
   const signed=checked(await db.storage.from("commerce-private").createSignedUrl(order.file_path,60,{download:true}));
   return res.json({status:"paid",name:order.product_name,downloadUrl:signed.signedUrl,expiresIn:60});
  }
  const auth=await verifyAuth(req);if(!auth)return unauthorized(res);
  if(action==="commerce-seller-setup"){
   if(!enabled())return res.status(503).json({error:"Test checkout setup is disabled"});
   let row=checked(await db.from("commerce_test_sellers").select("stripe_account_id").eq("seller_id",auth.userId).maybeSingle());
   if(!row){
    const account=await stripeClient().accounts.create({type:"express",country:"GB",email:auth.email||undefined,business_type:"individual",capabilities:{card_payments:{requested:true},transfers:{requested:true}},metadata:{user_id:auth.userId,commerce:"test"}},{idempotencyKey:"stl-commerce-test-seller:"+auth.userId});
    row=checked(await db.from("commerce_test_sellers").upsert({seller_id:auth.userId,stripe_account_id:account.id},{onConflict:"seller_id"}).select("stripe_account_id").single());
   }
   const account=await stripeClient().accounts.retrieve(row.stripe_account_id);
   if(account.metadata?.user_id!==auth.userId||account.metadata?.commerce!=="test")return res.status(403).json({error:"Seller account ownership mismatch"});
   const base=origin();
   const link=await stripeClient().accountLinks.create({account:account.id,refresh_url:base+"/connect",return_url:base+"/connect",type:"account_onboarding"});
   return res.json({url:link.url});
  }
  if(action==="commerce-dashboard"){
   const products=checked(await db.from("commerce_products").select("id,name,description,amount,active,discount_code,discount_percent,created_at").eq("seller_id",auth.userId).order("created_at",{ascending:false}).limit(100));
   const orders=checked(await db.from("commerce_orders").select("id,product_name,amount,status,buyer_email,created_at,paid_at").eq("seller_id",auth.userId).order("created_at",{ascending:false}).limit(100));
   const {tier}=await resolvePlan(auth.userId,auth.email);
   const usage=await usageSnapshot(auth.userId,tier);
   return res.json({products,orders,checkoutEnabled:enabled(),usage});
  }
  if(action==="commerce-create"){
   const name=sanitizeString(body.name,120),description=sanitizeString(body.description,2000);
   if(!name||isBlockedText(name)||isBlockedText(description)||!Number.isInteger(body.amount)||body.amount<50||body.amount>1000000)return res.status(400).json({error:"Invalid product"});
   const path=body.filePath;
   if(typeof path!=="string"||!path.startsWith(auth.userId+"/")||!isValidUUID(path.slice(auth.userId.length+1,-4))||!path.endsWith(".pdf"))return res.status(400).json({error:"Invalid file"});
   const filename=path.split("/")[1];
   const files=checked(await db.storage.from("commerce-private").list(auth.userId,{search:filename,limit:10}));
   if(!files.some(f=>f.name===filename))return res.status(400).json({error:"Upload a PDF first"});
   const code=normalizeCode(body.code),percent=body.percent??0;
   if((code&&(!validCode(code)||!Number.isInteger(percent)||percent<1||percent>80))||(!code&&percent!==0))return res.status(400).json({error:"Invalid discount"});
   const {tier}=await resolvePlan(auth.userId,auth.email);
   if(code&&!PLAN_POLICY[tier].discounts)return res.status(403).json({error:"Product discount codes require Creator Pro or Business."});
   const created=await db.rpc("create_plan_product",{p_user:auth.userId,p_tier:tier,p_name:name,p_description:description,p_amount:body.amount,p_file:path,p_code:code||null,p_percent:percent});
   if(created.error?.message.includes("PRODUCT_LIMIT"))return res.status(409).json({error:"Digital product limit reached. Compare plans."});
   checked(created);
   return res.json({success:true});
  }
  if(action==="commerce-publish"){
   if(!isValidUUID(body.productId)||typeof body.active!=="boolean")return res.status(400).json({error:"Invalid product"});
   const row=checked(await db.from("commerce_products").update({active:body.active}).eq("id",body.productId).eq("seller_id",auth.userId).select("id").maybeSingle());
   if(!row)return res.status(404).json({error:"Product not found"});
   return res.json({success:true});
  }
  return res.status(400).json({error:"Unknown commerce action"});
 }catch(err){console.error("Digital commerce unavailable",err instanceof Error?err.message:(err as any)?.code);return res.status(503).json({error:"Commerce temporarily unavailable. Check setup and try again."});}
}
