import { useEffect,useState,useRef } from "react";
import { Link,useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card,CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { PLAN_POLICY } from "@/lib/plan-policy";
import { useSubscription } from "@/hooks/useSubscription";
import { trackFounderEvent } from "@/lib/track-founder-event";
export const Pricing=()=>{
 const [interval,setInterval]=useState<"monthly"|"yearly">("monthly"),[sales,setSales]=useState("250");
 const {startCheckout,checkoutLoading,subscription,loading,openCustomerPortal}=useSubscription();
 const navigate=useNavigate();const ref=useRef<HTMLElement>(null);
 useEffect(()=>{if(!ref.current)return;const ob=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){void trackFounderEvent("pricing_viewed");ob.disconnect();}});ob.observe(ref.current);return()=>ob.disconnect();},[]);
 const fmt=(n:number)=>new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(n);
 const revenue=Math.max(0,Math.min(1000000,Number(sales)||0));
 return <section id="pricing" ref={ref} className="py-16 px-4 bg-muted"><div className="max-w-6xl mx-auto space-y-8"><div className="text-center space-y-3"><h2 className="text-4xl font-bold">Start free. Upgrade as you earn.</h2><p className="text-muted-foreground">Proposed digital commerce fees and plan allowances. New checkout is in testing; no live charges through this preview.</p><div className="flex gap-2 justify-center">{(["monthly","yearly"] as const).map(i=><Button key={i} variant={interval===i?"default":"outline"} aria-pressed={interval===i} onClick={()=>setInterval(i)}>{i==="monthly"?"Monthly":"Annual · save 33%"}</Button>)}</div></div>
 <div className="grid md:grid-cols-3 gap-4">{(["free","pro","business"] as const).map(t=>{const p=PLAN_POLICY[t];return <Card key={t} className={t==="pro"?"border-primary shadow-md":""}><CardContent className="p-6 space-y-4"><h3 className="text-xl font-bold">{p.name}</h3><p className="text-3xl font-bold">{p.monthly===0?"£0":fmt(p[interval])}<span className="text-sm font-normal"> /{interval==="monthly"?"month":"year"}</span></p>{interval==="yearly"&&p.yearly>0&&<p className="text-sm text-muted-foreground">Equivalent to {fmt(p.yearly/12)}/month, billed annually</p>}
 <ul className="space-y-2">{["Unlimited basic links",p.products+" digital PDF products (preview)",p.ai+" AI creator requests/month",p.feeBps/100+"% platform fee on digital sales (preview)",p.discounts?"Product discount codes (preview)":"Basic storefront",t==="free"?"Manual social media embeds":"Automatic social imports and pinned posts (preview)"].map(f=><li key={f} className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary shrink-0"/>{f}</li>)}</ul>
 <Button className="w-full" disabled={checkoutLoading||loading} onClick={()=>{if(t==="free"){navigate("/signup");return;}if(subscription.subscribed){void openCustomerPortal();return;}void startCheckout(t,interval);}}>{t==="free"?"Get started free":subscription.subscribed?"Manage subscription":"Choose "+p.name}</Button></CardContent></Card>;})}</div>
 <Card><CardContent className="p-6 space-y-3"><h3 className="font-bold text-lg">Compare monthly costs</h3><label className="block text-sm">Monthly digital sales (£)<input className="block border rounded-md bg-background p-2 mt-1" type="number" min={0} max={1000000} value={sales} onChange={e=>setSales(e.target.value)}/></label><div className="grid sm:grid-cols-3 gap-3">{(["free","pro","business"] as const).map(t=><div key={t} className="border rounded-lg p-3"><p>{PLAN_POLICY[t].name}</p><strong>{fmt((interval==="yearly"?PLAN_POLICY[t].yearly/12:PLAN_POLICY[t].monthly)+revenue*PLAN_POLICY[t].feeBps/10000)}</strong></div>)}</div><p className="text-xs text-muted-foreground">Illustrative costs only. Excludes Stripe processing, taxes and refunds; per-order fees are rounded. Annual subscription is paid upfront.</p></CardContent></Card><p className="text-center text-sm">Existing enterprise accounts remain supported. <Link className="underline" to="/contact">Contact sales</Link>.</p></div></section>;
};
