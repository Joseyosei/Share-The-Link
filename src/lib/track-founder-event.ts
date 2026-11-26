import { authFetch } from "@/lib/auth-fetch";
import { supabase } from "@/integrations/supabase/client";
export async function trackFounderEvent(event:"dashboard_opened"|"pricing_viewed"){
 try{
  const {data:{session}}=await supabase.auth.getSession();
  if(!session)return;
  await authFetch("/api/founder-intelligence",{method:"POST",body:JSON.stringify({action:"track",event})});
 }catch{/* analytics must never interrupt user workflow */}
}
