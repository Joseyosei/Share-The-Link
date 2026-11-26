import { useEffect,useState,useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2,Circle,ArrowRight,Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card,CardContent } from "@/components/ui/card";
import { authFetch } from "@/lib/auth-fetch";
import { GOALS,isCreatorGoal,setupProgress,type CreatorGoal } from "@/lib/creator-onboarding";
interface Props {profileReady:boolean;hasPage:boolean;activeLinks:number;totalLinks:number;isFree:boolean;onAdd:()=>void;onCopy:()=>Promise<boolean>}
interface Saved {goal:CreatorGoal|null;copied:boolean;activated:boolean}
const endpoint="/api/analytics-data?scope=onboarding";
export function CreatorOnboarding({profileReady,hasPage,activeLinks,totalLinks,isFree,onAdd,onCopy}:Props){
 const [saved,setSaved]=useState<Saved|null>(null),[error,setError]=useState(""),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0);
 const lock=useRef(false);const version=useRef(0);const mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;}},[]);
 const request=async(action:string,goal?:CreatorGoal,signal?:AbortSignal):Promise<Saved>=>{
  const res=await authFetch(endpoint,{method:"POST",body:JSON.stringify({action,goal}),signal});
  const json=await res.json();if(!res.ok)throw Error(json.error||"Unable to save setup");
  return {goal:isCreatorGoal(json.goal)?json.goal:null,copied:json.copied===true,activated:json.activated===true};
 };
 useEffect(()=>{
  const controller=new AbortController();const current=++version.current;
  request("sync",undefined,controller.signal).then(v=>{if(!controller.signal.aborted&&current===version.current){setSaved(v);setError("");}}).catch(()=>{if(!controller.signal.aborted&&current===version.current)setError("Setup preferences are temporarily unavailable.");});
  return ()=>controller.abort();
 },[hasPage,activeLinks,retry]);
 const change=async(action:"goal"|"copied",goal?:CreatorGoal)=>{
  if(lock.current)return;
  lock.current=true;setBusy(true);setError("");const current=++version.current;
  try{
   if(action==="copied"&&!await onCopy())return;
   const v=await request(action,goal);
   if(mounted.current&&current===version.current)setSaved(v);
  }catch{if(mounted.current)setError("Unable to save setup. Please retry.");}
  finally{lock.current=false;if(mounted.current)setBusy(false);}
 };
 const progress=setupProgress({goal:saved?.goal??null,profileReady,hasPage,activeLinks,copied:saved?.copied??false});
 const goal=saved?.goal?GOALS[saved.goal]:null;
 return <Card><CardContent className="p-5 space-y-4">
  <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Your creator launchpad</h2><p className="text-sm text-muted-foreground">Choose a goal and get your page ready to share.</p></div><span className="text-sm font-semibold">{progress.completed}/4</span></div>
  <div className="h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-label="Creator setup progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={progress.completed}><div className="h-full bg-primary rounded-full" style={{width:progress.completed*25+"%"}}/></div>
  {error&&<div role="alert" className="text-sm text-destructive flex flex-wrap items-center gap-2">{error}<Button size="sm" variant="outline" disabled={busy} onClick={()=>setRetry(v=>v+1)}>Retry</Button></div>}
  {!saved&&!error&&<p role="status" className="text-sm text-muted-foreground">Loading your setup preferences…</p>}
  <fieldset disabled={busy||!saved} className="space-y-2"><legend className="text-sm font-semibold mb-2">What do you want to achieve?</legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{Object.entries(GOALS).map(([id,g])=><button key={id} type="button" aria-pressed={saved?.goal===id} onClick={()=>{if(isCreatorGoal(id))void change("goal",id);}} className={"rounded-lg border p-3 text-left disabled:opacity-60 "+(saved?.goal===id?"border-primary bg-primary/5":"hover:bg-muted")}><span className="block font-medium text-sm">{g.label}</span><span className="text-xs text-muted-foreground">{g.description}</span></button>)}</div></fieldset>
  {goal&&<div className="rounded-xl border p-3 space-y-2"><h3 className="font-semibold text-sm">Recommended for you</h3><p className="text-sm">{goal.suggestion}</p><p className="text-xs text-muted-foreground">Free theme suggestions: {goal.themes.join(", ")}.</p><div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link to="/dashboard/appearance">Explore themes</Link></Button><Button asChild size="sm" variant="outline"><Link to={goal.next}>{goal.nextLabel}</Link></Button></div></div>}
  <div className="space-y-2">{progress.steps.map(s=><div key={s.id} className="flex items-center gap-3 border rounded-lg p-3">{s.done?<CheckCircle2 className="w-5 h-5 text-green-600 shrink-0"/>:<Circle className="w-5 h-5 text-muted-foreground shrink-0"/>}<span className="text-sm flex-1">{s.label}</span>{!s.done&&s.id==="profile"&&<Button asChild size="sm" variant="ghost"><Link to="/dashboard/settings">Edit <ArrowRight className="w-4 h-4 ml-1"/></Link></Button>}{!s.done&&s.id==="link"&&<Button size="sm" variant="ghost" onClick={onAdd}>Add link</Button>}{!s.done&&s.id==="copy"&&<Button size="sm" variant="ghost" disabled={!progress.ready||busy||!saved} onClick={()=>void change("copied")}>Copy link</Button>}</div>)}</div>
  {progress.ready&&<p className="text-sm text-green-700 dark:text-green-400">Your page has an active link. Share the URL with your audience when you're ready.</p>}
  {isFree&&progress.ready&&totalLinks>=5&&<div className="border rounded-lg p-3"><h3 className="text-sm font-semibold flex gap-2 items-center"><Sparkles className="w-4 h-4"/>Need more links?</h3><p className="text-xs text-muted-foreground mt-1">Compare premium plans for additional link capacity. Your existing page stays available.</p><Button asChild variant="outline" size="sm" className="mt-2"><Link to="/pricing">Compare plans</Link></Button></div>}
 </CardContent></Card>;
}
