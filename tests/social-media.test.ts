import {describe,it,expect} from "vitest";
import {parseSocialMedia,collectSocialMedia} from "../src/lib/social-media";
import {readWebsiteResponse} from "../src/lib/website-response";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
describe("social media and runtime recovery",()=>{
 it("generates canonical embeds for supported URLs",()=>{
 expect(parseSocialMedia("https://youtu.be/dQw4w9WgXcQ")?.embed).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
 expect(parseSocialMedia("https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv")?.embed).toContain("list=UUabcdefghijklmnopqrstuv");
 expect(parseSocialMedia("https://www.instagram.com/reel/ABC123xyz/?igsh=abc")?.embed).toBe("https://www.instagram.com/reel/ABC123xyz/embed/");
 expect(parseSocialMedia("https://www.tiktok.com/@creator/video/1234567890123456789")?.embed).toBe("https://www.tiktok.com/player/v1/1234567890123456789");
 });
 it("rejects attacker hosts, credentials and unsafe protocols",()=>{
 for(const url of ["https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ","https://evil.example@youtube.com/watch?v=dQw4w9WgXcQ","javascript:alert(1)","https://instagram.com/creator","https://vm.tiktok.com/abc","https://www.youtube.com:8443/watch?v=dQw4w9WgXcQ"])expect(parseSocialMedia(url)).toBeNull();
 });
 it("deduplicates and excludes inactive and future scheduled content",()=>{
 const url="https://youtu.be/dQw4w9WgXcQ";
 expect(collectSocialMedia([{url},{url:"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},{url:"https://www.instagram.com/p/ABC123xyz/",is_active:false},{url:"https://www.instagram.com/p/XYZ123abc/",schedule_start:"2030-01-01"}],Date.parse("2026-11-26"))).toHaveLength(1);
 });
 it("handles non-JSON server errors without exposing parse failures",async()=>{
 await expect(readWebsiteResponse(new Response("A server error",{status:500}))).rejects.toThrow("temporarily unavailable");
 await expect(readWebsiteResponse(new Response(JSON.stringify({error:"Migration needed"}),{status:503}))).rejects.toThrow("Migration needed");
 expect(await readWebsiteResponse(new Response(JSON.stringify({revision:1})))).toEqual({revision:1});
 });
 it("preserves Node ESM import suffix and restricts embeds to expected hosts",()=>{
 expect(read("src/lib/stripe-products.ts")).toContain('from "./plan-policy.js"');
 const c=read("vercel.json");expect(c).toContain("https://www.instagram.com https://www.tiktok.com");
 expect(read("src/pages/Profile.tsx")).toContain("SocialMediaGallery links={visibleLinks}");
 expect(read("src/components/website/WebsiteRenderer.tsx")).toContain("SocialMediaGallery links={source.links}");
 });
});
