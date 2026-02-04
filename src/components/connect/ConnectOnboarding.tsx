/**
 * Connect Onboarding Component
 * 
 * Displays the onboarding status and provides controls for:
 * - Creating a connected account
 * - Starting/resuming onboarding
 * - Viewing account status
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useStripeConnect } from "@/hooks/useStripeConnect";
import { 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Loader2,
  CreditCard,
  Store,
  RefreshCw
} from "lucide-react";

export const ConnectOnboarding = () => {
  const { 
    accountStatus, 
    loading, 
    createConnectedAccount, 
    startOnboarding,
    fetchAccountStatus 
  } = useStripeConnect();

  const [displayName, setDisplayName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  // Handle creating a new connected account
  const handleCreateAccount = async () => {
    await createConnectedAccount(displayName || undefined, contactEmail || undefined);
  };

  // Handle starting onboarding
  const handleStartOnboarding = async () => {
    const url = await startOnboarding();
    if (url) {
      window.open(url, "_blank");
    }
  };

  // If no account exists yet
  if (!accountStatus?.hasAccount) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5" />
            Become a Seller
          </CardTitle>
          <CardDescription>
            Create a connected account to start selling products and receiving payments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Business Name</Label>
            <Input
              id="displayName"
              placeholder="Your store name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              placeholder="your@email.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleCreateAccount} 
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Create Seller Account
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Onboarding status badges
  const getStatusBadge = () => {
    if (accountStatus.readyToProcessPayments) {
      return (
        <Badge className="bg-green-500/10 text-green-600 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    if (accountStatus.onboardingComplete) {
      return (
        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Pending Verification
        </Badge>
      );
    }
    return (
      <Badge className="bg-orange-500/10 text-orange-600 border-orange-200">
        <AlertCircle className="w-3 h-3 mr-1" />
        Onboarding Required
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Seller Account
            </CardTitle>
            <CardDescription>
              {accountStatus.displayName || "Your connected account"}
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              accountStatus.chargesEnabled ? "bg-green-500" : "bg-gray-300"
            }`} />
            <span className="text-muted-foreground">
              {accountStatus.chargesEnabled ? "Can accept payments" : "Payments disabled"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              accountStatus.payoutsEnabled ? "bg-green-500" : "bg-gray-300"
            }`} />
            <span className="text-muted-foreground">
              {accountStatus.payoutsEnabled ? "Payouts enabled" : "Payouts disabled"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!accountStatus.onboardingComplete && (
            <Button 
              onClick={handleStartOnboarding} 
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4 mr-2" />
              )}
              {accountStatus.requirementsStatus === "currently_due" 
                ? "Complete Onboarding" 
                : "Start Onboarding"}
            </Button>
          )}
          
          {accountStatus.onboardingComplete && !accountStatus.readyToProcessPayments && (
            <Button 
              onClick={handleStartOnboarding} 
              variant="outline"
              disabled={loading}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Update Information
            </Button>
          )}

          <Button 
            variant="ghost" 
            size="icon"
            onClick={fetchAccountStatus}
            disabled={loading}
            title="Refresh status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Help Text */}
        {!accountStatus.readyToProcessPayments && (
          <p className="text-sm text-muted-foreground">
            Complete the onboarding process to start accepting payments. 
            You'll need to provide business information and verify your identity.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
