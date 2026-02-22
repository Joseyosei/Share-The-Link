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
    ],
    stripeLinks: {
      monthly: "",
      yearly: "",
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
    ],
    stripeLinks: {
      monthly: "",
      yearly: "",
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
    monthlyPrice: 23,
    yearlyPrice: 184,
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
      "Team collaboration",
      "Dedicated account manager",
    ],
    stripeLinks: {
      monthly: "",
      yearly: "",
    },
    stripePriceIds: {
      monthly: "price_1SwbdIE2FuZ01nXUnGw4a2Yn",
      yearly: "",
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organisations",
    monthlyPrice: 100,
    yearlyPrice: 800,
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
      monthly: "",
      yearly: "",
    },
    stripePriceIds: {
      monthly: "price_1SwbfRE2FuZ01nXU1UJvDqrO",
      yearly: "",
    },
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return PRICING_PLANS.find((plan) => plan.id === id);
}

export function getCheckoutUrl(planId: string, interval: "monthly" | "yearly"): string {
  const plan = getPlanById(planId);
  if (!plan) return "";
  return plan.stripeLinks[interval];
}

export function formatPrice(amount: number, currency: string = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
