import { authFetch } from "@/lib/auth-fetch";
export async function websiteApi(body:Record<string,unknown>,authenticated=true,signal?:AbortSignal){
 const url="/api/analytics-data?scope=website";
 const options={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal};
 const r=await (authenticated?authFetch(url,options):fetch(url,options));
 const data=await r.json();
 if(!r.ok)throw Object.assign(new Error(data.error||"Website unavailable"),{code:data.code,status:r.status});
 return data;
}
