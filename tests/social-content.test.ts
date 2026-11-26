import {describe,it,expect,vi,afterEach} from "vitest";
import {makeFeedItem,publicItems,safeThumbnail,mergeMedia} from "../src/lib/social-content";
import {seal,unseal,digest,challenge} from "../api/_lib/social-crypto";
import {authorizeUrl} from "../api/_lib/social-providers";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
afterEach(()=>vi.unstubAllEnvs());
describe("social content",()=>{
 it("encrypts tokens and binds ciphertext to account and provider",()=>{vi.stubEnv("SOCIAL_TOKEN_KEY","a".repeat(64));const x=seal({access:"secret"},"user:youtube");expect(x).not.toContain("secret");expect(unseal(x,"user:youtube")).toEqual({access:"secret"});expect(()=>unseal(x,"other:youtube")).toThrow();expect(seal({access:"secret"},"user:youtube")).not.toBe(x);expect(digest("a")).toHaveLength(64);});
 it("uses configured fixed redirect and Google PKCE",()=>{vi.stubEnv("SOCIAL_YOUTUBE_CLIENT_ID","client");vi.stubEnv("SOCIAL_YOUTUBE_CLIENT_SECRET","secret");vi.stubEnv("SOCIAL_APP_URL","https://example.com");const u=new URL(authorizeUrl("youtube","state","verifier"));expect(u.hostname).toBe("accounts.google.com");expect(u.searchParams.get("code_challenge")).toBe(challenge("verifier"));expect(u.searchParams.get("redirect_uri")).toBe("https://example.com/dashboard/social/callback/youtube");expect(u.searchParams.get("access_type")).toBe("offline");expect(u.href).not.toContain("secret");});
 it("sanitises thumbnail hosts and drops expired thumbnails",()=>{expect(safeThumbnail("https://ytimg.com.evil.example/a","youtube")).toBeNull();expect(safeThumbnail("http://i.ytimg.com/a","youtube")).toBeNull();const v=makeFeedItem("youtube","https://youtu.be/dQw4w9WgXcQ","Title","https://i.ytimg.com/a","2026-11-25",100)!;expect(publicItems([v],[v.key],"youtube",101)[0].pinned).toBe(true);expect(publicItems([v],[],"youtube",v.thumbnailUntil+1)[0].thumbnail).toBeNull();expect(mergeMedia([v],[{...v,pinned:true}])).toHaveLength(1);});
 it("rejects wrong provider and unsafe URLs",()=>{expect(makeFeedItem("instagram","https://youtu.be/dQw4w9WgXcQ","","","")).toBeNull();expect(makeFeedItem("youtube","javascript:alert(1)","","","")).toBeNull();});
 it("guards state, premium, public consent and private videos",()=>{const api=read("api/_lib/social-engine.ts");expect(api).toContain('.eq("state_hash",digest(body.state))');expect(api).toContain('.eq("user_id",userId)');expect(api).toContain('.eq("published",true)');expect(api).toContain("await paid(userId");expect(api).toContain("sameSecret");expect(read("api/_lib/social-providers.ts")).toContain('privacyStatus==="public"');expect(read("supabase/migrations/20261126170000_social_content.sql")).toContain("revoke all on public.social_connections");});
});
