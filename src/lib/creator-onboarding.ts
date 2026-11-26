export const GOALS = {
 audience:{label:"Grow my audience",description:"Bring your content and social links together.",themes:["Agate","Twilight"],next:"/dashboard/subscribers",nextLabel:"Explore subscribers",suggestion:"Add your latest content, newsletter and social profiles."},
 sell:{label:"Sell products",description:"Showcase your products and services.",themes:["Mineral","Air"],next:"/connect",nextLabel:"Open my shop",suggestion:"Add your product page or shop link."},
 bookings:{label:"Get bookings",description:"Help clients discover and book your services.",themes:["Lake","Serenity"],next:"/dashboard/bookings",nextLabel:"Explore bookings",suggestion:"Add your portfolio and booking link."},
 community:{label:"Build a community",description:"Make it easy for people to connect and support you.",themes:["Mint","Lavender"],next:"/dashboard/tip-jar",nextLabel:"Explore supporter tips",suggestion:"Add your community, contact and support links."},
} as const;
export type CreatorGoal=keyof typeof GOALS;
export function isCreatorGoal(value:unknown):value is CreatorGoal {
 return typeof value==="string" && Object.prototype.hasOwnProperty.call(GOALS,value);
}
export function setupProgress(input:{goal:CreatorGoal|null;profileReady:boolean;hasPage:boolean;activeLinks:number;copied:boolean}){
 const ready=input.hasPage&&input.activeLinks>0;
 const steps=[
 {id:"goal",label:"Choose your goal",done:!!input.goal},
 {id:"profile",label:"Personalise your profile",done:input.profileReady},
 {id:"link",label:"Add an active link",done:input.activeLinks>0},
 {id:"copy",label:"Copy your public page link",done:ready&&input.copied},
 ];
 return {steps,ready,completed:steps.filter(s=>s.done).length};
}

export interface LocalSetup { goal:CreatorGoal|null; copied:boolean; pendingGoal:boolean; pendingCopy:boolean }
export const emptySetup=():LocalSetup=>({goal:null,copied:false,pendingGoal:false,pendingCopy:false});
export const setupStorageKey=(userId:string)=>"stl:creator-setup:v1:"+userId;
export function parseLocalSetup(raw:string|null):LocalSetup{
 try{
  const value=JSON.parse(raw||"null");
  if(!value||typeof value!=="object")return emptySetup();
  const goal=isCreatorGoal(value.goal)?value.goal:null;
  const copied=value.copied===true;
  return {goal,copied,pendingGoal:!!goal&&value.pendingGoal===true,pendingCopy:copied&&value.pendingCopy===true};
 }catch{return emptySetup();}
}
export function mergeServerSetup(local:LocalSetup,server:{goal:CreatorGoal|null;copied:boolean}):LocalSetup{
 return {goal:local.pendingGoal?local.goal:server.goal,copied:local.pendingCopy?local.copied:server.copied,pendingGoal:local.pendingGoal,pendingCopy:local.pendingCopy};
}
