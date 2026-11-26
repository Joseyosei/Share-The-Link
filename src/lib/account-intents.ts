export type AccountIntent="links"|"profile"|"analytics"|"products"|"manage"|"help";
export function accountIntent(text:string):AccountIntent|null{
 const s=text.trim().toLowerCase().replace(/[!?.,]+$/g,"").replace(/\s+/g," ");
 if(/^(?:manage|edit|organise|organize) (?:all )?(?:my )?(?:current )?links$/.test(s))return "manage";
 if(/^(?:please )?(?:show|list|get|view|display)(?: me)? (?:all )?(?:of )?(?:my )?(?:current |active )?links(?: please)?$/.test(s)&&!s.includes("active links"))return "links";
 if(/^(?:show|view|get|display)(?: me)? (?:my )?(?:current )?(?:profile|bio)$/.test(s))return "profile";
 if(/^(?:show|view|get|display|summarise|summarize)(?: me)? (?:my )?(?:analytics|stats|statistics)$/.test(s))return "analytics";
 if(/^(?:show|list|view|get)(?: me)? (?:all )?(?:my )?(?:current )?(?:digital )?products$/.test(s))return "products";
 if(/^(?:help|what can you do|commands)$/.test(s))return "help";
 return null;
}
export function formatLinks(rows:{title:string|null;url:string;is_active:boolean|null}[],total:number){
 return rows.length?"Your links ("+total+" total"+(total>rows.length?", showing first "+rows.length:"")+"):\n"+rows.map((l,i)=>(i+1)+". "+(l.title||"Untitled")+" — "+l.url+" ["+(l.is_active?"Active":"Inactive")+"]").join("\n")+"\nManage links in Links Management.":"You have no links yet. Add one in Links Management.";
}
