import { useEffect,useState } from "react";
import { Link } from "react-router-dom";
import { Card,CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";
interface Usage {productsUsed:number;productsLimit:number;builderUsed:number;builderLimit:number;periodStart:string;policy:{name:string;feeBps:number}}
export function PlanUsage(){
 const [data,setData]=useState<Usage|null>(null),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 useEffect(()=>{const controller=new AbortController();setFailed(false);authFetch("/api/check-subscription",{method:"POST",body:JSON.stringify({action:"usage"}),signal:controller.signal}).then(async r=>{if(!r.ok)throw Error("Usage unavailable");return r.json();}).then(j=>{if(!controller.signal.aborted)setData(j);}).catch(()=>{if(!controller.signal.aborted){setData(null);setFailed(true);}});return()=>controller.abort();},[retry]);
 return <Card><CardContent className="p-5 space-y-3"><h2 className="font-semibold">Your plan and usage</h2>{data?<><p className="text-lg font-bold">{data.policy.name}</p>{[["Digital products",data.productsUsed,data.productsLimit],["AI creator requests",data.builderUsed,data.builderLimit]].map(([label,used,cap])=><div key={label}><div className="flex justify-between text-sm"><span>{label}</span><span>{used}/{cap}</span></div><div className="h-2 bg-muted rounded-full mt-1"><div className="h-2 bg-primary rounded-full" style={{width:Math.min(100,Number(used)/Number(cap)*100)+"%"}}/></div></div>)}<p className="text-xs text-muted-foreground">AI quota resets each UTC calendar month. Digital-sale test fee: {data.policy.feeBps/100}%.</p><Button asChild size="sm" variant="outline"><Link to="/pricing">Compare plans</Link></Button></>:failed?<div className="text-sm text-muted-foreground">Usage is unavailable until billing and database setup are complete. <Button variant="ghost" size="sm" onClick={()=>setRetry(v=>v+1)}>Retry</Button></div>:<p className="text-sm text-muted-foreground">Checking your allowances…</p>}</CardContent></Card>;
}
