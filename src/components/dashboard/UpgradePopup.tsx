import { useState, useEffect } from "react";
import { X, Check, Crown, Zap, BarChart3, Palette, Radio, Wand2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription, PRICING_TIERS } from "@/hooks/useSubscription";
import { PRICING_PLANS, formatPrice, getCheckoutUrl } from "@/lib/stripe-products";

const PRO_FEATURES = [
  { icon: Palette, text: "Custom themes, colors & fonts" },
  { icon: BarChart3, text: "Advanced analytics & geographic data" },
  { icon: Radio, text: "Live streaming with tips" },
  { icon: Wand2, text: "AI Page Builder" },
  { icon: Shield, text: "Remove Share The Link branding" },
  { icon: Zap, text: "Priority support" },
];

export const UpgradePopup = () => {
  const { subscription, loading } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "business">("pro");
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");

  useEffect(() => {
    // Only show for free users after 3 seconds, once per session
    if (loading) return;
    if (subscription?.subscribed) return;

    const dismissed = sessionStorage.getItem("upgrade-popup-dismissed");
    if (dismissed) return;

    const timer = setTimeout(() => setIsOpen(true), 3000);
    return () => clearTimeout(timer);
  }, [subscription, loading]);

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem("upgrade-popup-dismissed", "true");
  };

  const handleCheckout = () => {
    const url = getCheckoutUrl(selectedPlan, interval);
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    handleDismiss();
  };

  const handleFreeTrial = () => {
    // Go to Pro monthly by default for free trial
    const url = getCheckoutUrl("pro", "monthly");
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    handleDismiss();
  };

  if (!isOpen) return null;

  const proPlan = PRICING_PLANS.find(p => p.id === "pro");
  const businessPlan = PRICING_PLANS.find(p => p.id === "business");
  const currentPlan = selectedPlan === "pro" ? proPlan : businessPlan;
  const price = currentPlan
    ? interval === "monthly" ? currentPlan.monthlyPrice : currentPlan.yearlyPrice
    : 0;
  const perMonth = currentPlan
    ? interval === "yearly" ? Math.round(currentPlan.yearlyPrice / 12) : currentPlan.monthlyPrice
    : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-card rounded-2xl shadow-2xl overflow-hidden grid md:grid-cols-2 animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-foreground" />
        </button>

        {/* Left side - Benefits */}
        <div className="p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-foreground">Unlock Pro Features</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Upgrade your Share The Link experience. Try it free for 7 days and get:
          </p>

          <ul className="space-y-3 mb-8">
            {PRO_FEATURES.map((feature) => (
              <li key={feature.text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{feature.text}</span>
              </li>
            ))}
          </ul>

          {/* Plan Toggle */}
          <div className="space-y-3">
            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                selectedPlan === "pro" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => setSelectedPlan("pro")}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === "pro" ? "border-primary" : "border-muted-foreground/40"
              }`}>
                {selectedPlan === "pro" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Pro</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(proPlan?.monthlyPrice || 7)}/month
                </span>
              </div>
            </label>

            <label
              className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                selectedPlan === "business" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              }`}
              onClick={() => setSelectedPlan("business")}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                selectedPlan === "business" ? "border-primary" : "border-muted-foreground/40"
              }`}>
                {selectedPlan === "business" && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Business</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                    Best Value
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(businessPlan?.monthlyPrice || 23)}/month
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Right side - CTA & Timeline */}
        <div className="bg-muted p-8 flex flex-col justify-center">
          {/* Billing toggle */}
          <div className="flex items-center gap-2 p-1 rounded-full bg-background border mb-6 w-fit mx-auto">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                interval === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                interval === "yearly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yearly
              <span className="ml-1 text-[10px] font-bold text-emerald-500">Save 33%</span>
            </button>
          </div>

          {/* Price display */}
          <div className="text-center mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-extrabold text-foreground">
                {formatPrice(perMonth)}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            {interval === "yearly" && (
              <p className="text-sm text-muted-foreground mt-1">
                Billed {formatPrice(price)} per year
              </p>
            )}
          </div>

          {/* Timeline */}
          <div className="space-y-0 mb-6">
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Check className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="w-0.5 h-8 bg-primary/30" />
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground text-sm">Today - Free trial for 7 days</p>
                <p className="text-xs text-muted-foreground">Start your free trial. Cancel anytime.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">3d</span>
                </div>
                <div className="w-0.5 h-8 bg-muted-foreground/20" />
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground text-sm">Reminder email</p>
                <p className="text-xs text-muted-foreground">We'll remind you before your trial ends.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="pt-1">
                <p className="font-semibold text-foreground text-sm">Day 7 - Subscription starts</p>
                <p className="text-xs text-muted-foreground">Unless you've canceled during the trial.</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <Button
            onClick={handleCheckout}
            className="w-full py-6 text-base font-semibold gradient-button text-white hover:opacity-90 mb-3"
          >
            Start my {selectedPlan === "pro" ? "Pro" : "Business"} plan today
          </Button>
          <Button
            variant="outline"
            onClick={handleFreeTrial}
            className="w-full py-5 text-base font-medium"
          >
            Start free Pro trial
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-3">
            Cancel anytime. We'll remind you before trial ends.
          </p>
        </div>
      </div>
    </div>
  );
};
