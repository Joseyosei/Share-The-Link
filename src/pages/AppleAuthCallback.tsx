import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {supabase} from "@/integrations/supabase/client";
import {appleCallbackParams} from "@/lib/apple-auth";
let exchange:Promise<string>|undefined;
async function finish(){
 const {code,failed,next}=appleCallbackParams(window.location.search);
 window.history.replaceState(null,"",window.location.pathname);
 if(failed||!code)throw Error("Apple sign-in was cancelled or expired. Please try again.");
 const {data,error}=await supabase.auth.exchangeCodeForSession(code);
 if(error||!data.session||!data.user)throw Error("Unable to complete Apple sign-in. Please try again.");
 const {data:profile,error:profileError}=await supabase.from("profiles").select("username").eq("user_id",data.user.id).maybeSingle();
 if(profileError||!profile)throw Error("Your account is signed in, but profile setup is unavailable. Contact support if this continues.");
 return profile.username?next:"/dashboard/settings";
}
export default function AppleAuthCallback(){
 const [error,setError]=useState("");
 useEffect(()=>{let active=true;exchange??=finish();exchange.then(next=>{if(active)window.location.replace(next);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Unable to sign in.");});return()=>{active=false;};},[]);
 return <main className="min-h-screen grid place-items-center p-6"><div className="max-w-md rounded-xl border bg-card p-6 space-y-3"><h1 className="text-xl font-bold">Sign in with Apple</h1>{error?<><p role="alert">{error}</p><a className="underline" href="/login">Return to sign in</a></>:<p role="status">Completing secure sign-in…</p>}<Link className="block text-sm underline" to="/">Home</Link></div></main>;
}
