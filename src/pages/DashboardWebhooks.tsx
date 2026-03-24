import { useState, useEffect } from "react";
import { Webhook, Plus, Trash2, ToggleRight, Activity, Copy, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const AVAILABLE_EVENTS = [
  { key: "link_click", label: "Link Click", description: "When someone clicks a link" },
  { key: "profile_view", label: "Profile View", description: "When someone views your profile" },
  { key: "new_subscriber", label: "New Subscriber", description: "When someone subscribes to your email list" },
  { key: "new_tip", label: "New Tip", description: "When you receive a tip" },
  { key: "new_booking", label: "New Booking", description: "When someone books a service" },
];

interface WebhookRecord {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret: string | null;
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
  created_at: string;
}

const DashboardWebhooks = () => {
  const { toast } = useToast();
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", url: "", events: [] as string[] });
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWebhooks((data || []) as WebhookRecord[]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast({ title: "Missing fields", description: "Name, URL, and at least one event are required", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const secret = `whsec_${Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;

      const { data, error } = await supabase
        .from("webhooks")
        .insert({
          user_id: user.id,
          name: formData.name,
          url: formData.url,
          events: formData.events,
          secret,
        })
        .select()
        .single();

      if (error) throw error;
      setWebhooks((prev) => [data as WebhookRecord, ...prev]);
      setFormData({ name: "", url: "", events: [] });
      setShowForm(false);
      toast({ title: "Webhook created!", description: "Your webhook endpoint has been registered." });
    } catch {
      toast({ title: "Error", description: "Failed to create webhook", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const { error } = await supabase.from("webhooks").update({ is_active: !isActive }).eq("id", id);
    if (!error) {
      setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, is_active: !isActive } : w)));
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("webhooks").delete().eq("id", id);
    if (!error) {
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
      toast({ title: "Webhook deleted" });
    }
  };

  const toggleEventSelection = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  return (
    <div className="min-h-screen bg-muted overflow-x-hidden">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <Webhook className="w-7 h-7 text-primary" />
                Webhooks
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Send real-time events to your apps, Zapier, or any URL.
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Webhook
            </Button>
          </div>

          {/* Create Form */}
          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base">New Webhook</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Zapier Integration"
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Endpoint URL</label>
                  <input
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData((p) => ({ ...p, url: e.target.value }))}
                    placeholder="https://hooks.zapier.com/..."
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Events</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_EVENTS.map((evt) => (
                      <button
                        key={evt.key}
                        onClick={() => toggleEventSelection(evt.key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          formData.events.includes(evt.key)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {evt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreate}>Create Webhook</Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Webhook List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 bg-background rounded-xl animate-pulse" />
              ))}
            </div>
          ) : webhooks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Webhook className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No webhooks configured. Add one to send events to external services.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {webhooks.map((wh) => (
                <Card key={wh.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{wh.name}</h3>
                          <Badge variant={wh.is_active ? "default" : "secondary"} className="text-[10px]">
                            {wh.is_active ? "Active" : "Paused"}
                          </Badge>
                          {wh.failure_count > 0 && (
                            <Badge variant="destructive" className="text-[10px]">
                              {wh.failure_count} failures
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mb-2">{wh.url}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {wh.events.map((evt) => (
                            <Badge key={evt} variant="outline" className="text-[10px]">{evt}</Badge>
                          ))}
                        </div>
                        {wh.secret && (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Secret: {showSecrets[wh.id] ? wh.secret : "whsec_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                            </span>
                            <button onClick={() => setShowSecrets((p) => ({ ...p, [wh.id]: !p[wh.id] }))}>
                              {showSecrets[wh.id] ? <EyeOff className="w-3 h-3 text-muted-foreground" /> : <Eye className="w-3 h-3 text-muted-foreground" />}
                            </button>
                            <button onClick={() => { navigator.clipboard.writeText(wh.secret || ""); toast({ title: "Copied!" }); }}>
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Switch checked={wh.is_active} onCheckedChange={() => handleToggle(wh.id, wh.is_active)} />
                        <button
                          onClick={() => handleDelete(wh.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardWebhooks;
