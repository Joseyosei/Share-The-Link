/**
 * Subscription Success Page
 *
 * Displayed after successful subscription checkout.
 * Auto-redirects to dashboard after confirming subscription.
 */

import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, Crown, Zap, Building2, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const PLAN_ICONS: Record<string, typeof Crown> = {
  pro: Zap,
  business: Building2,
  enterprise: Crown,
};

const PLAN_COLORS: Record<string, string> = {
  pro: "from-violet-500 to-purple-600",
  business: "from-amber-500 to-orange-500",
  enterprise: "from-emerald-500 to-teal-600",
};

const PLAN_FEATURES: Record<string, string[]> = {
  pro: [
    "Unlimited links",
    "50+ premium themes",
    "Custom text & button colors",
    "Analytics dashboard",
    "Priority support",
  ],
  business: [
    "Everything in Pro",
    "Custom domains",
    "Team collaboration",
    "Advanced analytics with heatmaps",
    "A/B testing for links",
    "Email/SMS capture",
  ],
  enterprise: [
    "Everything in Business",
    "Dedicated account manager",
    "Custom integrations",
    "SLA guarantee",
    "White-label branding",
    "API access",
  ],
};

const SubscriptionSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { checkSubscription, subscription } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

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

  // Auto-redirect countdown after loading completes
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      setRedirectCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate("/dashboard");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Card className="max-w-md w-full mx-4 border-0 shadow-2xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="relative mx-auto w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            </div>
            <h2 className="text-xl font-semibold mb-2">Activating your subscription...</h2>
            <p className="text-muted-foreground">This will only take a moment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tier = subscription?.tier || "pro";
  const PlanIcon = PLAN_ICONS[tier] || Zap;
  const planColor = PLAN_COLORS[tier] || PLAN_COLORS.pro;
  const features = PLAN_FEATURES[tier] || PLAN_FEATURES.pro;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="max-w-lg w-full border-0 shadow-2xl overflow-hidden">
        {/* Gradient header */}
        <div className={`bg-gradient-to-r ${planColor} p-8 text-center text-white relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-20">
            {[...Array(6)].map((_, i) => (
              <Sparkles
                key={i}
                className="absolute animate-pulse"
                style={{
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animationDelay: `${i * 0.3}s`,
                  width: 16,
                  height: 16,
                }}
              />
            ))}
          </div>
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold mb-1">Welcome to {subscription?.planName || "Pro"}!</h2>
            <Badge className="bg-white/20 text-white border-0 text-sm px-4 py-1 mt-2">
              <PlanIcon className="w-4 h-4 mr-1.5" />
              {tier.toUpperCase()} PLAN ACTIVE
            </Badge>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Features unlocked */}
          <div>
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Features unlocked
            </h3>
            <div className="space-y-2">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              asChild
              className={`w-full bg-gradient-to-r ${planColor} text-white hover:opacity-90 h-12 text-base`}
            >
              <Link to="/dashboard">
                Go to Dashboard
                <Badge className="ml-2 bg-white/20 text-white border-0 text-[10px]">
                  {tier.toUpperCase()}
                </Badge>
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/appearance">Customize Your Profile</Link>
            </Button>
          </div>

          {/* Auto-redirect notice */}
          <p className="text-center text-xs text-muted-foreground">
            Redirecting to dashboard in {redirectCountdown}s...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
