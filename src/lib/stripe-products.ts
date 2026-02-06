export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
  features: string[];
  highlighted?: boolean;
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
    features: [
      "1 profile page",
      "5 links",
      "Basic analytics",
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
    highlighted: true,
    features: [
      "Up to 5 profiles",
      "Unlimited links",
      "Advanced analytics",
      "Custom themes & colors",
      "Video embeds",
      "Priority support",
      "Remove branding",
      "Countdown timers",
    ],
    stripeLinks: {
      monthly: "https://buy.stripe.com/test_00w9AUbebcj258cefz67S02",
      yearly: "https://buy.stripe.com/test_7sYaEY4PNeracAE8Vf67S01",
    },
    stripePriceIds: {
      monthly: "price_1Sxo9pLk2fcyizRGPnTU7BWP",
      yearly: "price_1Sxo9xLk2fcyizRG4lQ8V0F3",
    },
  },
  {
    id: "business",
    name: "Business",
    description: "For teams & agencies",
    monthlyPrice: 23,
    yearlyPrice: 184,
    currency: "GBP",
    features: [
      "Unlimited profiles",
      "Unlimited links",
      "Advanced analytics + API",
      "Custom domains",
      "Custom CSS",
      "AI Page Builder",
      "Live streaming",
      "Dedicated account manager",
      "Team collaboration",
    ],
    stripeLinks: {
      monthly: "https://buy.stripe.com/test_14AbJ2gyv3Mw6cg2wR67S03",
      yearly: "https://buy.stripe.com/test_bJedRabeb96Q9osfjD67S00",
    },
    stripePriceIds: {
      monthly: "price_1Sxo9pLk2fcyizRG6DsOAh2v",
      yearly: "price_1Sxo9yLk2fcyizRGDF6y1sjS",
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
