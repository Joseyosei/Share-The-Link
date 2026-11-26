import {useEffect,useState,useRef} from "react";
import {Link} from "react-router-dom";
import {Card,CardContent} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {socialApi} from "@/lib/social-content-api";
import {PROVIDER_LABEL,type Provider,type FeedItem} from "@/lib/social-content";
type Account={provider:Provider;configured:boolean;status:string;published:boolean;accountName:string|null;lastSync:string|null;due:boolean;items:FeedItem[]};
export function SocialContentManager(){
 const [data,setData]=useState<{premium:boolean;providers:Account[]}|null>(null),[error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 const lock=useRef(false),auto=useRef(false);
 const load=async()=>{const v=await socialApi({action:"list"});setData(v);return v as {premium:boolean;providers:Account[]};};
 useEffect(()=>{let cancelled=false;socialApi({action:"list"}).then(async v=>{if(cancelled)return;setData(v);if(v.premium&&!auto.current){auto.current=true;for(const r of v.providers.filter((a:Account)=>a.due&&a.configured).slice(0,3)){if(cancelled)break;try{await socialApi({action:"sync",provider:r.provider});}catch{/* manual retry remains available */}}if(!cancelled)await load();}}).catch(()=>{if(!cancelled)setError("Social connections are unavailable. Manual links still work.");});return()=>{cancelled=true;};},[]);
 const action=async(provider:Provider,op:string,extra:Record<string,unknown>={})=>{
  if(lock.current)return;lock.current=true;setBusy(true);setError("");setMessage("");
  try{
   const r=await socialApi({action:op,provider,...extra});
   if(op==="start"){const u=new URL(r.url);if(u.protocol!=="https:"||!["www.instagram.com","www.tiktok.com","accounts.google.com"].includes(u.hostname))throw Error("Invalid authorization URL");window.location.assign(u.href);return;}
   setMessage(op==="disconnect"?(r.revoked?"Disconnected and provider access revoked.":"Disconnected locally. Revoke Share The Link in the provider's account settings as well."):"Changes saved.");await load();
  }catch(e){setError(e instanceof Error?e.message:"Unable to update connection");}finally{lock.current=false;setBusy(false);}
 };
 return <Card className="mb-5"><CardContent className="p-5 space-y-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-xl font-bold">Social Content Hub</h2><p className="text-sm text-muted-foreground">Connect your accounts to import recent public posts automatically. Imported content is private until you publish it to your gallery.</p></div><Button variant="outline" disabled={busy} onClick={()=>void load().catch(()=>setError("Unable to refresh connections"))}>Refresh</Button></div>
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}{message&&<p role="status" className="text-sm">{message}</p>}
 {!data&&!error&&<p role="status">Loading connections…</p>}
 {data&&!data.premium&&<p className="text-sm rounded-lg bg-muted p-3">Automatic imports and pins require Creator Pro or Business. Manual social links remain free. <Link className="underline" to="/pricing">Compare plans</Link></p>}
 {data?.providers.map(a=><div key={a.provider} className="rounded-xl border p-4 space-y-3"><div className="flex flex-wrap gap-2 items-center justify-between"><div><h3 className="font-semibold">{PROVIDER_LABEL[a.provider]}</h3><p className="text-xs text-muted-foreground">{a.accountName||(!a.configured?"Provider setup required":a.status==="reauthorize"?"Reconnect required":"Not connected")}</p></div>{a.status==="connected"?<div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={busy||!data.premium||!a.configured} onClick={()=>void action(a.provider,"sync")}>Sync now</Button><Button size="sm" variant="outline" disabled={busy||(!a.published&&(!data.premium||!a.configured))} onClick={()=>void action(a.provider,"visibility",{published:!a.published})}>{a.published?"Hide gallery":"Publish gallery"}</Button><Button size="sm" variant="ghost" disabled={busy} onClick={()=>{if(window.confirm("Disconnect and remove imported content?"))void action(a.provider,"disconnect");}}>Disconnect</Button></div>:<Button size="sm" disabled={busy||!data.premium||!a.configured} onClick={()=>void action(a.provider,"start")}>Connect {PROVIDER_LABEL[a.provider]}</Button>}</div>
 {a.status==="connected"&&<><p className="text-xs text-muted-foreground">{a.published?"Public gallery enabled":"Private preview"} · Last synced {a.lastSync?new Date(a.lastSync).toLocaleString():"never"}</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">{a.items.map(i=><div key={i.key} className="border rounded-lg p-2 min-w-0">{i.thumbnail&&<img src={i.thumbnail} alt="" className="w-full h-28 object-cover rounded" loading="lazy" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.display="none";}}/>}<p className="text-sm line-clamp-2 mt-1">{i.title}</p><Button size="sm" variant="ghost" disabled={busy||!data.premium} onClick={()=>void action(a.provider,"pin",{key:i.key,pinned:!i.pinned})}>{i.pinned?"Unpin":"Pin post"}</Button></div>)}</div></>}
 {a.provider==="instagram"&&<p className="text-xs text-muted-foreground">Requires an eligible professional Instagram account.</p>}</div>)}
 <p className="text-xs text-muted-foreground">Daily sync is best effort; opening this dashboard can refresh due accounts. Thumbnails may expire. Disconnect at any time to remove your imported gallery.</p></CardContent></Card>;
}
