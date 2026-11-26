import {useState,useRef,useEffect} from "react";
import {Loader2} from "lucide-react";
import {supabase} from "@/integrations/supabase/client";
import {appleEnabled,appleCallbackUrl} from "@/lib/apple-auth";
export function AppleSignInButton({next,disabled,onBusy}:{next:string;disabled:boolean;onBusy:(busy:boolean)=>void}){
 const [busy,setBusy]=useState(false),[error,setError]=useState("");const lock=useRef(false);
 useEffect(()=>{const reset=(e:PageTransitionEvent)=>{if(e.persisted){lock.current=false;setBusy(false);onBusy(false);}};window.addEventListener("pageshow",reset);return()=>window.removeEventListener("pageshow",reset);},[onBusy]);
 if(!appleEnabled(import.meta.env.VITE_APPLE_AUTH_ENABLED))return null;
 const start=async()=>{
  if(lock.current||disabled)return;
  lock.current=true;setBusy(true);onBusy(true);setError("");
  try{
   const {data,error}=await supabase.auth.signInWithOAuth({provider:"apple",options:{redirectTo:appleCallbackUrl(window.location.origin,next),skipBrowserRedirect:true}});
   if(error||!data?.url)throw Error("Apple authorization unavailable");
   const url=new URL(data.url);if(url.protocol!=="https:")throw Error("Invalid authorization URL");window.location.assign(url.href);
  }catch{lock.current=false;setBusy(false);onBusy(false);setError("Apple sign-in is unavailable right now. You can still use email and password.");}
 };
 return <div className="mb-5 space-y-3"><button type="button" disabled={disabled||busy} onClick={()=>void start()} className="w-full min-h-12 rounded-lg bg-black text-white flex items-center justify-center gap-3 px-4 font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-60" aria-busy={busy}>{busy?<Loader2 className="w-5 h-5 animate-spin" aria-hidden="true"/>:<svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>}Sign in with Apple</button>{error&&<p role="alert" className="text-sm text-destructive">{error}</p>}<div className="flex gap-3 items-center text-xs text-muted-foreground"><span className="h-px bg-border flex-1"/><span>or use email</span><span className="h-px bg-border flex-1"/></div></div>;
}
