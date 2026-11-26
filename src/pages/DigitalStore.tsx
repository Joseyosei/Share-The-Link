import { useEffect,useState,useRef } from "react";
import { useParams,useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card,CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { commerceApi } from "@/lib/commerce-api";
import { gbp } from "@/lib/commerce";
type Catalog={name:string;checkoutEnabled:boolean;products:{id:string;name:string;description:string;amount:number}[]};
export function DigitalStore(){
 const {username}=useParams(),[data,setData]=useState<Catalog|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[codes,setCodes]=useState<Record<string,string>>({});
 const lock=useRef(false);
 useEffect(()=>{let cancelled=false;setData(null);setError("");commerceApi("catalog",{username},false).then(v=>{if(!cancelled)setData(v);}).catch(e=>{if(!cancelled)setError(e.message);});return()=>{cancelled=true;};},[username]);
 const buy=async(id:string)=>{if(lock.current)return;lock.current=true;setBusy(true);setError("");try{const data=await commerceApi("checkout",{productId:id,code:codes[id]||""},false);const url=new URL(data.url);if(url.protocol!=="https:"||url.hostname!=="checkout.stripe.com")throw Error("Invalid checkout URL");window.location.assign(url.href);}catch(e){setError(e instanceof Error?e.message:"Checkout failed");}finally{lock.current=false;setBusy(false);}};
 return <main className="max-w-3xl mx-auto p-6 space-y-4"><h1 className="text-3xl font-bold">{data?.name||"Digital shop"}</h1>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p>Loading…</p>}{data&&<><p className="text-sm text-muted-foreground">{data.checkoutEnabled?"Test checkout only. No real payment.":"Purchases are not available yet."}</p>{data.products.length===0&&<p>No published products.</p>}{data.products.map(p=><Card key={p.id}><CardContent className="p-5 space-y-3"><h2 className="font-bold text-xl">{p.name}</h2><p>{p.description}</p><p className="font-semibold">{gbp(p.amount)}</p><label className="block text-sm">Discount code (optional)<Input value={codes[p.id]||""} onChange={e=>setCodes(c=>({...c,[p.id]:e.target.value}))}/></label><Button disabled={busy||!data.checkoutEnabled} onClick={()=>void buy(p.id)}>Buy PDF</Button></CardContent></Card>)}</>}</main>;
}
export function DigitalOrder(){
 const [params]=useSearchParams();const id=params.get("order");const cancelled=params.get("cancelled")==="1";
 const [token]=useState(()=>new URLSearchParams(window.location.hash.slice(1)).get("key")||"");
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false),[download,setDownload]=useState("");
 const refresh=async()=>{setBusy(true);setDownload("");setMessage("");try{const r=await commerceApi("claim",{orderId:id,token},false);if(r.status==="paid"){setDownload(r.downloadUrl);setMessage("Payment verified. Your download link is valid for 60 seconds.");}else setMessage(r.status==="pending"?"Payment is not yet confirmed. Check again shortly.":"Download is unavailable.");}catch(e){setMessage(e instanceof Error?e.message:"Unable to verify payment");}finally{setBusy(false);}};
 useEffect(()=>{if(id&&token&&!cancelled)void refresh();},[id,token,cancelled]);
 return <main className="max-w-lg mx-auto p-6 space-y-4"><h1 className="text-2xl font-bold">{cancelled?"Checkout cancelled":"Your digital order"}</h1>{cancelled?<p>No payment is confirmed on this page.</p>:<><p role="status">{message||"Verify your purchase to download."}</p>{download&&<Button asChild><a href={download} rel="noreferrer">Download PDF</a></Button>}<Button variant="outline" disabled={busy||!id||!token} onClick={()=>void refresh()}>Check payment / refresh download</Button><p className="text-xs text-muted-foreground">Keep this private order link to access your download. Do not share it.</p></>}</main>;
}
