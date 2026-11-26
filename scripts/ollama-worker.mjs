// Node 22+. Outbound HTTPS only; Ollama stays on loopback.
const origin=new URL(process.env.STL_APP_URL||"");
if(origin.protocol!=="https:"||origin.pathname!=="/"||origin.search||origin.hash||origin.username||origin.password)throw Error("Set STL_APP_URL to the exact HTTPS preview origin");
const secret=process.env.LOCAL_AI_WORKER_SECRET||"";
if(!/^[a-f0-9]{64}$/i.test(secret))throw Error("Set LOCAL_AI_WORKER_SECRET");
const model=process.env.OLLAMA_MODEL||"qwen3:4b";
if(!["qwen3:4b","qwen3:8b","gemma3:4b"].includes(model))throw Error("Choose an approved local model");
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function api(body){
 const r=await fetch(new URL("/api/ai-agent?action=local-worker",origin),{method:"POST",redirect:"error",headers:{"Content-Type":"application/json",Authorization:"Bearer "+secret},body:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!r.ok)throw Error("Worker API status "+r.status);return r.json();
}
console.log("STL local pilot worker started. Model: "+model);
while(true){
 try{
  const {job}=await api({action:"claim"});
  if(!job){await pause(20000);continue;}
  let result=null;
  try{
   if(!Array.isArray(job.messages)||job.messages.length!==2)throw Error("Invalid prompt");
   const r=await fetch("http://127.0.0.1:11434/api/chat",{method:"POST",redirect:"error",headers:{"Content-Type":"application/json"},body:JSON.stringify({model,messages:job.messages,stream:false,format:"json",think:false,options:{num_ctx:4096,num_predict:1200,temperature:0.4}}),signal:AbortSignal.timeout(80000)});
   if(!r.ok)throw Error("Ollama unavailable");const j=await r.json();result=JSON.parse(j.message.content);
  }catch{console.error("Local generation failed; check Ollama and model availability.");}
  await api({action:"complete",id:job.id,lease:job.lease,success:!!result,result});
 }catch(e){console.error(e instanceof Error?e.message:"Worker request failed");await pause(30000);}
}
