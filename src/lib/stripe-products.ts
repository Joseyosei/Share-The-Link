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
    name: "Free",
    description: "Perfect for getting started",
    monthlyPrice: 0,
    yearlyPrice: 0,
    currency: "GBP",
    stripeProductId: "prod_TuQRMlT6Gfn7Sv",
    features: [
      "1 profile page",
      "Up to 5 links",
      "Basic analytics",
      "12 free templates",
      "Auto-share to 3 platforms",
      "Share The Link branding",
      "Community support",
      "1 team member",
    ],
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
    name: "Pro",
    description: "For growing creators",
    monthlyPrice: 7,
    yearlyPrice: 56,
    currency: "GBP",
    highlighted: false,
    stripeProductId: "prod_TuQTRlytxHScfY",
    features: [
      "Up to 5 profiles",
      "Unlimited links",
      "Advanced analytics",
      "24 premium templates",
      "Custom themes & colors",
      "Auto-share to 11 platforms",
      "Media uploads & recordings",
      "Remove branding",
      "Priority support",
      "SEO & UTM controls",
      "Bento grid & link animations",
      "Verified badge",
      "Featured carousel",
      "Section dividers",
      "Up to 3 team members",
      "Tip jar / Donations",
    ],
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
    name: "Business",
    description: "For teams & agencies",
    monthlyPrice: 17,
    yearlyPrice: 136,
    currency: "GBP",
    highlighted: true,
    stripeProductId: "prod_TuQUStzRn07sTU",
    features: [
      "Everything in Pro",
      "Unlimited profiles",
      "Advanced analytics + API",
      "Custom domains",
      "AI Page Builder",
      "Live streaming + tips (90/10)",
      "My Shop / E-commerce",
      "All integrations included",
      "Unlimited team members",
      "Dedicated account manager",
      "0% transaction fees",
      "Custom CSS",
    ],
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
    name: "Enterprise",
    description: "For large organisations",
    monthlyPrice: 50,
    yearlyPrice: 400,
    currency: "GBP",
    stripeProductId: "prod_TuQWHzMKX8eKbS",
    features: [
      "Everything in Business",
      "Unlimited team members",
      "White-label solution",
      "Custom integrations & API",
      "SLA & uptime guarantee",
      "SSO / SAML authentication",
      "Dedicated infrastructure",
      "Content moderation tools",
      "Priority onboarding",
    ],
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
