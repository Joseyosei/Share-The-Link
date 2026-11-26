import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PRICING_PLANS } from "../src/lib/stripe-products";
const read = (file: string) => readFileSync(new URL("../" + file, import.meta.url), "utf8");
describe("subscription billing contract", () => {
  it("keeps advertised monthly and annual amounts", () => {
    for (const [id, monthly, yearly] of [["pro", 7, 56], ["business", 17, 136], ["enterprise", 50, 400]] as const) {
      const plan = PRICING_PLANS.find(p => p.id === id);
      expect(plan?.monthlyPrice).toBe(monthly);
      expect(plan?.yearlyPrice).toBe(yearly);
      expect(plan?.currency).toBe("GBP");
    }
  });
  it("uses server-controlled pricing and both billing intervals", () => {
    const api = read("api/create-subscription-checkout.ts");
    expect(api).toContain("PRICING_PLANS.find");
    expect(api).toContain('interval === "yearly" ? tierConfig.yearlyPrice : tierConfig.monthlyPrice');
    expect(api).toContain('interval === "yearly" ? "year" : "month"');
    expect(api).toContain("verifyAuth(req)");
    expect(api).toContain("supabase_user_id");
    expect(api).toContain("/subscription/success?session_id=");
    expect(read("src/App.tsx")).toContain('path="/subscription/success"');
  });
  it("passes the billing interval from both pricing screens", () => {
    for (const file of ["src/pages/PricingPage.tsx", "src/components/landing/Pricing.tsx"]) {
      expect(read(file)).toContain('startCheckout(planId as "pro" | "business" | "enterprise", interval)');
    }
    expect(read("src/hooks/useSubscription.ts")).toContain("JSON.stringify({ tier: planId, interval })");
  });
  it("requires Stripe confirmation tied to the authenticated user", () => {
    const api = read("api/check-subscription.ts");
    expect(api).toContain('action === "confirm-checkout"');
    expect(api).toContain("session.metadata?.supabase_user_id !== auth.userId");
    expect(read("src/pages/SubscriptionSuccess.tsx")).toContain("res.ok && data.confirmed");
  });
  it("recognises current monthly Stripe price IDs in both server handlers", () => {
    for (const plan of PRICING_PLANS.filter(p => p.id !== "free")) {
      expect(read("api/webhooks/stripe.ts")).toContain(plan.stripePriceIds.monthly);
      expect(read("api/check-subscription.ts")).toContain(plan.stripePriceIds.monthly);
    }
  });
});
