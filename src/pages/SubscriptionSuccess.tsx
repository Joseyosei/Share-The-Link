import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";
import { authFetch } from "@/lib/auth-fetch";
import { PRICING_PLANS } from "@/lib/stripe-products";

export default function SubscriptionSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const [tier, setTier] = useState<string | null>(null);
  const [pending, setPending] = useState(Boolean(sessionId));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    setPending(true);
    setTier(null);
    const check = async (count: number) => {
      try {
        const res = await authFetch("/api/check-subscription", {
          method: "POST",
          body: JSON.stringify({ action: "confirm-checkout", sessionId }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (cancelled) return;
        if (res.ok && data.confirmed && PRICING_PLANS.some(p => p.id === data.tier && p.id !== "free")) {
          setTier(data.tier);
          setPending(false);
          return;
        }
        if ([400, 401, 403, 409].includes(res.status)) { setPending(false); return; }
      } catch { if (cancelled) return; }
      if (count < 5) timer = setTimeout(() => check(count + 1), 3000);
      else setPending(false);
    };
    void check(0);
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, [sessionId, attempt]);
  const plan = PRICING_PLANS.find(p => p.id === tier);
  return (
    <main className="min-h-screen flex items-center justify-center bg-muted p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-5" aria-live="polite">
          {pending ? <Loader2 className="w-10 h-10 mx-auto animate-spin text-primary" /> : plan ? <CheckCircle className="w-10 h-10 mx-auto text-green-600" /> : null}
          <h1 className="text-2xl font-bold">{pending ? "Confirming your subscription" : plan ? `Welcome to ${plan.name}!` : "Subscription not yet confirmed"}</h1>
          <p className="text-muted-foreground">{pending ? "We're checking your payment with Stripe." : plan ? "Stripe has confirmed your subscription. You can manage your plan in account settings." : "We couldn't confirm this checkout. If you paid, please do not pay again. Sign in to the account used at checkout and check your billing status."}</p>
          {!pending && !plan && sessionId && <Button variant="outline" onClick={() => setAttempt(n => n + 1)}>Check again</Button>}
          <Button asChild className="w-full"><Link to="/dashboard">Go to dashboard</Link></Button>
          <Button asChild variant="outline" className="w-full"><Link to="/dashboard/settings">Account settings</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
