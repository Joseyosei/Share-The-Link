import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const read = (name: string) => readFileSync(new URL(name, import.meta.url), "utf8");
const routes = (source: string) => [...source.matchAll(/href: "([^"]+)"/g)].map(match => match[1]).sort();
describe("dashboard navigation regression guards", () => {
  const desktop = routes(read("../src/components/dashboard/Sidebar.tsx"));
  const mobile = routes(read("../src/components/dashboard/MobileSidebar.tsx"));
  it("preserves all existing destinations on both layouts", () => {
    expect(desktop).toEqual(["/dashboard","/dashboard/links","/dashboard/appearance","/analytics","/dashboard/forms","/connect","/dashboard/bookings","/dashboard/tip-jar","/streaming","/discover","/dashboard/media","/dashboard/qr-code","/dashboard/stl-bot","/ai-builder","/dashboard/auto-reply","/dashboard/subscribers","/dashboard/reviews","/dashboard/ab-testing","/dashboard/integrations","/dashboard/webhooks","/dashboard/domains","/dashboard/team","/dashboard/support","/dashboard/settings","/help"].sort());
    expect(mobile).toEqual(desktop);
    expect(new Set(desktop).size).toBe(desktop.length);
  });
  it("does not present invented growth or unverified trials on overview", () => {
    const dashboard = read("../src/pages/Dashboard.tsx");
    expect(dashboard).not.toContain('change="12%"');
    expect(dashboard).not.toContain("<UpgradePopup");
    expect(dashboard).toContain("stats.totalClicks");
  });
});
