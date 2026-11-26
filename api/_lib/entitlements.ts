import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { identifyPaidTier,PLAN_POLICY,type PlanTier } from "../../src/lib/plan-policy.js";
export const entitlementDb=()=>createClient(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||process.env.NEXT_PUBLIC_SUPABASE_URL||"",process.env.SUPABASE_SERVICE_ROLE_KEY||"",{auth:{persistSession:false,autoRefreshToken:false}});
export const billingStripe=()=>new Stripe(process.env.STRIPE_SECRET_KEY!,{apiVersion:"2025-04-30.basil" as any});
export async function resolvePlan(userId:string, email?:string){
 const db=entitlementDb(),stripe=billingStripe();
 if(!email){const {data,error}=await db.auth.admin.getUserById(userId);if(error||!data.user?.email)throw Error("Account unavailable");email=data.user.email;}
 const customers:Stripe.Customer[]=[];
 for await(const customer of stripe.customers.list({email,limit:100})) customers.push(customer);
 const owned=customers.filter(c=>c.metadata.supabase_user_id===userId);
 let selected:{tier:PlanTier;subscription:Stripe.Subscription;customerId:string}|null=null;
 for(const customer of owned){
  for await(const sub of stripe.subscriptions.list({customer:customer.id,status:"all",limit:100})){
   if(!["active","trialing"].includes(sub.status))continue;
   if(sub.metadata.supabase_user_id&&sub.metadata.supabase_user_id!==userId)throw Error("Subscription ownership conflict");
   const tier=identifyPaidTier(sub.items.data[0]?.price.id||"",sub.metadata.tier);
   if(!tier)throw Error("Unrecognised paid subscription");
   if(selected)throw Error("Multiple active subscriptions require review");
   selected={tier,subscription:sub,customerId:customer.id};
  }
 }
 if(selected)return selected;
 // Do not claim legacy subscriptions on email alone; also do not silently sell another plan.
 for(const customer of customers.filter(c=>!c.metadata.supabase_user_id)){
  for await(const sub of stripe.subscriptions.list({customer:customer.id,status:"all",limit:100})){
   if(["active","trialing","past_due","unpaid","incomplete","paused"].includes(sub.status))throw Error("Legacy billing account requires verification");
  }
 }
 return {tier:"free" as PlanTier,subscription:null,customerId:owned[0]?.id||null};
}
export async function usageSnapshot(userId:string,tier:PlanTier){
 const db=entitlementDb();
 const {data,error}=await db.rpc("plan_usage_snapshot",{p_user:userId,p_tier:tier});
 if(error)throw error;
 return {...data,tier,policy:PLAN_POLICY[tier]};
}
export async function consumeBuilder(userId:string,tier:PlanTier){
 const {data,error}=await entitlementDb().rpc("consume_builder_usage",{p_user:userId,p_tier:tier});
 if(error)throw error;return data===true;
}
