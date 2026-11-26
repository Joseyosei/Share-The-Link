import { useEffect,useState } from "react";
import { Card,CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/auth-fetch";
import { percent } from "@/lib/founder-metrics";
import { ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip } from "recharts";

interface Snapshot {
 registered:number;newUsers:number;recentSignIns:number;dashboardUsers:number;profileComplete:number;activated:number;productSellers:number;pricingUsers:number;checkoutUsers:number;paidUsers:number;trialUsers:number;pastDueUsers:number;checkoutSessions:number;completedSessions:number;unconfirmedSessions:number;segments:Record<string,number>;dailySignups:{date:string;count:number}[];trackingSince:string|null;generatedAt:string;days:number;
 onboarding?:null|{started:number;goalSelected:number;everActivated:number;copied:number;goals:Record<string,number>};
 revenue:null|{mrrByCurrency:Record<string,number>;arrByCurrency:Record<string,number>;activeSubscriptions:number};
}
const money=(values:Record<string,number>)=>Object.entries(values).map(([c,v])=>{const fmt=new Intl.NumberFormat("en-GB",{style:"currency",currency:c.toUpperCase()});return fmt.format(v / 10 ** (fmt.resolvedOptions().maximumFractionDigits ?? 2));}).join(" + ")||"£0.00";
export function FounderIntelligence(){
 const [days,setDays]=useState(30),[refresh,setRefresh]=useState(0),[data,setData]=useState<Snapshot|null>(null),[error,setError]=useState(""),[loading,setLoading]=useState(true);
 useEffect(()=>{
  const controller=new AbortController();
  setLoading(true);setError("");setData(null);
  authFetch("/api/analytics-data?scope=founder",{method:"POST",body:JSON.stringify({action:"snapshot",days}),signal:controller.signal})
  .then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error||"Unable to load analytics");if(!controller.signal.aborted)setData(j);})
  .catch(e=>{if(!controller.signal.aborted)setError(e.message);})
  .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
  return ()=>controller.abort();
 },[days,refresh]);
 const conversion=data?percent(data.paidUsers,data.registered):null;
 const metrics=data?[["Registered accounts",data.registered],["New accounts",data.newUsers],["Recent sign-ins",data.recentSignIns],["Activated pages",data.activated],["Paid status (Supabase)",data.paidUsers],["Paid account rate",conversion===null?"—":conversion+"%"],["Gross list-price MRR",data.revenue?money(data.revenue.mrrByCurrency):"Unavailable"],["Annualised run rate",data.revenue?money(data.revenue.arrByCurrency):"Unavailable"]]:[];
 return <section className="space-y-6">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-2xl font-bold">Founder intelligence</h2><p className="text-sm text-muted-foreground">Activation, monetisation and customer behaviour.</p></div><div className="flex gap-2"><select aria-label="Reporting window" className="border rounded-md bg-background px-3" value={days} onChange={e=>setDays(Number(e.target.value))}>{[7,30,90].map(n=><option key={n} value={n}>Last {n} days</option>)}</select><Button variant="outline" disabled={loading} onClick={()=>setRefresh(x=>x+1)}>Refresh</Button></div></header>
  {loading&&<p role="status">Loading real analytics…</p>}
  {error&&<p role="alert" className="text-destructive">{error}</p>}
  {data&&<>
   <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{metrics.map(([label,value])=><Card key={label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="text-2xl font-bold mt-2">{value}</p></CardContent></Card>)}</div>
   <p className="text-xs text-muted-foreground">Account and activation totals are lifetime snapshots; new accounts and sign-ins use the selected window. Revenue is active subscription list price, excludes trials, discounts, tax, refunds and processing fees; not cash collected. {data.revenue?"Stripe active subscriptions: "+data.revenue.activeSubscriptions+".": "Stripe data unavailable."}</p>
   <Card><CardContent className="p-5"><h3 className="font-semibold mb-4">Daily registrations (UTC)</h3><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.dailySignups}><XAxis dataKey="date" tickFormatter={s=>s.slice(5)} minTickGap={24}/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="count" name="Registrations" fill="#6366f1" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></CardContent></Card>
   <div className="grid gap-4 lg:grid-cols-2">
    <Card><CardContent className="p-5 space-y-4"><h3 className="font-semibold">Lifecycle indicators</h3><p className="text-xs text-muted-foreground">Independent counts, not a sequential cohort funnel. Pricing and checkout use selected window.</p>{[["Registered",data.registered],["Profile complete",data.profileComplete],["Page with active link",data.activated],["Active product listing",data.productSellers],["Pricing viewed",data.pricingUsers],["Checkout started",data.checkoutUsers],["Paid status",data.paidUsers]].map(([label,n])=><div key={label}><div className="flex justify-between text-sm"><span>{label}</span><strong>{n}</strong></div><div className="h-2 rounded bg-muted mt-2"><div className="h-2 rounded bg-primary" style={{width:Math.min(100,percent(Number(n),data.registered)||0)+"%"}}/></div></div>)}</CardContent></Card>
    <Card><CardContent className="p-5 space-y-4"><h3 className="font-semibold">Customer segments</h3>{Object.entries(data.segments).map(([k,n])=><div className="flex justify-between border-b pb-2 text-sm" key={k}><span>{({paid:"Paid",trial:"Trial",checkoutIntent:"Checkout intent",activatedFree:"Activated free",notActivated:"Not activated"} as Record<string,string>)[k]||k}</span><strong>{n}</strong></div>)}<p className="text-sm">Past due: {data.pastDueUsers}</p><p className="text-sm">Dashboard users in window: {data.dashboardUsers}</p></CardContent></Card>
   </div>
   <Card><CardContent className="p-5 space-y-3"><h3 className="font-semibold">Creator onboarding</h3>{data.onboarding?<><p>Started: {data.onboarding.started} · Goal selected: {data.onboarding.goalSelected} · Ever activated: {data.onboarding.everActivated} · Copy recorded: {data.onboarding.copied}</p><div className="grid grid-cols-2 gap-2">{Object.entries(data.onboarding.goals).map(([goal,count])=><p key={goal} className="text-sm capitalize">{goal}: {count}</p>)}</div></>:<p className="text-sm text-muted-foreground">Onboarding analytics unavailable until migration is applied.</p>}<p className="text-xs text-muted-foreground">Lifetime since instrumentation; activation means a page with an active link. Copy is user-reported, not evidence of sharing or visits.</p></CardContent></Card>
   <Card><CardContent className="p-5 space-y-3"><h3 className="font-semibold">Checkout tracking</h3><p>Sessions started: {data.checkoutSessions} · Confirmed: {data.completedSessions} · Unconfirmed after 24h: {data.unconfirmedSessions}</p><p className="text-xs text-muted-foreground">Unconfirmed is not proof of abandonment. Tracking begins {data.trackingSince?new Date(data.trackingSince).toLocaleDateString():"after instrumentation is deployed"}. Historical events cannot be reconstructed. Churn is unavailable without reliable subscription history.</p></CardContent></Card>
   <Card><CardContent className="p-5 space-y-3"><h3 className="font-semibold">Recommended next actions</h3>{data.segments.notActivated>0&&<p>Help {data.segments.notActivated} unactivated accounts complete their page and add a link.</p>}{data.unconfirmedSessions>0&&<p>Inspect {data.unconfirmedSessions} unconfirmed checkout sessions in Stripe before contacting users.</p>}{data.activated>0&&<p>Interview activated creators to learn which premium features they would pay for.</p>}{data.registered===0&&<p>Focus on acquiring your first creators.</p>}<p className="text-xs text-muted-foreground">Updated {new Date(data.generatedAt).toLocaleString()}</p></CardContent></Card>
  </>}
 </section>;
}
