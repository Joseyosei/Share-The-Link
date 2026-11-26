export const APPLE_CALLBACK_PATH="/auth/apple/callback";
export const appleEnabled=(flag:unknown)=>flag==="true";
export function appleDestination(value:unknown){return value==="/pricing"?"/pricing":"/dashboard";}
export function appleCallbackUrl(origin:string,next:unknown){const u=new URL(APPLE_CALLBACK_PATH,origin);u.searchParams.set("next",appleDestination(next));return u.href;}
export function appleCallbackParams(search:string){const p=new URLSearchParams(search);return {code:p.get("code"),failed:p.has("error")||p.has("error_code")||p.has("error_description"),next:appleDestination(p.get("next"))};}
