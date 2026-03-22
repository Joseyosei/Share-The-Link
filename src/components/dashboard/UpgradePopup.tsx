import { useState, useEffect } from "react";
import { X, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { getCheckoutUrl } from "@/lib/stripe-products";

export const UpgradePopup = () => {
  const { subscription, loading } = useSubscription();
  const [dismissed, setDismissed] = useState(true);

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

  const handleUpgrade = () => {
    const url = getCheckoutUrl("pro", "monthly");
    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    handleDismiss();
  };

  if (dismissed || loading || subscription?.subscribed) return null;

  return (
    <div className="relative w-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 text-white px-4 py-3 sm:py-2">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Crown className="w-4 h-4 flex-shrink-0 hidden sm:block" />
          <p className="text-sm font-medium">
            <span className="font-bold">Upgrade to Pro</span> — Custom themes, analytics, live streaming, AI builder & more.
            <span className="hidden sm:inline"> Try free for 7 days.</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            onClick={handleUpgrade}
            size="sm"
            className="bg-white text-violet-700 hover:bg-white/90 font-semibold text-xs px-4 h-8 rounded-full"
          >
            <Zap className="w-3 h-3 mr-1" />
            Start free trial
          </Button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
