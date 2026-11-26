export async function readWebsiteResponse(response:Response){
 let data: any;
 try{data=await response.json();}
 catch{throw Object.assign(new Error(response.status===401?"Sign in again to continue.":"Website service is temporarily unavailable. Your published website is unchanged."),{status:response.status,code:"INVALID_RESPONSE"});}
 if(!data||typeof data!=="object"||Array.isArray(data))throw new Error("Website service returned an invalid response.");
 if(!response.ok)throw Object.assign(new Error(typeof data.error==="string"?data.error:"Website unavailable"),{status:response.status,code:data.code});
 return data;
}
