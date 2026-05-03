import { useState, useEffect } from "react";
import { X, Crown, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { PRICING_PLANS, formatPrice, getCheckoutUrl } from "@/lib/stripe-products";

export const UpgradePopup = () => {
  const { subscription, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "business" | null>(null);

  useEffect(() => {
    if (loading) return;
    if (subscription?.subscribed) return;

    const wasDismissed = sessionStorage.getItem("upgrade-popup-dismissed");
    if (!wasDismissed) {
      setDismissed(false);
    }
  }, [subscription, loading]);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("upgrade-popup-dismissed", "true");
  };

  const handlePlanClick = (plan: "pro" | "business") => {
    if (selectedPlan === plan) {
      // Second click = go to checkout
      const url = getCheckoutUrl(plan, "monthly");
      if (url) window.open(url, "_blank", "noopener,noreferrer");
      handleDismiss();
    } else {
      setSelectedPlan(plan);
    }
  };

  if (dismissed || loading || subscription?.subscribed) return null;

  const proPlan = PRICING_PLANS.find(p => p.id === "pro");
  const businessPlan = PRICING_PLANS.find(p => p.id === "business");

  return (
    <div className="relative w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 text-white">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
        {/* Message */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Upgrade your plan</span>
          <span className="hidden sm:inline text-white/70">· 7-day free trial</span>
        </div>

        {/* Plan buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePlanClick("pro")}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedPlan === "pro"
                ? "bg-white text-violet-700 shadow-lg scale-105"
                : "bg-white/20 text-white hover:bg-white/30 border border-white/30"
            }`}
          >
            <Crown className="w-3 h-3" />
            Pro
            <span className={`${selectedPlan === "pro" ? "text-violet-500" : "text-white/70"}`}>
              {formatPrice(proPlan?.monthlyPrice || 7)}/mo
            </span>
            {selectedPlan === "pro" && (
              <span className="ml-0.5 text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-bold animate-in fade-in zoom-in-95 duration-200">
                Start trial
              </span>
            )}
          </button>

          <button
            onClick={() => handlePlanClick("business")}
            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              selectedPlan === "business"
                ? "bg-white text-violet-700 shadow-lg scale-105"
                : "bg-white/20 text-white hover:bg-white/30 border border-white/30"
            }`}
          >
            <Zap className="w-3 h-3" />
            Business
            <span className={`${selectedPlan === "business" ? "text-violet-500" : "text-white/70"}`}>
              {formatPrice(businessPlan?.monthlyPrice || 23)}/mo
            </span>
            {selectedPlan === "business" && (
              <span className="ml-0.5 text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-bold animate-in fade-in zoom-in-95 duration-200">
                Start trial
              </span>
            )}
          </button>
        </div>

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 sm:relative sm:right-auto sm:top-auto sm:translate-y-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
