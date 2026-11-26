import {describe,it,expect,vi,afterEach} from "vitest";
import {makeFeedItem,publicItems,safeThumbnail,mergeMedia} from "../src/lib/social-content";
import {seal,unseal,digest,challenge} from "../api/_lib/social-crypto";
import {authorizeUrl,fetchFeed,refresh} from "../api/_lib/social-providers";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe("social content",()=>{
 it("encrypts tokens and binds ciphertext to account and provider",()=>{vi.stubEnv("SOCIAL_TOKEN_KEY","a".repeat(64));const x=seal({access:"secret"},"user:youtube");expect(x).not.toContain("secret");expect(unseal(x,"user:youtube")).toEqual({access:"secret"});expect(()=>unseal(x,"other:youtube")).toThrow();expect(seal({access:"secret"},"user:youtube")).not.toBe(x);expect(digest("a")).toHaveLength(64);});
 it("uses configured fixed redirect and Google PKCE",()=>{vi.stubEnv("SOCIAL_YOUTUBE_CLIENT_ID","client");vi.stubEnv("SOCIAL_YOUTUBE_CLIENT_SECRET","secret");vi.stubEnv("SOCIAL_APP_URL","https://example.com");const u=new URL(authorizeUrl("youtube","state","verifier"));expect(u.hostname).toBe("accounts.google.com");expect(u.searchParams.get("code_challenge")).toBe(challenge("verifier"));expect(u.searchParams.get("redirect_uri")).toBe("https://example.com/dashboard/social/callback/youtube");expect(u.searchParams.get("access_type")).toBe("offline");expect(u.href).not.toContain("secret");});
 it("sanitises thumbnail hosts and drops expired thumbnails",()=>{expect(safeThumbnail("https://ytimg.com.evil.example/a","youtube")).toBeNull();expect(safeThumbnail("http://i.ytimg.com/a","youtube")).toBeNull();const v=makeFeedItem("youtube","https://youtu.be/dQw4w9WgXcQ","Title","https://i.ytimg.com/a","2026-11-25",100)!;expect(publicItems([v],[v.key],"youtube",101)[0].pinned).toBe(true);expect(publicItems([v],[],"youtube",v.thumbnailUntil+1)[0].thumbnail).toBeNull();expect(mergeMedia([v],[{...v,pinned:true}])).toHaveLength(1);});
 it("rejects wrong provider and unsafe URLs",()=>{expect(makeFeedItem("instagram","https://youtu.be/dQw4w9WgXcQ","","","")).toBeNull();expect(makeFeedItem("youtube","javascript:alert(1)","","","")).toBeNull();});
 it("guards state, premium, public consent and private videos",()=>{const api=read("api/_lib/social-engine.ts");expect(api).toContain('.eq("state_hash",digest(body.state))');expect(api).toContain('.eq("user_id",userId)');expect(api).toContain('.eq("published",true)');expect(api).toContain("await paid(userId");expect(api).toContain("sameSecret");expect(read("api/_lib/social-providers.ts")).toContain('privacyStatus==="public"');expect(read("supabase/migrations/20261126170000_social_content.sql")).toContain("revoke all on public.social_connections");});
});

describe("provider API fixtures",()=>{
 it("imports only owned public embeddable YouTube videos",async()=>{
 const responses=[
 {items:[{id:"UCabcdefghijklmnopqrstuv",snippet:{title:"Creator"},contentDetails:{relatedPlaylists:{uploads:"UUabcdefghijklmnopqrstuv"}}}]},
 {items:["dQw4w9WgXcQ","abcdefghijk","ABCDEFGHIJK"].map(videoId=>({contentDetails:{videoId}}))},
 {items:[{id:"dQw4w9WgXcQ",snippet:{channelId:"UCabcdefghijklmnopqrstuv",title:"Public"},status:{privacyStatus:"public",embeddable:true}},{id:"abcdefghijk",snippet:{channelId:"UCabcdefghijklmnopqrstuv",title:"Private"},status:{privacyStatus:"private",embeddable:true}},{id:"ABCDEFGHIJK",snippet:{channelId:"other",title:"Foreign"},status:{privacyStatus:"public",embeddable:true}}]}
 ];const fetcher=vi.fn(async()=>new Response(JSON.stringify(responses.shift()),{status:200}));vi.stubGlobal("fetch",fetcher);
 const v=await fetchFeed("youtube",{access:"fixture",expires:Date.now()+3600000});expect(v.media.map(x=>x.title)).toEqual(["Public"]);expect(fetcher).toHaveBeenCalledTimes(3);
 });
 it("uses official TikTok list API and retains rotated refresh tokens",async()=>{
 vi.stubEnv("SOCIAL_TIKTOK_CLIENT_ID","client");vi.stubEnv("SOCIAL_TIKTOK_CLIENT_SECRET","secret");
 const fetcher=vi.fn(async(_url:string,_init?:RequestInit)=>new Response(JSON.stringify({access_token:"new",refresh_token:"rotated",expires_in:3600}),{status:200}));vi.stubGlobal("fetch",fetcher);
 expect((await refresh("tiktok",{access:"old",refresh:"original",expires:0})).refresh).toBe("rotated");expect(fetcher.mock.calls[0][0]).toBe("https://open.tiktokapis.com/v2/oauth/token/");
 const responses=[{data:{user:{open_id:"id",display_name:"Creator"}},error:{code:"ok"}},{data:{videos:[{share_url:"https://www.tiktok.com/@creator/video/1234567890123456789",title:"Public",create_time:1795680000}]},error:{code:"ok"}}];
 vi.stubGlobal("fetch",vi.fn(async()=>new Response(JSON.stringify(responses.shift()),{status:200})));expect((await fetchFeed("tiktok",{access:"fixture",expires:Date.now()+3600000})).media).toHaveLength(1);
 });
 it("imports supported Instagram media from the official graph endpoint",async()=>{
 const responses=[{user_id:"123",username:"creator"},{data:[{id:"1",permalink:"https://www.instagram.com/reel/ABC123xyz/",caption:"Reel",media_type:"VIDEO",thumbnail_url:"https://scontent.cdninstagram.com/a",timestamp:"2026-11-25T00:00:00Z"}]}];
 vi.stubGlobal("fetch",vi.fn(async()=>new Response(JSON.stringify(responses.shift()),{status:200})));const v=await fetchFeed("instagram",{access:"fixture",expires:Date.now()+3600000});expect(v.media[0].title).toBe("Reel");expect(v.media[0].thumbnail).toBe("https://scontent.cdninstagram.com/a");
 });
 it("keeps Supabase OAuth callback detection separate and database sync cooldown",()=>{expect(read("src/integrations/supabase/client.ts")).toContain("detectSessionInUrl: !");expect(read("api/_lib/social-engine.ts")).toContain("last_attempt.lt.");});
});