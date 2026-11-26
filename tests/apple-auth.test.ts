import {describe,it,expect} from "vitest";
import {appleEnabled,appleDestination,appleCallbackUrl,appleCallbackParams} from "../src/lib/apple-auth";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
describe("Apple OAuth preparation",()=>{
 it("is opt-in and rejects untrusted redirect destinations",()=>{expect(appleEnabled(undefined)).toBe(false);expect(appleEnabled("true")).toBe(true);expect(appleDestination("//evil.example")).toBe("/dashboard");expect(appleDestination("https://evil.example")).toBe("/dashboard");expect(appleCallbackUrl("https://sharethelink.app","/pricing")).toBe("https://sharethelink.app/auth/apple/callback?next=%2Fpricing");});
 it("recognizes canceled flows",()=>{expect(appleCallbackParams("?error=access_denied&code=foo").failed).toBe(true);expect(appleCallbackParams("?code=abc").code).toBe("abc");});
 it("uses a dedicated callback with one code exchange and no Google",()=>{const c=read("src/pages/AppleAuthCallback.tsx");expect(c.match(/exchangeCodeForSession\(/g)).toHaveLength(1);expect(c).toContain("exchange??=finish()");expect(read("src/integrations/supabase/client.ts")).toContain("detectSessionInUrl: !/^\\/auth\\/apple");expect(read("src/components/AppleSignInButton.tsx")).toContain('provider:"apple"');for(const p of ["Login","Signup"]){expect(read("src/pages/"+p+".tsx")).toContain("<AppleSignInButton");expect(read("src/pages/"+p+".tsx")).not.toContain("SocialAuthButtons");}});
 it("does not use a relay email prefix for Apple profiles",()=>{const s=read("supabase/migrations/20261126200000_apple_profile_provisioning.sql");expect(s).toContain("values(new.id,candidate,null,null)");expect(s).toContain("new.raw_app_meta_data->>'provider'='apple'");});
});
