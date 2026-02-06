/**
 * useStripeConnect Hook
 * 
 * Stripe operations go through Vercel API routes (STRIPE_SECRET_KEY only).
 * Database operations go through Supabase client directly (RLS protected).
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
 * Helper to call Vercel API routes (Stripe-only operations)
 */
async function callStripeApi(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(`/api/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
   * Create a new connected account
   * 1. Call API to create Stripe Connect account
   * 2. Store account info in Supabase directly (RLS protected)
   */
  const createConnectedAccount = async (displayName?: string, contactEmail?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const email = contactEmail || user.email;
      const name = displayName || user.user_metadata?.full_name || "Creator";

      // 1. Create Stripe account via API
      const stripeResult = await callStripeApi("create-connected-account", {
        displayName: name,
        contactEmail: email,
        userId: user.id,
      });

      // 2. Store in Supabase (RLS allows user to insert their own row)
      const { error: dbError } = await supabase.from("connected_accounts").insert({
        user_id: user.id,
        stripe_account_id: stripeResult.accountId,
        display_name: name,
        contact_email: email,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
      });

      if (dbError) {
        console.error("DB insert error:", dbError);
        throw new Error(`Failed to save account: ${dbError.message}`);
      }

      toast.success("Seller account created! Complete onboarding to start selling.");
      await fetchAccountStatus();
      return stripeResult;
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
   * Start Stripe onboarding - returns URL to redirect to
   */
  const startOnboarding = async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      if (!accountStatus?.accountId) throw new Error("No connected account found");

      const data = await callStripeApi("create-account-link", {
        accountId: accountStatus.accountId,
      });

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
   * Fetch account status from Supabase + Stripe
   */
  const fetchAccountStatus = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAccountStatus(null);
        return;
      }

      // Check DB for connected account
      const { data: account, error: dbError } = await supabase
        .from("connected_accounts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (dbError || !account) {
        setAccountStatus({ hasAccount: false });
        return;
      }

      // Fetch fresh status from Stripe via API
      try {
        const stripeStatus = await callStripeApi("get-account-status", {
          accountId: account.stripe_account_id,
        });

        // Update local DB with latest status
        await supabase
          .from("connected_accounts")
          .update({
            onboarding_complete: stripeStatus.onboardingComplete,
            charges_enabled: stripeStatus.chargesEnabled,
            payouts_enabled: stripeStatus.payoutsEnabled,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);

        setAccountStatus({
          hasAccount: true,
          accountId: account.stripe_account_id,
          displayName: account.display_name,
          contactEmail: account.contact_email,
          onboardingComplete: stripeStatus.onboardingComplete,
          requirementsStatus: stripeStatus.requirementsStatus,
          readyToProcessPayments: stripeStatus.readyToProcessPayments,
          chargesEnabled: stripeStatus.chargesEnabled,
          payoutsEnabled: stripeStatus.payoutsEnabled,
        });
      } catch {
        // If Stripe call fails, use DB values
        setAccountStatus({
          hasAccount: true,
          accountId: account.stripe_account_id,
          displayName: account.display_name,
          contactEmail: account.contact_email,
          onboardingComplete: account.onboarding_complete,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled,
        });
      }
    } catch (err) {
      console.error("Error fetching account status:", err);
      setAccountStatus({ hasAccount: false });
    }
  }, []);

  /**
   * Create a product on the connected account
   * 1. Create in Stripe via API
   * 2. Store in Supabase directly
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      if (!accountStatus?.accountId) throw new Error("No connected account found");

      // 1. Create in Stripe
      const stripeResult = await callStripeApi("create-connect-product", {
        accountId: accountStatus.accountId,
        name,
        description,
        priceInCents,
        currency,
      });

      // 2. Get connected_account row ID for the FK
      const { data: connRow } = await supabase
        .from("connected_accounts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (connRow) {
        const { error: dbError } = await supabase.from("connect_products").insert({
          connected_account_id: connRow.id,
          stripe_product_id: stripeResult.stripeProductId,
          stripe_price_id: stripeResult.stripePriceId,
          name,
          description: description || null,
          price_amount: priceInCents,
          currency,
        });

        if (dbError) {
          console.error("DB insert error:", dbError);
        }
      }

      toast.success("Product created successfully!");
      await fetchMyProducts();
      return stripeResult;
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
   * Fetch products directly from Supabase (RLS protected)
   */
  const fetchMyProducts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get connected account ID first
      const { data: connRow } = await supabase
        .from("connected_accounts")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!connRow) return;

      const { data, error: dbError } = await supabase
        .from("connect_products")
        .select("*")
        .eq("connected_account_id", connRow.id)
        .order("created_at", { ascending: false });

      if (dbError) {
        console.error("Error fetching products:", dbError);
        return;
      }

      setProducts(
        (data || []).map((p: Record<string, unknown>) => ({
          id: p.id as string,
          stripeProductId: p.stripe_product_id as string,
          stripePriceId: p.stripe_price_id as string,
          name: p.name as string,
          description: p.description as string | undefined,
          priceInCents: p.price_amount as number,
          currency: p.currency as string,
        }))
      );
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  }, []);

  // Fetch account status on mount
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
