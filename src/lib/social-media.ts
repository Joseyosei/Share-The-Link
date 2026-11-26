export type SocialPlatform="Instagram"|"TikTok"|"YouTube";
export type SocialMedia={platform:SocialPlatform;key:string;url:string;embed:string;kind:"video"|"post"|"playlist";title:string};
const ytId=/^[A-Za-z0-9_-]{11}$/;
const channelId=/^UC[A-Za-z0-9_-]{22}$/;
const playlistId=/^(PL|UU|OLAK5uy_)[A-Za-z0-9_-]{10,100}$/;
export function parseSocialMedia(input:unknown,title=""):SocialMedia|null{
 if(typeof input!=="string"||input.length>2048)return null;
 let u:URL;try{u=new URL(input);}catch{return null;}
 if(u.protocol!=="https:"||u.username||u.password||u.port)return null;
 const parts=u.pathname.split("/").filter(Boolean);
 const host=u.hostname.toLowerCase();
 if(["youtube.com","www.youtube.com","m.youtube.com","youtu.be"].includes(host)){
  const id=host==="youtu.be"?parts[0]:parts[0]==="watch"?u.searchParams.get("v"):["shorts","live","embed"].includes(parts[0])?parts[1]:null;
  if(id&&ytId.test(id))return {platform:"YouTube",key:"yt:"+id,url:"https://www.youtube.com/watch?v="+id,embed:"https://www.youtube.com/embed/"+id,kind:"video",title:title||"YouTube video"};
  const list=parts[0]==="channel"&&channelId.test(parts[1]||"")?"UU"+parts[1].slice(2):u.searchParams.get("list");
  if(list&&playlistId.test(list))return {platform:"YouTube",key:"yt-list:"+list,url:"https://www.youtube.com/playlist?list="+list,embed:"https://www.youtube.com/embed?listType=playlist&list="+list,kind:"playlist",title:title||"YouTube uploads / playlist"};
 }
 if(["instagram.com","www.instagram.com"].includes(host)&&["p","reel","tv"].includes(parts[0])&&/^[A-Za-z0-9_-]{5,32}$/.test(parts[1]||"")){
  const path=parts[0]+"/"+parts[1]+"/",url="https://www.instagram.com/"+path;
  return {platform:"Instagram",key:"ig:"+parts[1],url,embed:url+"embed/",kind:"post",title:title||"Instagram post"};
 }
 if(["tiktok.com","www.tiktok.com","m.tiktok.com"].includes(host)&&/^@[A-Za-z0-9._]{1,30}$/.test(parts[0]||"")&&["video","photo"].includes(parts[1])&&/^\d{10,25}$/.test(parts[2]||"")){
  const id=parts[2];return {platform:"TikTok",key:"tt:"+id,url:"https://www.tiktok.com/"+parts.slice(0,3).join("/"),embed:"https://www.tiktok.com/player/v1/"+id,kind:"video",title:title||"TikTok post"};
 }
 return null;
}
export function collectSocialMedia(links:{title?:string;url:string;is_active?:boolean|null;schedule_start?:string|null;schedule_end?:string|null}[],now=Date.now()){
 const media=new Map<string,SocialMedia>();
 for(const link of links){
  if(link.is_active===false||(link.schedule_start&&!(Date.parse(link.schedule_start)<=now))||(link.schedule_end&&!(Date.parse(link.schedule_end)>=now)))continue;
  const item=parseSocialMedia(link.url,link.title);
  if(item&&!media.has(item.key))media.set(item.key,item);
  if(media.size>=12)break;
 }
 return [...media.values()];
}
