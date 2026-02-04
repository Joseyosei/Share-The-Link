/**
 * Connect Dashboard Page
 * 
 * Main dashboard for Stripe Connect sellers.
 * Includes:
 * - Onboarding status and controls
 * - Product management
 * - Link to public storefront
 */

import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { ConnectOnboarding } from "@/components/connect/ConnectOnboarding";
import { ProductManager } from "@/components/connect/ProductManager";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { toast } from "sonner";
import { ExternalLink, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

const ConnectDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { accountStatus, fetchAccountStatus } = useStripeConnect();

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
      }
    };
    checkAuth();
  }, [navigate]);

  // Handle return from onboarding
  useEffect(() => {
    const completed = searchParams.get("completed");
    const refresh = searchParams.get("refresh");

    if (completed === "true") {
      toast.success("Onboarding completed! Refreshing your status...");
      fetchAccountStatus();
    } else if (refresh === "true") {
      toast.info("Please complete your onboarding to start accepting payments.");
    }
  }, [searchParams, fetchAccountStatus]);

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <MobileSidebar />
      
      <main className="flex-1 p-6 md:ml-64">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Store className="w-6 h-6" />
                Seller Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage your storefront and products
              </p>
            </div>
            
            {accountStatus?.readyToProcessPayments && accountStatus.accountId && (
              <Button variant="outline" asChild>
                <a 
                  href={`/store/${accountStatus.accountId}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Storefront
                </a>
              </Button>
            )}
          </div>

          {/* Onboarding Card */}
          <ConnectOnboarding />

          {/* Product Management */}
          <ProductManager />
        </div>
      </main>
    </div>
  );
};

export default ConnectDashboard;
