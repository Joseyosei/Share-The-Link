import { randomBytes,createHash,createCipheriv,createDecipheriv,timingSafeEqual } from "node:crypto";
export const randomSecret=()=>randomBytes(32).toString("base64url");
export const digest=(v:string)=>createHash("sha256").update(v).digest("hex");
export const challenge=(v:string)=>createHash("sha256").update(v).digest("base64url");
export function sameSecret(a:string,b:string){const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
function key(){const value=process.env.SOCIAL_TOKEN_KEY||"";if(!/^[a-fA-F0-9]{64}$/.test(value))throw Error("Social encryption not configured");return Buffer.from(value,"hex");}
export function seal(value:unknown,aad:string){const iv=randomBytes(12),cipher=createCipheriv("aes-256-gcm",key(),iv);cipher.setAAD(Buffer.from(aad));const body=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);return [iv,cipher.getAuthTag(),body].map(x=>x.toString("base64url")).join(".");}
export function unseal<T>(value:string,aad:string):T{const [iv,tag,body]=value.split(".").map(x=>Buffer.from(x,"base64url"));const cipher=createDecipheriv("aes-256-gcm",key(),iv);cipher.setAAD(Buffer.from(aad));cipher.setAuthTag(tag);return JSON.parse(Buffer.concat([cipher.update(body),cipher.final()]).toString("utf8"));}
