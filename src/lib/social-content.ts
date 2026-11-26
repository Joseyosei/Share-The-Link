import { parseSocialMedia,type SocialMedia } from "./social-media.js";
export const PROVIDERS=["instagram","tiktok","youtube"] as const;
export type Provider=typeof PROVIDERS[number];
export const PROVIDER_LABEL={instagram:"Instagram",tiktok:"TikTok",youtube:"YouTube"} as const;
export function isProvider(v:unknown):v is Provider{return typeof v==="string"&&(PROVIDERS as readonly string[]).includes(v);}
export type FeedItem=SocialMedia & {thumbnail:string|null;thumbnailUntil:number;publishedAt:string;pinned?:boolean};
export function safeThumbnail(value:unknown,provider:Provider):string|null{
 if(typeof value!=="string"||value.length>2048)return null;
 try{const u=new URL(value);const suffixes=provider==="youtube"?["ytimg.com"]:provider==="instagram"?["cdninstagram.com","fbcdn.net"]:["tiktokcdn.com","tiktokcdn-us.com","tiktokcdn-eu.com","tiktokcdn-us.net","tiktokcdn-eu.net","tiktokv.com","byteoversea.com","ibytedtos.com"];
 return u.protocol==="https:"&&!u.username&&!u.password&&!u.port&&suffixes.some(s=>u.hostname===s||u.hostname.endsWith("."+s))?u.href:null;}catch{return null;}
}
export function makeFeedItem(provider:Provider,url:unknown,title:unknown,thumbnail:unknown,date:unknown,now=Date.now()):FeedItem|null{
 const item=parseSocialMedia(url,typeof title==="string"?title.slice(0,160):"");
 if(!item||item.platform!==PROVIDER_LABEL[provider]||item.kind==="playlist")return null;
 return {...item,thumbnail:safeThumbnail(thumbnail,provider),thumbnailUntil:now+5*3600000,publishedAt:typeof date==="string"&&Number.isFinite(Date.parse(date))?new Date(date).toISOString():""};
}
export function publicItems(media:unknown,pins:string[],provider:Provider,now=Date.now()):FeedItem[]{
 if(!Array.isArray(media))return [];
 const seen=new Set<string>();const items:FeedItem[]=[];
 for(const raw of media.slice(0,20)){
  if(!raw||typeof raw!=="object")continue;
  const item=makeFeedItem(provider,raw.url,raw.title,raw.thumbnail,raw.publishedAt,now);
  if(!item||seen.has(item.key))continue;
  seen.add(item.key);items.push({...item,thumbnail:Number(raw.thumbnailUntil)>now?item.thumbnail:null,thumbnailUntil:Number(raw.thumbnailUntil)||0,pinned:pins.includes(item.key)});
 }
 return items.sort((a,b)=>Number(!!b.pinned)-Number(!!a.pinned)||b.publishedAt.localeCompare(a.publishedAt));
}
export function mergeMedia(manual:SocialMedia[],synced:FeedItem[]):(SocialMedia|FeedItem)[]{
 const result=new Map<string,SocialMedia|FeedItem>();for(const item of [...synced.filter(x=>x.pinned),...synced.filter(x=>!x.pinned),...manual])if(!result.has(item.key))result.set(item.key,item);
 return [...result.values()].slice(0,24);
}
