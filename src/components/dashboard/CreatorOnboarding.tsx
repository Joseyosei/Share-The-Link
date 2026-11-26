import { useEffect,useState,useRef } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2,Circle,ArrowRight,Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card,CardContent } from "@/components/ui/card";
import { authFetch } from "@/lib/auth-fetch";
import { GOALS,isCreatorGoal,setupProgress,emptySetup,parseLocalSetup,setupStorageKey,mergeServerSetup,type LocalSetup,type CreatorGoal } from "@/lib/creator-onboarding";
interface Props {userId:string;profileReady:boolean;hasPage:boolean;activeLinks:number;totalLinks:number;isFree:boolean;onAdd:()=>void;onCopy:()=>Promise<boolean>}
interface Saved {goal:CreatorGoal|null;copied:boolean;activated:boolean}
const endpoint="/api/analytics-data?scope=onboarding";
export function CreatorOnboarding({userId,profileReady,hasPage,activeLinks,totalLinks,isFree,onAdd,onCopy}:Props){
 const [saved,setSaved]=useState<LocalSetup>(()=>{try{return parseLocalSetup(localStorage.getItem(setupStorageKey(userId)));}catch{return emptySetup();}});
 const [status,setStatus]=useState<"syncing"|"synced"|"offline">("syncing");
 const [schemaMissing,setSchemaMissing]=useState(false),[storageFailed,setStorageFailed]=useState(false),[revision,setRevision]=useState(0),[copying,setCopying]=useState(false);
 const latest=useRef(saved), generation=useRef(0), queue=useRef<Promise<void>>(Promise.resolve()), copyLock=useRef(false), mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;}},[]);
 const persist=(value:LocalSetup)=>{
  latest.current=value;setSaved(value);
  try{localStorage.setItem(setupStorageKey(userId),JSON.stringify(value));setStorageFailed(false);}
  catch{setStorageFailed(true);}
 };
 const request=async(action:"sync"|"goal"|"copied",goal?:CreatorGoal):Promise<Saved>=>{
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
   const res=await authFetch(endpoint,{method:"POST",body:JSON.stringify({action,goal,expectedUserId:userId}),signal:controller.signal});
   const json=await res.json().catch(()=>null);if(!res.ok||!json)throw Object.assign(Error("Unable to sync setup"),{schemaMissing:json?.code==="ONBOARDING_SCHEMA_UNAVAILABLE"});
   return {goal:isCreatorGoal(json.goal)?json.goal:null,copied:json.copied===true,activated:json.activated===true};
  }finally{clearTimeout(timeout);}
 };
 useEffect(()=>{
  const current=++generation.current;let cancelled=false;
  const valid=()=>!cancelled&&mounted.current&&current===generation.current;
  setStatus("syncing");
  queue.current=queue.current.catch(()=>{}).then(async()=>{
   if(!valid())return;
   const initial=latest.current;
   try{
    let remote=await request("sync");if(!valid())return;
    if(initial.pendingGoal&&initial.goal){remote=await request("goal",initial.goal);if(!valid())return;}
    if(initial.pendingCopy&&hasPage&&activeLinks>0){remote=await request("copied");if(!valid())return;}
    const remaining={...initial,pendingGoal:false,pendingCopy:initial.pendingCopy&&!remote.copied};
    persist(mergeServerSetup(remaining,remote));
    setSchemaMissing(false);setStatus(remaining.pendingCopy?"offline":"synced");
   }catch(e){if(valid()){setSchemaMissing(!!(e as {schemaMissing?:boolean})?.schemaMissing);setStatus("offline");}}
  });
  return()=>{cancelled=true;};
 },[userId,hasPage,activeLinks,revision]);
 const chooseGoal=(goal:CreatorGoal)=>{
  persist({...latest.current,goal,pendingGoal:true});
  setRevision(v=>v+1);
 };
 const copy=async()=>{
  if(copyLock.current)return;
  copyLock.current=true;setCopying(true);
  try{
   if(await onCopy()&&mounted.current){persist({...latest.current,copied:true,pendingCopy:true});setRevision(v=>v+1);}
  }finally{copyLock.current=false;if(mounted.current)setCopying(false);}
 };
 const progress=setupProgress({goal:saved.goal,profileReady,hasPage,activeLinks,copied:saved.copied});
 const goal=saved.goal?GOALS[saved.goal]:null;
 return <Card data-testid="creator-launchpad"><CardContent className="p-5 space-y-4">
  <div className="flex items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">Your creator launchpad</h2><p className="text-sm text-muted-foreground">Choose a goal and get your page ready to share.</p></div><span className="text-sm font-semibold">{progress.completed}/4</span></div>
  <div className="h-2 bg-muted rounded-full overflow-hidden" role="progressbar" aria-label="Creator setup progress" aria-valuemin={0} aria-valuemax={4} aria-valuenow={progress.completed}><div className="h-full bg-primary rounded-full" style={{width:progress.completed*25+"%"}}/></div>
  {status==="offline"&&<div role="status" className="text-sm text-muted-foreground flex flex-wrap items-center gap-2"><span>{storageFailed?"Setup changes are available for this session only.":schemaMissing?"Progress saved on this device. Account sync is not set up yet.":"Setup works on this device. Account sync is temporarily unavailable."}</span><Button size="sm" variant="outline" onClick={()=>setRevision(v=>v+1)}>Retry sync</Button></div>}
  {status==="syncing"&&<p role="status" className="text-xs text-muted-foreground">Syncing account preferences… You can keep working.</p>}
  {storageFailed&&status!=="offline"&&<p role="status" className="text-xs text-muted-foreground">Browser storage is unavailable; unsynced changes may be lost when you leave.</p>}
  <fieldset className="space-y-2"><legend className="text-sm font-semibold mb-2">What do you want to achieve?</legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{Object.entries(GOALS).map(([id,g])=><button key={id} type="button" aria-pressed={saved.goal===id} onClick={()=>{if(isCreatorGoal(id))chooseGoal(id);}} className={"rounded-lg border p-3 text-left disabled:opacity-60 "+(saved?.goal===id?"border-primary bg-primary/5":"hover:bg-muted")}><span className="block font-medium text-sm">{g.label}</span><span className="text-xs text-muted-foreground">{g.description}</span></button>)}</div></fieldset>
  {goal&&<div className="rounded-xl border p-3 space-y-2"><h3 className="font-semibold text-sm">Recommended for you</h3><p className="text-sm">{goal.suggestion}</p><p className="text-xs text-muted-foreground">Free theme suggestions: {goal.themes.join(", ")}.</p><div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link to="/dashboard/appearance">Explore themes</Link></Button><Button asChild size="sm" variant="outline"><Link to={goal.next}>{goal.nextLabel}</Link></Button></div></div>}
  <div className="space-y-2">{progress.steps.map(s=><div key={s.id} className="flex items-center gap-3 border rounded-lg p-3">{s.done?<CheckCircle2 className="w-5 h-5 text-green-600 shrink-0"/>:<Circle className="w-5 h-5 text-muted-foreground shrink-0"/>}<span className="text-sm flex-1">{s.label}</span>{!s.done&&s.id==="profile"&&<Button asChild size="sm" variant="ghost"><Link to="/dashboard/settings">Edit <ArrowRight className="w-4 h-4 ml-1"/></Link></Button>}{!s.done&&s.id==="link"&&<Button size="sm" variant="ghost" onClick={onAdd}>Add link</Button>}{!s.done&&s.id==="copy"&&<Button size="sm" variant="ghost" disabled={!progress.ready||copying} onClick={()=>void copy()}>Copy link</Button>}</div>)}</div>
  {progress.ready&&<p className="text-sm text-green-700 dark:text-green-400">Your page has an active link. Share the URL with your audience when you're ready.</p>}
  {isFree&&progress.ready&&saved.goal==="sell"&&<div className="border rounded-lg p-3"><h3 className="text-sm font-semibold flex gap-2 items-center"><Sparkles className="w-4 h-4"/>Keep more of your digital sales</h3><p className="text-xs text-muted-foreground mt-1">Compare planned digital sales fees and product allowances. Your existing page stays available.</p><Button asChild variant="outline" size="sm" className="mt-2"><Link to="/pricing">Compare plans</Link></Button></div>}
 </CardContent></Card>;
}
