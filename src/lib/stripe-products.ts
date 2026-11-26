import { PLAN_POLICY } from "./plan-policy.js";
// Share The Link - Live Stripe Products (account: acct_1SpA5QE2FuZ01nXU)
export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  highlighted?: boolean;
  stripeProductId: string;
  stripeLinks: {
    monthly: string;
    yearly: string;
  };
  stripePriceIds: {
    monthly: string;
    yearly: string;
  };
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: PLAN_POLICY.free.name,
    description: "Perfect for getting started",
    monthlyPrice: PLAN_POLICY.free.monthly,
    yearlyPrice: PLAN_POLICY.free.yearly,
    currency: "GBP",
    stripeProductId: "prod_TuQRMlT6Gfn7Sv",
    features: ["Basic link page and analytics", "Unlimited basic links", "Free themes", `${PLAN_POLICY.free.products} digital PDF products (preview)`, `${PLAN_POLICY.free.ai} AI creator requests / month`, `${PLAN_POLICY.free.feeBps/100}% digital-sale platform fee (preview)`],
    stripeLinks: {
      monthly: "https://buy.stripe.com/5kQ14n7DH2Ie2v2bHG3AY03",
      yearly: "https://buy.stripe.com/5kQ14n7DH2Ie2v2bHG3AY03",
    },
    stripePriceIds: {
      monthly: "",
      yearly: "",
    },
  },
  {
    id: "pro",
    name: PLAN_POLICY.pro.name,
    description: "For growing creators",
    monthlyPrice: PLAN_POLICY.pro.monthly,
    yearlyPrice: PLAN_POLICY.pro.yearly,
    currency: "GBP",
    highlighted: true,
    stripeProductId: "prod_TuQTRlytxHScfY",
    features: ["Everything in Free", `${PLAN_POLICY.pro.products} digital PDF products (preview)`, `${PLAN_POLICY.pro.ai} AI creator requests / month`, `${PLAN_POLICY.pro.feeBps/100}% digital-sale platform fee (preview)`, "Product discount codes (preview)", "Premium themes"],
    stripeLinks: {
      monthly: "https://buy.stripe.com/3cI14ncY1fv0edKaDC3AY00",
      yearly: "https://buy.stripe.com/3cI14ncY1fv0edKaDC3AY00",
    },
    stripePriceIds: {
      monthly: "price_1SwbcFE2FuZ01nXUSQxTa1zF",
      yearly: "",
    },
  },
  {
    id: "business",
    name: PLAN_POLICY.business.name,
    description: "For established creators",
    monthlyPrice: PLAN_POLICY.business.monthly,
    yearlyPrice: PLAN_POLICY.business.yearly,
    currency: "GBP",
    highlighted: false,
    stripeProductId: "prod_TuQUStzRn07sTU",
    features: ["Everything in Free", `${PLAN_POLICY.business.products} digital PDF products (preview)`, `${PLAN_POLICY.business.ai} AI creator requests / month`, `${PLAN_POLICY.business.feeBps/100}% digital-sale platform fee (preview)`, "Product discount codes (preview)", "Premium themes", "Custom domains and integrations"],
    stripeLinks: {
      monthly: "https://buy.stripe.com/00w4gz1fjgz42v29zy3AY08",
      yearly: "https://buy.stripe.com/00w4gz1fjgz42v29zy3AY08",
    },
    stripePriceIds: {
      monthly: "price_1T7lpzE2FuZ01nXU2dHWg9mn",
      yearly: "",
    },
  },
  {
    id: "enterprise",
    name: PLAN_POLICY.enterprise.name,
    description: "For large organisations",
    monthlyPrice: PLAN_POLICY.enterprise.monthly,
    yearlyPrice: PLAN_POLICY.enterprise.yearly,
    currency: "GBP",
    stripeProductId: "prod_TuQWHzMKX8eKbS",
    features: ["Everything in Free", `${PLAN_POLICY.enterprise.products} digital PDF products (preview)`, `${PLAN_POLICY.enterprise.ai} AI creator requests / month`, `${PLAN_POLICY.enterprise.feeBps/100}% digital-sale platform fee (preview)`, "Product discount codes (preview)", "Premium themes"],
    stripeLinks: {
      monthly: "https://buy.stripe.com/6oU7sLe25beK4Da7rq3AY09",
      yearly: "https://buy.stripe.com/6oU7sLe25beK4Da7rq3AY09",
    },
    stripePriceIds: {
      monthly: "price_1T7IcHE2FuZ01nXUub7JKnN3",
      yearly: "",
    },
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

export function getCheckoutUrl(planId: string, interval: "monthly" | "yearly" = "monthly"): string {
  const plan = getPlanById(planId);
  if (!plan) return "";
  // Payment Links are the same for monthly/yearly since Stripe handles the billing interval
  return plan.stripeLinks[interval] || plan.stripeLinks.monthly || "";
}

export function formatPrice(amount: number, currency: string = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
