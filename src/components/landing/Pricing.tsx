import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { PRICING_PLANS, formatPrice, getCheckoutUrl } from "@/lib/stripe-products";

export const Pricing = () => {
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const navigate = useNavigate();

  const handlePlanClick = (planId: string) => {
    if (planId === "free") {
      navigate("/signup");
      return;
    }
    const checkoutUrl = getCheckoutUrl(planId, interval);
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section id="pricing" className="py-24 bg-muted">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-full bg-card border border-border">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                interval === "monthly"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                interval === "yearly"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs text-green-500 font-bold">Save 33%</span>
            </button>
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan) => {
            const price = interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
            const perMonth = interval === "yearly" ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "bg-foreground text-background shadow-2xl md:scale-105"
                    : "bg-card text-card-foreground shadow-lg"
                }`}
              >
                {/* Popular Badge */}
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1.5 rounded-full text-sm font-semibold gradient-button text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className={`text-sm mb-4 ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold">
                      {price === 0 ? "Free" : formatPrice(interval === "yearly" ? perMonth : price)}
                    </span>
                    {price > 0 && (
                      <span className={plan.highlighted ? "text-background/70" : "text-muted-foreground"}>
                        /month
                      </span>
                    )}
                  </div>
                  {interval === "yearly" && price > 0 && (
                    <p className={`text-xs mt-1 ${plan.highlighted ? "text-background/50" : "text-muted-foreground"}`}>
                      Billed {formatPrice(price)} per year
                    </p>
                  )}
                  {price === 0 && (
                    <p className={`text-xs mt-1 ${plan.highlighted ? "text-background/50" : "text-muted-foreground"}`}>
                      Free forever
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        plan.highlighted ? "bg-background/20" : "bg-primary/10"
                      }`}>
                        <Check className={`w-3 h-3 ${plan.highlighted ? "text-background" : "text-primary"}`} />
                      </div>
                      <span className={`text-sm ${plan.highlighted ? "text-background/90" : ""}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handlePlanClick(plan.id)}
                  className={`w-full py-6 font-semibold text-base ${
                    plan.highlighted
                      ? "bg-background text-foreground hover:bg-background/90"
                      : plan.id === "free"
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "gradient-button text-white hover:opacity-90"
                  }`}
                >
                  {plan.id === "free" ? "Get Started Free" : `Subscribe to ${plan.name}`}
                </Button>

                {plan.id !== "free" && (
                  <p className={`text-center text-xs mt-3 ${plan.highlighted ? "text-background/40" : "text-muted-foreground/60"}`}>
                    Secure checkout powered by Stripe
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
