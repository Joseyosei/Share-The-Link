/**
 * useStripeConnect Hook
 * 
 * Provides Stripe Connect functionality for connected accounts:
 * - Creating connected accounts
 * - Onboarding management
 * - Product management
 * - Account status tracking
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
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-connected-account",
        {
          body: { displayName, contactEmail },
        }
      );

      if (invokeError) throw new Error(invokeError.message);
      if (data.error) throw new Error(data.error);

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
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-account-link"
      );

      if (invokeError) throw new Error(invokeError.message);
      if (data.error) throw new Error(data.error);

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
   * Fetch the current account status from Stripe
   */
  const fetchAccountStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccountStatus(null);
        return;
      }

      const { data, error: invokeError } = await supabase.functions.invoke(
        "get-account-status"
      );

      if (invokeError) throw new Error(invokeError.message);
      if (data.error) throw new Error(data.error);

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
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-connect-product",
        {
          body: { name, description, priceInCents, currency },
        }
      );

      if (invokeError) throw new Error(invokeError.message);
      if (data.error) throw new Error(data.error);

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
  const fetchMyProducts = async () => {
    if (!accountStatus?.accountId) return;

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "list-connect-products",
        {
          body: { accountId: accountStatus.accountId },
        }
      );

      if (invokeError) throw new Error(invokeError.message);
      if (data.error) throw new Error(data.error);

      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Fetch account status on mount and when auth changes
  useEffect(() => {
    fetchAccountStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchAccountStatus();
    });

    return () => subscription.unsubscribe();
  }, [fetchAccountStatus]);

  return {
    // State
    accountStatus,
    products,
    loading,
    error,

    // Actions
    createConnectedAccount,
    startOnboarding,
    fetchAccountStatus,
    createProduct,
    fetchMyProducts,
  };
};
