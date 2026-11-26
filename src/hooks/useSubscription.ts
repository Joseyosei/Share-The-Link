import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PRICING_PLANS } from "@/lib/stripe-products";
import { authFetch } from "@/lib/auth-fetch";

export type SubscriptionTier = "free" | "pro" | "business" | "enterprise";

export interface SubscriptionData {
  subscribed: boolean;
  tier: SubscriptionTier;
  planName: string;
  subscriptionId?: string;
  status?: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

// Re-export pricing tiers for components that import PRICING_TIERS from here
export const PRICING_TIERS = PRICING_PLANS;

const TIER_LIMITS: Record<SubscriptionTier, { links: number; profiles: number; teamMembers: number }> = {
  free: { links: Infinity, profiles: 1, teamMembers: 1 },
  pro: { links: Infinity, profiles: 5, teamMembers: 3 },
  business: { links: Infinity, profiles: Infinity, teamMembers: Infinity },
  enterprise: { links: Infinity, profiles: Infinity, teamMembers: Infinity },
};

export function useSubscription() {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    tier: "free",
    planName: "Free",
  });
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const checkoutLock = useRef(false);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setSubscription({ subscribed: false, tier: "free", planName: "Free" });
        setLoading(false);
        return;
      }

      const resp = await authFetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!resp.ok) throw new Error("Failed to check subscription");

      const data = await resp.json();
      setSubscription({
        subscribed: data.subscribed || false,
        tier: (Object.prototype.hasOwnProperty.call(TIER_LIMITS, data.tier) ? data.tier : "free") as SubscriptionTier,
        planName: data.planName || "Free",
        subscriptionId: data.subscriptionId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      });
    } catch (error) {
      console.error("Subscription check error:", error);
      // Keep the last known state during a temporary service failure.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const startCheckout = async (planId: "pro" | "business" | "enterprise", interval: "monthly" | "yearly" = "monthly") => {
    if (checkoutLock.current) return;
    checkoutLock.current = true;
    setCheckoutLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.assign("/login?next=pricing");
        return;
      }
      const resp = await authFetch("/api/create-subscription-checkout", {
        method: "POST",
        body: JSON.stringify({ tier: planId, interval }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.url) throw new Error(data.error || "Unable to start checkout.");
      const url = new URL(data.url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.stripe.com") throw new Error("Invalid checkout URL.");
      window.location.assign(url.href);
      return url.href;
    } catch (error: any) {
      toast({ title: "Checkout unavailable", description: error.message || "Please try again.", variant: "destructive" });
    } finally {
      checkoutLock.current = false;
      setCheckoutLoading(false);
    }
  };

  const cancelSubscription = async () => {
    try {
      if (!subscription.subscriptionId) throw new Error("No active subscription");

      const resp = await authFetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      toast({ title: "Subscription cancelled", description: "Your subscription will end at the current billing period." });
      await checkSubscription();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const reactivateSubscription = async () => {
    try {
      if (!subscription.subscriptionId) throw new Error("No subscription to reactivate");

      const resp = await authFetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reactivate" }),
      });

      const data = await resp.json();
      if (data.error) throw new Error(data.error);

      toast({ title: "Subscription reactivated", description: "Your subscription has been reactivated." });
      await checkSubscription();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("Not authenticated");

      const resp = await authFetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "portal" }),
      });

      const data = await resp.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error(data.error || "No portal URL returned");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const tierLimits = TIER_LIMITS[subscription.tier];

  return {
    subscription,
    loading,
    startCheckout,
    checkoutLoading,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal,
    checkSubscription,
    tierLimits,
  };
}
