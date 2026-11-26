import { modelMessages,validateCreatorResult,type CreatorInput,type CreatorMetrics } from "../../src/lib/creator-ai.js";
export function providerConfig(){
 if(process.env.OPENAI_API_KEY)return {key:process.env.OPENAI_API_KEY,url:"https://api.openai.com/v1/chat/completions",model:"gpt-4o-mini",name:"OpenAI"};
 if(process.env.AI_GATEWAY_API_KEY)return {key:process.env.AI_GATEWAY_API_KEY,url:"https://ai-gateway.vercel.sh/v1/chat/completions",model:"openai/gpt-4o-mini",name:"Vercel AI Gateway"};
 return null;
}
export async function generateCreatorResult(input:CreatorInput,metrics:CreatorMetrics|null){
 const provider=providerConfig();if(!provider)throw Error("AI_PROVIDER_NOT_CONFIGURED");
 const response=await fetch(provider.url,{method:"POST",redirect:"error",headers:{"Content-Type":"application/json",Authorization:"Bearer "+provider.key},body:JSON.stringify({model:provider.model,messages:modelMessages(input,metrics),response_format:{type:"json_object"},max_tokens:1200,temperature:.5}),signal:AbortSignal.timeout(22000)});
 if(!response.ok)throw Error("AI_PROVIDER_FAILED");
 const j=await response.json(),choice=j.choices?.[0];
 if(choice?.finish_reason!=="stop"||typeof choice?.message?.content!=="string"||choice.message.refusal)throw Error("AI_RESULT_INCOMPLETE");
 const result=validateCreatorResult(JSON.parse(choice.message.content),input.mode);
 return {...result,model:provider.model};
}
