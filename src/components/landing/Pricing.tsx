import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useSubscription, TierKey } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

const plans = [
  {
    name: "Free",
    tier: "free" as TierKey,
    price: "£0",
    period: "forever",
    description: "Perfect for getting started",
    features: [
      "Unlimited links",
      "Basic analytics",
      "Mobile optimized",
      "Share The Link branding",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    tier: "pro" as TierKey,
    price: "£7",
    period: "/month",
    description: "For growing creators",
    features: [
      "Everything in Free",
      "Remove branding",
      "Custom themes",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Business",
    tier: "business" as TierKey,
    price: "£23",
    period: "/month",
    description: "For teams and agencies",
    features: [
      "Everything in Pro",
      "Product sales (0% fees)",
      "Custom domain",
      "Team collaboration",
      "API access",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export const Pricing = () => {
  const { startCheckout, loading, subscription, isAuthenticated } = useSubscription();
  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkAuth();
  }, []);

  const handlePlanClick = async (tier: TierKey) => {
    // Free tier - just redirect to signup
    if (tier === "free") {
      navigate("/signup");
      return;
    }

    // Check if user is logged in
    if (!isLoggedIn) {
      navigate("/signup");
      return;
    }

    // Start checkout for paid tiers
    setLoadingTier(tier);
    await startCheckout(tier);
    setLoadingTier(null);
  };

  const isCurrentPlan = (tier: TierKey) => {
    return subscription?.tier === tier && subscription.subscribed;
  };

  return (
    <section id="pricing" className="py-24 bg-muted">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.popular
                  ? "bg-foreground text-background shadow-2xl scale-105"
                  : "bg-card text-card-foreground shadow-lg"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-sm font-semibold gradient-button text-primary-foreground">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan(plan.tier) && (
                <div className="absolute -top-4 right-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                    YOUR PLAN
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <p className={`text-sm mb-4 ${plan.popular ? "text-background/70" : "text-muted-foreground"}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className={plan.popular ? "text-background/70" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-background/20" : "bg-primary/10"
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? "text-background" : "text-primary"}`} />
                    </div>
                    <span className={`text-sm ${plan.popular ? "text-background/90" : ""}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePlanClick(plan.tier)}
                disabled={loadingTier === plan.tier || loading || isCurrentPlan(plan.tier)}
                className={`w-full py-6 font-semibold ${
                  plan.popular
                    ? "bg-background text-foreground hover:bg-background/90"
                    : "gradient-button text-primary-foreground hover:opacity-90"
                }`}
              >
                {loadingTier === plan.tier ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isCurrentPlan(plan.tier) ? (
                  "Current Plan"
                ) : (
                  plan.cta
                )}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
