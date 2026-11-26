import {makeFeedItem,type Provider,type FeedItem} from "../../src/lib/social-content.js";
import {challenge} from "./social-crypto.js";
export type Tokens={access:string;refresh?:string;expires:number};
const scopes={instagram:"instagram_business_basic",tiktok:"user.info.basic,video.list",youtube:"https://www.googleapis.com/auth/youtube.readonly"};
export function credentials(p:Provider){const prefix=p.toUpperCase();const id=process.env["SOCIAL_"+prefix+"_CLIENT_ID"],secret=process.env["SOCIAL_"+prefix+"_CLIENT_SECRET"];if(!id||!secret)throw Error("Provider not configured");return {id,secret};}
export function callback(p:Provider){const u=new URL(process.env.SOCIAL_APP_URL||"https://sharethelink.app");if(u.protocol!=="https:"||u.pathname!=="/"||u.search||u.hash||u.username||u.password)throw Error("Invalid callback origin");return u.origin+"/dashboard/social/callback/"+p;}
export function configured(p:Provider){try{credentials(p);callback(p);return /^[a-fA-F0-9]{64}$/.test(process.env.SOCIAL_TOKEN_KEY||"");}catch{return false;}}
function url(base:string,query:Record<string,string>){const u=new URL(base);for(const [k,v] of Object.entries(query))u.searchParams.set(k,v);return u.href;}
export function authorizeUrl(p:Provider,state:string,verifier:string){
 const {id}=credentials(p),redirect_uri=callback(p);
 const common={response_type:"code",redirect_uri,state,scope:scopes[p]};
 if(p==="instagram")return url("https://www.instagram.com/oauth/authorize",{...common,client_id:id,enable_fb_login:"0",force_authentication:"1"});
 if(p==="tiktok")return url("https://www.tiktok.com/v2/auth/authorize/",{...common,client_key:id});
 return url("https://accounts.google.com/o/oauth2/v2/auth",{...common,client_id:id,access_type:"offline",prompt:"consent",code_challenge:challenge(verifier),code_challenge_method:"S256"});
}
async function request(endpoint:string,init:RequestInit={}){
 const r=await fetch(endpoint,{...init,redirect:"error",signal:AbortSignal.timeout(6000)});
 let j:any;try{j=await r.json();}catch{throw Error("Provider response unavailable");}
 if(!r.ok||(j.error&&j.error.code!=="ok"))throw new Error(r.status===401||r.status===403||j.error==="invalid_grant"?"REAUTHORIZE":"Provider request failed");
 return j;
}
const form=(values:Record<string,string>)=>({method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams(values)});
const bearer=(access:string)=>({Authorization:"Bearer "+access});
function token(j:any,old?:Tokens):Tokens{
 if(typeof j.access_token!=="string"||!j.access_token||!Number.isFinite(Number(j.expires_in))||Number(j.expires_in)<=0)throw Error("Invalid token response");
 return {access:j.access_token,refresh:typeof j.refresh_token==="string"?j.refresh_token:old?.refresh,expires:Date.now()+Number(j.expires_in)*1000};
}
export async function exchange(p:Provider,code:string,verifier:string):Promise<Tokens>{
 const {id,secret}=credentials(p),redirect_uri=callback(p);
 if(p==="instagram"){
  const short=await request("https://api.instagram.com/oauth/access_token",form({client_id:id,client_secret:secret,grant_type:"authorization_code",redirect_uri,code}));
  if(typeof short.access_token!=="string")throw Error("Invalid Instagram token");
  return token(await request(url("https://graph.instagram.com/access_token",{grant_type:"ig_exchange_token",client_secret:secret,access_token:short.access_token})));
 }
 if(p==="tiktok")return token(await request("https://open.tiktokapis.com/v2/oauth/token/",form({client_key:id,client_secret:secret,grant_type:"authorization_code",redirect_uri,code})));
 return token(await request("https://oauth2.googleapis.com/token",form({client_id:id,client_secret:secret,grant_type:"authorization_code",redirect_uri,code,code_verifier:verifier})));
}
export async function refresh(p:Provider,t:Tokens):Promise<Tokens>{
 if(t.expires>Date.now()+ (p==="instagram"?7*86400000:120000))return t;
 const {id,secret}=credentials(p);
 if(p==="instagram")return token(await request(url("https://graph.instagram.com/refresh_access_token",{grant_type:"ig_refresh_token",access_token:t.access})),t);
 if(!t.refresh)throw Error("REAUTHORIZE");
 if(p==="tiktok")return token(await request("https://open.tiktokapis.com/v2/oauth/token/",form({client_key:id,client_secret:secret,grant_type:"refresh_token",refresh_token:t.refresh})),t);
 return token(await request("https://oauth2.googleapis.com/token",form({client_id:id,client_secret:secret,grant_type:"refresh_token",refresh_token:t.refresh})),t);
}
export async function revoke(p:Provider,t:Tokens){
 const {id,secret}=credentials(p);
 if(p==="instagram")return false; // Creator can revoke in Instagram's app permissions; do not claim remote revocation.
 const endpoint=p==="youtube"?"https://oauth2.googleapis.com/revoke":"https://open.tiktokapis.com/v2/oauth/revoke/";
 const body=p==="youtube"?{token:t.refresh||t.access}:{client_key:id,client_secret:secret,token:t.access};
 const r=await fetch(endpoint,{...form(body as Record<string,string>),redirect:"error",signal:AbortSignal.timeout(6000)});if(!r.ok)return false;
 if(p==="tiktok"){const j=await r.json();return !j.error||j.error==="ok"||j.error.code==="ok";}
 return true;
}
export async function fetchFeed(p:Provider,t:Tokens):Promise<{accountId:string;name:string;media:FeedItem[]}>{
 const headers=bearer(t.access);let accountId="",name="";let media:(FeedItem|null)[]=[];
 if(p==="instagram"){
  const version=process.env.SOCIAL_INSTAGRAM_GRAPH_VERSION||"v25.0";if(!/^v\d{2}\.0$/.test(version))throw Error("Invalid Graph version");
  const base="https://graph.instagram.com/"+version;
  const me=await request(url(base+"/me",{fields:"user_id,username,account_type"}),{headers});
  accountId=String(me.user_id||me.id||"");name=String(me.username||"");
  if(!/^\d+$/.test(accountId))throw Error("Invalid Instagram account");
  const posts=await request(url(base+"/"+accountId+"/media",{fields:"id,caption,media_type,permalink,media_url,thumbnail_url,timestamp",limit:"20"}),{headers});
  if(!Array.isArray(posts.data))throw Error("Invalid Instagram feed");
  media=posts.data.map((v:any)=>makeFeedItem(p,v.permalink,v.caption,v.media_type==="VIDEO"?v.thumbnail_url:v.media_url,v.timestamp));
 }else if(p==="tiktok"){
  const me=await request("https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name",{headers});
  accountId=String(me.data?.user?.open_id||"");name=String(me.data?.user?.display_name||"");
  const posts=await request("https://open.tiktokapis.com/v2/video/list/?fields=id,title,video_description,share_url,cover_image_url,create_time",{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({max_count:20})});
  if(!Array.isArray(posts.data?.videos))throw Error("Invalid TikTok feed");
  media=posts.data.videos.map((v:any)=>makeFeedItem(p,v.share_url,v.title||v.video_description,v.cover_image_url,Number.isFinite(v.create_time)?new Date(v.create_time*1000).toISOString():""));
 }else{
  const base="https://www.googleapis.com/youtube/v3";
  const channels=await request(url(base+"/channels",{part:"snippet,contentDetails",mine:"true",maxResults:"2"}),{headers});
  if(channels.items?.length!==1)throw Error("Select exactly one YouTube channel");
  const channel=channels.items[0];accountId=String(channel.id||"");name=String(channel.snippet?.title||"");
  const list=channel.contentDetails?.relatedPlaylists?.uploads;if(typeof list!=="string")throw Error("No uploads playlist");
  const uploads=await request(url(base+"/playlistItems",{part:"contentDetails",playlistId:list,maxResults:"20"}),{headers});
  if(!Array.isArray(uploads.items))throw Error("Invalid uploads");
  const ids=uploads.items.map((v:any)=>v.contentDetails?.videoId).filter((id:any)=>typeof id==="string"&&/^[A-Za-z0-9_-]{11}$/.test(id));
  if(ids.length){const videos=await request(url(base+"/videos",{part:"snippet,status",id:ids.join(",")}),{headers});
  if(!Array.isArray(videos.items))throw Error("Invalid video response");
  media=videos.items.filter((v:any)=>v.snippet?.channelId===accountId&&v.status?.privacyStatus==="public"&&v.status?.embeddable===true).map((v:any)=>makeFeedItem(p,"https://www.youtube.com/watch?v="+v.id,v.snippet.title,v.snippet.thumbnails?.medium?.url||v.snippet.thumbnails?.default?.url,v.snippet.publishedAt));}
 }
 if(!accountId||accountId.length>200)throw Error("Provider account missing");
 return {accountId,name:name.slice(0,160),media:media.filter((x):x is FeedItem=>x!==null).slice(0,20)};
}
