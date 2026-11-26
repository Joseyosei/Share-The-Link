export const WEBSITE_TEMPLATES = [
 {id:"essential",name:"Essential",category:"Creator",premium:false,background:"#f8fafc",surface:"#ffffff",ink:"#172033",accent:"#334155",layout:"stack",description:"Clean, focused and easy to navigate."},
 {id:"community",name:"Common Ground",category:"Community",premium:false,background:"#f0fdf4",surface:"#ffffff",ink:"#164e3d",accent:"#166534",layout:"grid",description:"A welcoming home for your community."},
 {id:"studio",name:"Studio Noir",category:"Portfolio",premium:true,background:"#111827",surface:"#1f2937",ink:"#f9fafb",accent:"#d8b4fe",layout:"grid",description:"An editorial portfolio for creative professionals."},
 {id:"boutique",name:"Boutique",category:"Commerce",premium:true,background:"#fdf4e9",surface:"#fffdf9",ink:"#422006",accent:"#9a3412",layout:"grid",description:"Warm, refined product-first storytelling."},
 {id:"consultant",name:"Executive",category:"Services",premium:true,background:"#eef2ff",surface:"#ffffff",ink:"#172554",accent:"#3730a3",layout:"split",description:"A polished service business and personal brand."},
 {id:"signal",name:"Signal",category:"Creator",premium:true,background:"#171717",surface:"#262626",ink:"#fafafa",accent:"#bef264",layout:"split",description:"Bold contrast for creators and launches."},
] as const;
export const SECTION_TYPES=["hero","links","about","shop","contact","note"] as const;
export type SectionType=typeof SECTION_TYPES[number];
export type WebsiteSection={id:SectionType;heading:string;body:string};
export type WebsiteConfig={templateId:string;sections:WebsiteSection[];accent:string|null;hideBrand:boolean};
export type WebsiteSource={username:string;name:string;bio:string;avatar:string|null;links:{id:string;title:string;url:string}[];products:{id:string;name:string;amount:number}[]};
export const SECTION_LABELS:Record<SectionType,string>={hero:"Hero",links:"Links",about:"About",shop:"Digital shop",contact:"Contact & services",note:"Custom text"};
export function templateFor(id:string){return WEBSITE_TEMPLATES.find(t=>t.id===id);}
export function defaultWebsite():WebsiteConfig{return {templateId:"essential",sections:[{id:"hero",heading:"",body:""},{id:"links",heading:"Explore my links",body:""},{id:"about",heading:"About me",body:""}],accent:null,hideBrand:false};}
export function validateWebsite(value:unknown):WebsiteConfig{
 if(!value||typeof value!=="object")throw Error("Invalid website");
 const v=value as Record<string,unknown>;
 if(typeof v.templateId!=="string"||!templateFor(v.templateId)||!Array.isArray(v.sections)||v.sections.length<1||v.sections.length>6||typeof v.hideBrand!=="boolean"||(v.accent!==null&&(typeof v.accent!=="string"||!/^#[0-9a-fA-F]{6}$/.test(v.accent))))throw Error("Invalid website settings");
 const seen=new Set<string>();
 const sections=v.sections.map(s=>{
  if(!s||typeof s!=="object"||!SECTION_TYPES.includes(s.id)||seen.has(s.id)||typeof s.heading!=="string"||typeof s.body!=="string"||s.heading.length>100||s.body.length>1000)throw Error("Invalid or duplicate section");
  seen.add(s.id);return {id:s.id as SectionType,heading:s.heading.trim(),body:s.body.trim()};
 });
 if(!seen.has("hero"))throw Error("A hero section is required");
 return {templateId:v.templateId,sections,accent:v.accent as string|null,hideBrand:v.hideBrand};
}
export function needsPremium(config:WebsiteConfig){return !!templateFor(config.templateId)?.premium||config.accent!==null||config.hideBrand;}
export function moveSection(sections:WebsiteSection[],from:string,to:string){
 const a=sections.findIndex(s=>s.id===from),b=sections.findIndex(s=>s.id===to);
 if(a<0||b<0||a===b)return sections;
 const result=[...sections];const [item]=result.splice(a,1);result.splice(b,0,item);return result;
}
export function safeWebUrl(value:unknown):string|null{
 if(typeof value!=="string"||value.length>2048)return null;
 try{const u=new URL(value);return ["http:","https:"].includes(u.protocol)&&!u.username&&!u.password?u.href:null;}catch{return null;}
}
export function visibleWebsiteLinks(rows:any[],now=Date.now()){
 return rows.filter(row=>{const start=row.schedule_start?Date.parse(row.schedule_start):null,end=row.schedule_end?Date.parse(row.schedule_end):null;return row.is_active!==false&&(start===null||(Number.isFinite(start)&&start<=now))&&(end===null||(Number.isFinite(end)&&end>=now))&&safeWebUrl(row.url);}).map(row=>({id:String(row.id),title:String(row.title||"Link").slice(0,200),url:safeWebUrl(row.url)!}));
}
export function accentInk(color:string){
 const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4);
 const luminance=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
 return (luminance+.05)/.05>=1.05/(luminance+.05)?"#000000":"#ffffff";
}
