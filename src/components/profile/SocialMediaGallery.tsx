import { mergeMedia,type FeedItem } from "@/lib/social-content";
import { socialApi } from "@/lib/social-content-api";
import { useState,useEffect } from "react";
import { Play,ExternalLink,Pin } from "lucide-react";
import { collectSocialMedia,type SocialMedia } from "@/lib/social-media";
function MediaCard({item,preview}:{item:SocialMedia|FeedItem;preview:boolean}){
 const [loaded,setLoaded]=useState(false),[imageFailed,setImageFailed]=useState(false);
 const thumbnail="thumbnail" in item&&!imageFailed?item.thumbnail:null;
 return <article className="rounded-2xl border border-current/15 overflow-hidden min-w-0">
  <div className="px-4 pt-4"><p className="text-xs font-semibold uppercase tracking-wide opacity-70">{item.platform} · {item.kind==="playlist"?"Playlist":item.kind==="post"?"Post":"Video"}</p><h3 className="font-semibold break-words mt-1">{"pinned" in item&&item.pinned&&<Pin className="inline w-3 h-3 mr-1"/>}{item.title}</h3></div>
  {loaded&&!preview?<iframe src={item.embed} title={item.title+" — "+item.platform} className="block w-full border-0 mt-3 bg-white" style={{height:item.platform==="YouTube"?Math.max(220,200):480}} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen/>:<button type="button" disabled={preview} onClick={()=>setLoaded(true)} className="w-[calc(100%-2rem)] mx-4 mt-3 min-h-32 rounded-xl bg-black/10 hover:bg-black/15 flex flex-col items-center justify-center gap-2 px-3 text-sm">{thumbnail&&<img src={thumbnail} alt="" className="w-full max-h-48 object-cover rounded-lg mt-2" loading="lazy" referrerPolicy="no-referrer" onError={()=>setImageFailed(true)}/>}<Play className="w-6 h-6"/>{preview?"Media preview":"Load "+item.platform+" content"}</button>}
  <div className="p-4 text-sm">{preview?<span>View original content</span>:<a href={item.url} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">Open on {item.platform}<ExternalLink className="w-3 h-3"/></a>}</div>
 </article>;
}
export function SocialMediaGallery({links,username,preview=false,showEmpty=false,heading}:{links:Parameters<typeof collectSocialMedia>[0];username?:string;preview?:boolean;showEmpty?:boolean;heading?:string}){
 const [filter,setFilter]=useState("All");
 const [synced,setSynced]=useState<FeedItem[]>([]);
 useEffect(()=>{setSynced([]);if(!username)return;const c=new AbortController();socialApi({action:"public",username},false,c.signal).then(v=>{if(!c.signal.aborted&&Array.isArray(v.items))setSynced(v.items);}).catch(()=>{});return()=>c.abort();},[username]);
 const items=mergeMedia(collectSocialMedia(links),synced);
 if(!items.length)return showEmpty?<p className="text-sm opacity-70">Add a public Instagram post or reel, TikTok post, YouTube video, playlist or channel ID URL in Links Management to showcase it here.</p>:null;
 const platforms=["All",...new Set(items.map(i=>i.platform))];
 const active=platforms.includes(filter)?filter:"All";
 return <div className="space-y-3">{heading&&<h2 className="text-xl font-bold">{heading}</h2>}<div className="flex flex-wrap gap-2" aria-label="Filter media">{platforms.map(p=><button type="button" key={p} aria-pressed={p===active} onClick={()=>setFilter(p)} className={"border border-current/20 rounded-full px-3 py-1 text-xs "+(p===active?"font-bold bg-current/5":"")}>{p}</button>)}</div><p className="text-xs opacity-70">{preview?"Visitors can load media directly from the original platform.":"Loading media connects to the selected social platform. If an embed is unavailable, open the original post."}</p><div className="grid gap-3" style={{gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,260px),1fr))"}}>{items.filter(i=>active==="All"||i.platform===active).map(item=><MediaCard key={item.key} item={item} preview={preview}/>)}</div></div>;
}
