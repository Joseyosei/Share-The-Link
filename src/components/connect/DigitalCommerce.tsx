import { useState,useEffect,useRef } from "react";
import { Card,CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { commerceApi } from "@/lib/commerce-api";
import { gbp,parseGBP,normalizeCode,validCode } from "@/lib/commerce";
type Product={id:string;name:string;description:string;amount:number;active:boolean;discount_code:string|null;discount_percent:number};
type Order={id:string;product_name:string;amount:number;status:string;buyer_email:string|null;created_at:string};
type Snapshot={products:Product[];orders:Order[];checkoutEnabled:boolean};
export function DigitalCommerce({username}:{username?:string|null}){
 const [data,setData]=useState<Snapshot|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true);
 const [name,setName]=useState(""),[description,setDescription]=useState(""),[price,setPrice]=useState(""),[code,setCode]=useState(""),[percent,setPercent]=useState(""),[file,setFile]=useState<File|null>(null);
 const fileRef=useRef<HTMLInputElement>(null),lock=useRef(false);
 const load=async()=>{setLoading(true);try{setData(await commerceApi("dashboard"));setError("");}catch(e){setError(e instanceof Error?e.message:"Unable to load commerce");}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 const save=async(e:React.FormEvent)=>{e.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError("");
 try{
  const amount=parseGBP(price);const discount=normalizeCode(code);const pct=discount?Number(percent):0;
  if(discount&&(!validCode(discount)||!Number.isInteger(pct)||pct<1||pct>80))throw Error("Enter a valid discount code and percentage.");
  if(!file||file.type!=="application/pdf"||file.size>10485760)throw Error("Select a PDF up to 10 MB.");
  const {data:{user}}=await supabase.auth.getUser();if(!user)throw Error("Sign in again.");
  const path=user.id+"/"+crypto.randomUUID()+".pdf";
  const {error:uploadError}=await supabase.storage.from("commerce-private").upload(path,file,{contentType:"application/pdf",cacheControl:"0",upsert:false});
  if(uploadError)throw Error("Upload failed. Verify the commerce database migration.");
  await commerceApi("create",{name,description,amount,code:discount,percent:pct,filePath:path});
  setName("");setDescription("");setPrice("");setCode("");setPercent("");setFile(null);if(fileRef.current)fileRef.current.value="";
  await load();
 }catch(e){setError(e instanceof Error?e.message:"Unable to save");}finally{lock.current=false;setBusy(false);}};
 const publish=async(p:Product)=>{if(lock.current)return;lock.current=true;setBusy(true);try{await commerceApi("publish",{productId:p.id,active:!p.active});await load();}catch(e){setError(e instanceof Error?e.message:"Unable to update");}finally{lock.current=false;setBusy(false);}};
 const paid=data?.orders.filter(o=>o.status==="paid")||[];
 return <section className="space-y-4"><header className="flex flex-wrap justify-between gap-2"><div><h2 className="text-xl font-bold">Digital commerce</h2><p className="text-sm text-muted-foreground">Sell downloadable PDFs with verified payments.</p></div><Button variant="outline" onClick={()=>void load()} disabled={loading||busy}>Refresh</Button></header>
 {error&&<p role="alert" className="text-sm text-destructive">{error}</p>}
 {loading&&<p role="status">Loading shop…</p>}
 {data&&<><p className="text-sm bg-muted p-3 rounded-lg">{data.checkoutEnabled?"Test mode only — no real charges. Seller Stripe test account must be ready.":"Checkout disabled until Stripe test setup and database validation are complete."}</p>
 <div className="grid sm:grid-cols-3 gap-3">{[["Paid test orders (latest 100)",paid.length],["Gross test sales (latest 100)",gbp(paid.reduce((sum,o)=>sum+o.amount,0))],["Digital products",data.products.length]].map(([label,value])=><Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl font-bold">{value}</p></CardContent></Card>)}</div>
 {username&&<Button asChild variant="outline"><a href={"/shop/"+encodeURIComponent(username)} target="_blank" rel="noopener noreferrer">View digital storefront</a></Button>}
 <Card><CardContent className="p-4 space-y-3"><h3 className="font-semibold">New digital product</h3><form onSubmit={save} className="space-y-3">
 <label className="block text-sm">Name<Input required maxLength={120} value={name} onChange={e=>setName(e.target.value)}/></label>
 <label className="block text-sm">Description<Textarea maxLength={2000} value={description} onChange={e=>setDescription(e.target.value)}/></label>
 <label className="block text-sm">Price (£)<Input required inputMode="decimal" value={price} onChange={e=>setPrice(e.target.value)} placeholder="9.99"/></label>
 <label className="block text-sm">Private PDF (max 10 MB)<Input ref={fileRef} required type="file" accept="application/pdf" onChange={e=>setFile(e.target.files?.[0]||null)}/></label>
 <div className="grid sm:grid-cols-2 gap-2"><label className="block text-sm">Optional discount code<Input value={code} onChange={e=>setCode(e.target.value)} maxLength={24}/></label><label className="block text-sm">Discount % (1–80)<Input type="number" min={1} max={80} value={percent} onChange={e=>setPercent(e.target.value)}/></label></div>
 <Button disabled={busy} type="submit">Save draft</Button></form></CardContent></Card>
 <Card><CardContent className="p-4 space-y-3"><h3 className="font-semibold">Digital products</h3>{data.products.length===0&&<p className="text-sm text-muted-foreground">No digital products yet.</p>}{data.products.map(p=><div key={p.id} className="flex flex-wrap gap-2 justify-between items-center border-b pb-3"><div><p className="font-medium">{p.name} · {gbp(p.amount)}</p><p className="text-xs text-muted-foreground">{p.active?"Published":"Draft"}{p.discount_code?" · "+p.discount_code+" ("+p.discount_percent+"%)":""}</p></div><Button size="sm" variant="outline" disabled={busy} onClick={()=>void publish(p)}>{p.active?"Unpublish":"Publish"}</Button></div>)}</CardContent></Card>
 <Card><CardContent className="p-4 space-y-3"><h3 className="font-semibold">Recent orders and customers</h3>{data.orders.length===0&&<p className="text-sm text-muted-foreground">No orders yet.</p>}{data.orders.map(o=><div key={o.id} className="border-b pb-2 text-sm"><p className="font-medium">{o.product_name} · {gbp(o.amount)} · {o.status}</p><p className="text-xs text-muted-foreground break-all">{o.buyer_email||"No confirmed customer"} · {new Date(o.created_at).toLocaleDateString()}</p></div>)}<p className="text-xs text-muted-foreground">Test orders only. Gross sales exclude processing fees and do not represent payouts.</p></CardContent></Card>
 </>}</section>;
}
