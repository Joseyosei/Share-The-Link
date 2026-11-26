import { SocialMediaGallery } from "@/components/profile/SocialMediaGallery";
import { useState } from "react";
import { Link } from "react-router-dom";
import { accentInk,templateFor,safeWebUrl,type WebsiteConfig,type WebsiteSource } from "@/lib/storefront-studio";
import { gbp } from "@/lib/commerce";
import type { ReactNode } from "react";
function Avatar({source,style}:{source:WebsiteSource;style:{background:string;color:string}}){
 const url=safeWebUrl(source.avatar);
 const [failed,setFailed]=useState(false);
 return url&&!failed?<img src={url} alt="" onError={()=>setFailed(true)} className="w-20 h-20 rounded-full object-cover mx-auto"/>:<div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto text-2xl font-bold" style={style}>{source.name.slice(0,2).toUpperCase()}</div>;
}
export function WebsiteRenderer({config,source,preview=false}:{config:WebsiteConfig;source:WebsiteSource;preview?:boolean}){
 const theme=templateFor(config.templateId)!;const accent=config.accent||theme.accent;
 const buttonStyle={background:accent,color:accentInk(accent)};
 const profilePath="/"+encodeURIComponent(source.username),shopPath="/shop/"+encodeURIComponent(source.username);
 const action=(href:string,label:ReactNode,external=false)=>preview?<span className="block rounded-xl px-4 py-3 font-semibold text-center" style={buttonStyle}>{label}</span>:external?<a className="block rounded-xl px-4 py-3 font-semibold text-center break-words" style={buttonStyle} href={href} target="_blank" rel="noopener noreferrer">{label}</a>:<Link className="block rounded-xl px-4 py-3 font-semibold text-center" style={buttonStyle} to={href}>{label}</Link>;
 return <div style={{background:theme.background,color:theme.ink,fontFamily:theme.id==="boutique"?"Georgia,serif":undefined}} className="min-h-[440px] w-full overflow-hidden break-words">
  <div className="mx-auto max-w-5xl p-5 space-y-5">
   {config.sections.map(s=>{
    const title=s.heading||({hero:source.name,links:"Explore",about:"About",shop:"Shop",contact:"Get in touch",note:"More",media:"Featured content"}[s.id]);
    return <section key={s.id} className={"rounded-2xl p-5 shadow-sm "+(s.id==="hero"?"py-10":"")} style={{background:theme.surface}}>
     {s.id==="hero"?<div className={theme.layout==="split"?"flex flex-wrap gap-5 items-center":"text-center space-y-3"}>{<Avatar key={source.avatar||source.username} source={source} style={buttonStyle}/>}<div className={theme.layout==="split"?"flex-1 min-w-[180px]":"space-y-2"}><h1 className="font-bold text-3xl leading-tight">{title}</h1><p className="text-sm opacity-80">@{source.username}</p><p className="whitespace-pre-wrap">{s.body||source.bio}</p></div></div>:<>
     <h2 className="text-xl font-bold mb-3">{title}</h2>{s.body&&<p className="whitespace-pre-wrap mb-3">{s.body}</p>}
     {s.id==="links"&&(source.links.length?<div className="grid gap-3" style={{gridTemplateColumns:theme.layout==="stack"?"1fr":"repeat(auto-fit,minmax(min(100%,220px),1fr))"}}>{source.links.map(l=><div key={l.id}>{safeWebUrl(l.url)&&action(l.url,l.title,true)}</div>)}</div>:<p className="text-sm opacity-70">No active links yet.</p>)}
     {s.id==="about"&&!s.body&&<p className="whitespace-pre-wrap">{source.bio||"More information coming soon."}</p>}
     {s.id==="shop"&&<div className="space-y-3">{source.products.map(p=><div className="flex justify-between gap-3 border-b border-current/10 pb-2" key={p.id}><span>{p.name}</span><strong>{gbp(p.amount)}</strong></div>)}{action(shopPath,"Visit digital shop")}</div>}
     {s.id==="media"&&<SocialMediaGallery links={source.links} username={source.username} preview={preview} showEmpty={preview}/>}
     {s.id==="contact"&&action(profilePath,"View profile and contact options")}
     </>}
    </section>;
   })}
   <footer className="text-center text-xs py-4">{!config.hideBrand&&(preview?<span>Powered by Share The Link</span>:<Link to="/">Powered by Share The Link</Link>)}{!preview&&<div className="mt-2"><Link to={profilePath} className="underline">Original profile</Link></div>}</footer>
  </div>
 </div>;
}
