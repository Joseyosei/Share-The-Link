/**
 * Subscription Success Page
 * 
 * Displayed after successful subscription checkout.
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const { checkSubscription, subscription } = useSubscription();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Refresh subscription status after successful checkout
    const refreshStatus = async () => {
      await checkSubscription();
      setLoading(false);
    };
    
    // Give Stripe webhook a moment to process
    const timer = setTimeout(refreshStatus, 2000);
    return () => clearTimeout(timer);
  }, [checkSubscription]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processing your subscription...</h2>
            <p className="text-muted-foreground">This will only take a moment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="pt-8 text-center">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Welcome to {subscription?.planName || "Pro"}!</h2>
          <p className="text-muted-foreground mb-6">
            Your subscription is now active. You have access to all {subscription?.planName || "Pro"} features.
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/connect">Set Up Your Store</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
