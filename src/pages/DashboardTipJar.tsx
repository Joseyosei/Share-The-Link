import { useState, useEffect } from "react";
import { Heart, DollarSign, Settings, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TipRecord {
  id: string;
  amount_cents: number;
  currency: string;
  tipper_name: string | null;
  message: string | null;
  created_at: string;
}

const DashboardTipJar = () => {
  const { toast } = useToast();
  const [isEnabled, setIsEnabled] = useState(false);
  const [customMessage, setCustomMessage] = useState("Support my work!");
  const [suggestedAmounts, setSuggestedAmounts] = useState("3,5,10,25");
  const [currency, setCurrency] = useState("GBP");
  const [tips, setTips] = useState<TipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: settings } = await supabase
        .from("tip_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (settings) {
        setIsEnabled(settings.is_enabled || false);
        setCustomMessage(settings.custom_message || "Support my work!");
        setSuggestedAmounts((settings.suggested_amounts || [3, 5, 10, 25]).join(","));
        setCurrency(settings.currency || "GBP");
      }

      const { data: tipsData } = await supabase
        .from("tips")
        .select("*")
        .eq("creator_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setTips((tipsData || []) as TipRecord[]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const amounts = suggestedAmounts
        .split(",")
        .map((a) => parseInt(a.trim()))
        .filter((a) => !isNaN(a) && a > 0);

      const { error } = await supabase.from("tip_settings").upsert({
        user_id: user.id,
        is_enabled: isEnabled,
        custom_message: customMessage,
        suggested_amounts: amounts,
        currency,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      if (error) throw error;
      toast({ title: "Saved!", description: "Tip jar settings updated." });
    } catch {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const currencySymbol = currency === "GBP" ? "\u00a3" : currency === "EUR" ? "\u20ac" : "$";
  const totalEarned = tips.reduce((sum, t) => sum + t.amount_cents, 0) / 100;

  return (
    <div className="min-h-screen bg-muted overflow-x-hidden">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <Heart className="w-7 h-7 text-pink-500" />
                Tip Jar
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Let your audience support your work directly from your profile.
              </p>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Settings */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Enable Tip Jar</p>
                      <p className="text-xs text-muted-foreground">Show tip jar on your public profile</p>
                    </div>
                    <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Custom Message</label>
                    <input
                      type="text"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Support my work!"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Suggested Amounts (comma-separated)</label>
                    <input
                      type="text"
                      value={suggestedAmounts}
                      onChange={(e) => setSuggestedAmounts(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="3,5,10,25"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="GBP">GBP (£)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tips & Stats */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <DollarSign className="w-5 h-5 text-green-500 mb-2" />
                    <p className="text-2xl font-bold">{currencySymbol}{totalEarned.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Total earned</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <TrendingUp className="w-5 h-5 text-primary mb-2" />
                    <p className="text-2xl font-bold">{tips.length}</p>
                    <p className="text-xs text-muted-foreground">Total tips</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  {tips.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No tips received yet. Enable the tip jar and share your profile!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {tips.slice(0, 10).map((tip) => (
                        <div key={tip.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
                          <div>
                            <p className="text-sm font-medium">{tip.tipper_name || "Anonymous"}</p>
                            {tip.message && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{tip.message}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600">
                              {currencySymbol}{(tip.amount_cents / 100).toFixed(2)}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(tip.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardTipJar;
