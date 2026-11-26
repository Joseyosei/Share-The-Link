import {useEffect,useRef,useState} from "react";
import {Link,useParams} from "react-router-dom";
import {isProvider} from "@/lib/social-content";
import {socialApi} from "@/lib/social-content-api";
export default function SocialCallback(){
 const {provider}=useParams(),[message,setMessage]=useState("Completing connection…");
 const once=useRef(false);
 useEffect(()=>{if(once.current)return;once.current=true;const params=new URLSearchParams(window.location.search);const state=params.get("state"),code=params.get("code");
 window.history.replaceState(null,"",window.location.pathname);
 if(!isProvider(provider)||!state||!code||params.has("error")){setMessage("Connection cancelled or invalid. Return to Links Management and try again.");return;}
 socialApi({action:"callback",provider,state,code}).then(()=>setMessage("Account connected. Review and publish imported posts in Links Management.")).catch(e=>setMessage(e.message||"Connection failed. Try again."));
 },[provider]);
 return <main className="min-h-screen flex items-center justify-center p-6"><div className="max-w-md space-y-4"><h1 className="text-2xl font-bold">Social connection</h1><p role="status">{message}</p><Link className="underline" to="/dashboard/links">Back to Links Management</Link></div></main>;
}
