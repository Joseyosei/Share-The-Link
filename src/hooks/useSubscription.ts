/**
 * useSubscription Hook
 * 
 * Manages user subscription state and checkout flows.
 * Provides:
 * - Current subscription status
 * - Checkout for plans
 * - Customer portal access
 * - Auto-refresh on login and periodically
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Platform pricing tiers
export const PRICING_TIERS = {
  free: {
    name: "Free",
    price: 0,
    priceId: "price_1SwbaTE2FuZ01nXUfyaL9wSS",
    productId: "prod_TuQRMlT6Gfn7Sv",
    period: "forever",
  },
  pro: {
    name: "Pro",
    price: 700, // in pence
    priceId: "price_1SwbcFE2FuZ01nXUSQxTa1zF",
    productId: "prod_TuQTRlytxHScfY",
    period: "month",
  },
  business: {
    name: "Business",
    price: 2300, // in pence
    priceId: "price_1SwbdIE2FuZ01nXUnGw4a2Yn",
    productId: "prod_TuQUStzRn07sTU",
    period: "month",
  },
  enterprise: {
    name: "Enterprise",
    price: 10000, // in pence
    priceId: "price_1SwbfRE2FuZ01nXU1UJvDqrO",
    productId: "prod_TuQWHzMKX8eKbS",
    period: "month",
  },
} as const;

export type TierKey = keyof typeof PRICING_TIERS;

interface SubscriptionStatus {
  subscribed: boolean;
  tier: TierKey;
  planName?: string;
  subscriptionId?: string;
  status?: string;
  currentPeriodEnd?: string;
  currentPeriodStart?: string;
  cancelAtPeriodEnd?: boolean;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Check current subscription status
   */
  const checkSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(null);
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);

      const response = await fetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        console.error("Subscription check error:", data.error);
        setSubscription({ subscribed: false, tier: "free" });
        return;
      }

      setSubscription(data);
    } catch (err) {
      console.error("Error checking subscription:", err);
      setSubscription({ subscribed: false, tier: "free" });
    }
  }, []);

  /**
   * Start checkout for a specific tier
   */
  const startCheckout = async (tier: TierKey) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please log in to subscribe");
        setLoading(false);
        return null;
      }

      const response = await fetch("/api/create-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, email: user.email, userId: user.id }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout failed");

      // Open checkout in new tab
      if (data.url) {
        window.open(data.url, "_blank");
        return data.url;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start checkout";
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Open the customer portal for subscription management
   */
  const openCustomerPortal = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Not authenticated");

      const response = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Portal failed");

      // Open portal in new tab
      if (data.url) {
        window.open(data.url, "_blank");
        return data.url;
      }

      return null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to open billing portal";
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check if user has access to a specific tier's features
   */
  const hasAccess = (requiredTier: TierKey): boolean => {
    if (!subscription?.subscribed) return requiredTier === "free";

    const tierOrder: TierKey[] = ["free", "pro", "business", "enterprise"];
    const userTierIndex = tierOrder.indexOf(subscription.tier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);

    return userTierIndex >= requiredTierIndex;
  };

  // Check subscription on mount and auth changes
  useEffect(() => {
    checkSubscription();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => authSub.unsubscribe();
  }, [checkSubscription]);

  // Re-check subscription after returning from checkout
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") === "success") {
      // Delay to allow Stripe to finalize the subscription
      const timer = setTimeout(() => {
        checkSubscription();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [checkSubscription]);

  // Periodic refresh every 60 seconds
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, checkSubscription]);

  return {
    subscription,
    loading,
    isAuthenticated,
    tiers: PRICING_TIERS,
    checkSubscription,
    startCheckout,
    openCustomerPortal,
    hasAccess,
  };
};
