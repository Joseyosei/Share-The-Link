import {entitlementDb} from "./entitlements.js";
import {formatLinks,type AccountIntent} from "../../src/lib/account-intents.js";
export async function accountAnswer(userId:string,intent:AccountIntent){
 const db=entitlementDb();
 if(intent==="help")return "I can show your links, profile, analytics and digital products without an AI model. For changes, open Links Management or Settings. AI generation is separate.";
 if(intent==="links"||intent==="manage"){
  const {data,error,count}=await db.from("links").select("title,url,is_active",{count:"exact"}).eq("user_id",userId).order("position",{ascending:true}).limit(50);
  if(error||count===null)throw Error("Unable to read links");
  return formatLinks(data||[],count);
 }
 if(intent==="profile"){
  const {data,error}=await db.from("profiles").select("username,full_name,bio").eq("user_id",userId).maybeSingle();
  if(error)throw Error("Unable to read profile");
  return data?"Profile: "+(data.full_name||data.username)+"\nUsername: "+data.username+"\nBio: "+(data.bio||"Not set"):"No profile found.";
 }
 if(intent==="analytics"){
  const {data,error,count}=await db.from("links").select("clicks,is_active",{count:"exact"}).eq("user_id",userId).limit(1000);
  if(error||count===null)throw Error("Unable to read analytics");
  const rows=data||[];
  return "Total links: "+count+"\nActive links"+(count>rows.length?" (first 1000)":"")+": "+rows.filter(r=>r.is_active).length+"\nRecorded link clicks"+(count>rows.length?" (first 1000)":"")+": "+rows.reduce((n,r)=>n+(Number(r.clicks)||0),0);
 }
 const {data,error,count}=await db.from("commerce_products").select("name,amount,active",{count:"exact"}).eq("seller_id",userId).limit(50);
 if(error||count===null)throw Error("Digital products unavailable");
 return data?.length?"Digital products ("+count+" total):\n"+data.map(p=>p.name+" — £"+(p.amount/100).toFixed(2)+(p.active?" (Published)":" (Draft)")).join("\n"):"No digital products found.";
}
