import { authFetch } from "@/lib/auth-fetch";
export async function commerceApi(action:string,body:Record<string,unknown>={},authenticated=true){
 const url="/api/connect-store?action=commerce-"+action;
 const options={method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)};
 const response=await (authenticated?authFetch(url,options):fetch(url,options));
 const data=await response.json();
 if(!response.ok)throw Error(data.error||"Commerce unavailable");
 return data;
}
