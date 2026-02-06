/**
 * useStripeConnect Hook
 * 
 * Provides Stripe Connect functionality via Vercel Serverless Functions.
 * Replaces Supabase Edge Function calls with direct API calls to /api/* routes.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AccountStatus {
  hasAccount: boolean;
  accountId?: string;
  displayName?: string;
  contactEmail?: string;
  onboardingComplete?: boolean;
  readyToProcessPayments?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  requirementsStatus?: string;
}

interface ConnectProduct {
  id: string;
  stripeProductId: string;
  stripePriceId: string;
  name: string;
  description?: string;
  priceInCents: number;
  currency: string;
}

/**
 * Helper to call Vercel API routes with auth token
 */
async function callApi(endpoint: string, body?: Record<string, unknown>) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    throw new Error("Not authenticated");
  }

  const response = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data;
}

export const useStripeConnect = () => {
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [products, setProducts] = useState<ConnectProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new connected account for the current user
   */
  const createConnectedAccount = async (displayName?: string, contactEmail?: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await callApi("create-connected-account", { displayName, contactEmail });

      toast.success("Connected account created successfully!");
      await fetchAccountStatus();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create account";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start the onboarding process - returns URL to redirect to
   */
  const startOnboarding = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await callApi("create-account-link");
      return data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create onboarding link";
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch the current account status
   */
  const fetchAccountStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccountStatus(null);
        return;
      }

      const data = await callApi("get-account-status");
      setAccountStatus(data);
    } catch (err) {
      console.error("Error fetching account status:", err);
      setAccountStatus({ hasAccount: false });
    }
  }, []);

  /**
   * Create a product on the connected account
   */
  const createProduct = async (
    name: string,
    description: string,
    priceInCents: number,
    currency = "gbp"
  ) => {
    setLoading(true);
    setError(null);

    try {
      const data = await callApi("create-connect-product", {
        name,
        description,
        priceInCents,
        currency,
      });

      toast.success("Product created successfully!");
      return data.product;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create product";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch products for the current user's connected account
   */
  const fetchMyProducts = useCallback(async () => {
    try {
      const data = await callApi("list-connect-products");
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }, []);

  // Fetch account status on mount and when auth changes
  useEffect(() => {
    fetchAccountStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchAccountStatus();
    });

    return () => subscription.unsubscribe();
  }, [fetchAccountStatus]);

  return {
    accountStatus,
    products,
    loading,
    error,
    createConnectedAccount,
    startOnboarding,
    fetchAccountStatus,
    createProduct,
    fetchMyProducts,
  };
};
