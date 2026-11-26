import {authFetch} from "@/lib/auth-fetch";
export async function socialApi(body:Record<string,unknown>,authenticated=true,signal?:AbortSignal){
 const init={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body),signal};
 const res=await (authenticated?authFetch("/api/analytics-data?scope=social",init):fetch("/api/analytics-data?scope=social",init));
 const data=await res.json().catch(()=>null);
 if(!res.ok||!data)throw Error(data?.error||"Social content is temporarily unavailable.");
 return data;
}
