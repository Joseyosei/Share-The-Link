import { useState, useEffect, useCallback } from "react";
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

const TIER_LIMITS: Record<SubscriptionTier, { links: number; profiles: number }> = {
  free: { links: 5, profiles: 1 },
  pro: { links: Infinity, profiles: 5 },
  business: { links: Infinity, profiles: Infinity },
  enterprise: { links: Infinity, profiles: Infinity },
};

export function useSubscription() {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    tier: "free",
    planName: "Free",
  });
  const [loading, setLoading] = useState(true);

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setSubscription({ subscribed: false, tier: "free", planName: "Free" });
        setLoading(false);
        return;
      }

      const resp = await fetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, userId: user.id }),
      });

      if (!resp.ok) throw new Error("Failed to check subscription");

      const data = await resp.json();
      setSubscription({
        subscribed: data.subscribed || false,
        tier: (data.tier as SubscriptionTier) || "free",
        planName: data.planName || "Free",
        subscriptionId: data.subscriptionId,
        status: data.status,
        currentPeriodStart: data.currentPeriodStart,
        currentPeriodEnd: data.currentPeriodEnd,
        cancelAtPeriodEnd: data.cancelAtPeriodEnd,
      });
    } catch (error) {
      console.error("Subscription check error:", error);
      setSubscription({ subscribed: false, tier: "free", planName: "Free" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const startCheckout = async (planId: "pro" | "business" | "enterprise") => {
    try {
      const plan = PRICING_PLANS.find((p) => p.id === planId);
      if (!plan) throw new Error("Plan not found");

      // Use Stripe Payment Links directly -- no API call needed
      const paymentLink = plan.stripeLinks.monthly;
      if (!paymentLink) {
        throw new Error("Payment link not configured for this plan");
      }

      // Optionally prefill the customer's email via query parameter
      const { data: { user } } = await supabase.auth.getUser();
      let url = paymentLink;
      if (user?.email) {
        const separator = url.includes("?") ? "&" : "?";
        url = `${url}${separator}prefilled_email=${encodeURIComponent(user.email)}`;
      }

      window.location.href = url;
      return url;
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout failed",
        description: error.message || "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const cancelSubscription = async () => {
    try {
      if (!subscription.subscriptionId) throw new Error("No active subscription");

      const resp = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.subscriptionId }),
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

      const resp = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionId: subscription.subscriptionId, reactivate: true }),
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

      const resp = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
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
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal,
    checkSubscription,
    tierLimits,
  };
}
