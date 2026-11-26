import { useEffect,useState } from "react";
import { Link,useParams } from "react-router-dom";
import { websiteApi } from "@/lib/storefront-api";
import { WebsiteRenderer } from "@/components/website/WebsiteRenderer";
import type { WebsiteConfig,WebsiteSource } from "@/lib/storefront-studio";
export default function CreatorWebsite(){
 const {username}=useParams();const [data,setData]=useState<{config:WebsiteConfig;source:WebsiteSource}|null>(null),[error,setError]=useState("");
 useEffect(()=>{const controller=new AbortController();setData(null);setError("");websiteApi({action:"public",username},false,controller.signal).then(v=>{if(!controller.signal.aborted)setData(v);}).catch(e=>{if(!controller.signal.aborted)setError(e.message);});return()=>controller.abort();},[username]);
 useEffect(()=>{if(!data)return;const previous=document.title;document.title=data.source.name+" | Share The Link";return()=>{document.title=previous;};},[data]);
 if(data)return <WebsiteRenderer config={data.config} source={data.source}/>;
 return <main className="min-h-screen flex items-center justify-center p-6"><div className="space-y-3 text-center"><h1 className="text-xl font-bold">{error||"Loading website…"}</h1>{error&&username&&<Link className="underline" to={"/"+encodeURIComponent(username)}>Visit original profile</Link>}</div></main>;
}
