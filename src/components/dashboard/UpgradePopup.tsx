import { Link } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";

export const UpgradePopup = () => {
  const { subscription, loading } = useSubscription();
  if (loading || subscription.subscribed) return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
    <p className="text-sm font-medium">Explore premium features when you're ready.</p>
    <Button asChild variant="outline" size="sm"><Link to="/pricing">Compare plans</Link></Button>
  </div>;
};
