import { useState, useEffect, useCallback } from "react";
import {
  Shield, Search, BarChart3, Facebook, Globe, Lock, Eye, Tag,
  Zap, ShoppingBag, CheckCircle, Settings2, ChevronDown, ChevronUp,
  Power, X, Puzzle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  category: string;
  isPro: boolean;
  settingsFields: { key: string; label: string; placeholder: string }[];
}

const INTEGRATIONS: Integration[] = [
  {
    id: "content-warnings",
    name: "Content Warnings",
    description: "Add custom content or age warnings before visitors view your profile. Useful for sensitive but non-adult content.",
    icon: Shield,
    iconColor: "text-amber-500",
    category: "Safety",
    isPro: false,
    settingsFields: [
      { key: "warningMessage", label: "Warning Message", placeholder: "This profile contains content for ages 18+" },
      { key: "buttonText", label: "Button Text", placeholder: "I understand, continue" },
    ],
  },
  {
    id: "seo-controls",
    name: "SEO Controls",
    description: "Control how your profile appears in search engines and social media. Add custom meta titles, descriptions, and OG images.",
    icon: Search,
    iconColor: "text-blue-500",
    category: "Marketing",
    isPro: false,
    settingsFields: [
      { key: "metaTitle", label: "Meta Title", placeholder: "My Profile - Share The Link" },
      { key: "metaDescription", label: "Meta Description", placeholder: "Check out my links and content" },
      { key: "ogImageUrl", label: "OG Image URL", placeholder: "https://example.com/og-image.jpg" },
    ],
  },
  {
    id: "facebook-pixel",
    name: "Facebook Pixel",
    description: "Add Facebook Pixel tracking for analytics and ad retargeting. Track visitors and create custom audiences.",
    icon: Facebook,
    iconColor: "text-blue-600",
    category: "Analytics",
    isPro: false,
    settingsFields: [
      { key: "pixelId", label: "Pixel ID", placeholder: "Enter your Facebook Pixel ID" },
    ],
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Add Google Analytics 4 tracking for detailed visitor insights. Track behavior, conversions, and traffic sources.",
    icon: BarChart3,
    iconColor: "text-orange-500",
    category: "Analytics",
    isPro: true,
    settingsFields: [
      { key: "gaId", label: "Measurement ID", placeholder: "G-XXXXXXXXXX" },
    ],
  },
  {
    id: "utm-tracking",
    name: "UTM Tracking",
    description: "Automatically add UTM parameters to all external links on your profile for better campaign tracking and attribution.",
    icon: Tag,
    iconColor: "text-violet-500",
    category: "Marketing",
    isPro: false,
    settingsFields: [
      { key: "source", label: "UTM Source", placeholder: "sharethelink" },
      { key: "medium", label: "UTM Medium", placeholder: "profile" },
      { key: "campaign", label: "UTM Campaign", placeholder: "link_in_bio" },
    ],
  },
  {
    id: "link-locker",
    name: "Link Locker",
    description: "Password-protect sensitive links. Require visitors to enter a password before accessing specific content.",
    icon: Lock,
    iconColor: "text-gray-500",
    category: "Safety",
    isPro: true,
    settingsFields: [
      { key: "defaultPassword", label: "Default Password", placeholder: "Set a default password for locked links" },
    ],
  },
  {
    id: "sensitive-content",
    name: "Sensitive Content Warning",
    description: "Display a content warning overlay before visitors can view your profile. Useful for age-gated or mature content.",
    icon: Eye,
    iconColor: "text-red-500",
    category: "Safety",
    isPro: false,
    settingsFields: [
      { key: "warningTitle", label: "Warning Title", placeholder: "Content Warning" },
      { key: "warningBody", label: "Warning Body", placeholder: "This profile may contain sensitive content" },
    ],
  },
  {
    id: "commerce-links",
    name: "Commerce Links",
    description: "Highlight product links with special badges, pricing tags, and buy-now CTAs to boost conversions.",
    icon: ShoppingBag,
    iconColor: "text-emerald-500",
    category: "Commerce",
    isPro: false,
    settingsFields: [],
  },
  {
    id: "priority-links",
    name: "Priority Links",
    description: "Pin important links to the top of your profile with spotlight animations to drive more clicks and engagement.",
    icon: Zap,
    iconColor: "text-yellow-500",
    category: "Branding",
    isPro: true,
    settingsFields: [],
  },
  {
    id: "custom-domain",
    name: "Custom Domain",
    description: "Use your own domain (e.g., links.yourbrand.com) for a fully branded, professional experience.",
    icon: Globe,
    iconColor: "text-cyan-500",
    category: "Branding",
    isPro: true,
    settingsFields: [
      { key: "domain", label: "Custom Domain", placeholder: "links.yourbrand.com" },
    ],
  },
];

const CATEGORIES = ["All", "Safety", "Analytics", "Marketing", "Commerce", "Branding"];

interface InstalledIntegration {
  integration_id: string;
  is_enabled: boolean;
  settings: Record<string, string>;
}

const DashboardIntegrations = () => {
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const isPro = subscription?.subscribed && subscription?.tier !== "free";

  const [installed, setInstalled] = useState<Map<string, InstalledIntegration>>(new Map());
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [localSettings, setLocalSettings] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const fetchInstalled = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await (supabase
      .from("user_integrations" as any)
      .select("*")
      .eq("user_id", user.id) as any);

    if (data) {
      const map = new Map<string, InstalledIntegration>();
      for (const row of data as any[]) {
        map.set(row.integration_id, {
          integration_id: row.integration_id,
          is_enabled: row.is_enabled,
          settings: (row.settings as Record<string, string>) || {},
        });
      }
      setInstalled(map);

      // Init local settings from DB
      const ls: Record<string, Record<string, string>> = {};
      for (const [id, val] of map) {
        ls[id] = { ...val.settings };
      }
      setLocalSettings(ls);
    }
  }, []);

  useEffect(() => {
    fetchInstalled();
  }, [fetchInstalled]);

  const handleInstall = async (appId: string) => {
    const app = INTEGRATIONS.find((a) => a.id === appId);
    if (!app) return;
    if (app.isPro && !isPro) {
      toast({ title: "Upgrade required", description: `${app.name} requires a Pro plan or above.`, variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase
      .from("user_integrations" as any)
      .upsert({
        user_id: user.id,
        integration_id: appId,
        is_enabled: true,
        settings: {},
        updated_at: new Date().toISOString(),
      } as any, { onConflict: "user_id,integration_id" }) as any);

    if (error) {
      toast({ title: "Error", description: "Failed to install integration.", variant: "destructive" });
      return;
    }

    await fetchInstalled();
    toast({ title: `${app.name} installed`, description: "Integration is now active on your profile." });
    
    if (app.settingsFields.length > 0) {
      setExpandedApp(appId);
    }
  };

  const handleUninstall = async (appId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase
      .from("user_integrations" as any)
      .delete()
      .eq("user_id", user.id)
      .eq("integration_id", appId) as any);

    await fetchInstalled();
    setExpandedApp(null);
    const app = INTEGRATIONS.find((a) => a.id === appId);
    toast({ title: `${app?.name || "Integration"} removed`, description: "Integration has been disabled." });
  };

  const handleSaveSettings = async (appId: string) => {
    setSaving(appId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(null); return; }

    const settings = localSettings[appId] || {};

    const { error } = await (supabase
      .from("user_integrations" as any)
      .update({ settings, updated_at: new Date().toISOString() } as any)
      .eq("user_id", user.id)
      .eq("integration_id", appId) as any);

    setSaving(null);

    if (error) {
      toast({ title: "Error", description: "Failed to save settings.", variant: "destructive" });
      return;
    }

    await fetchInstalled();
    toast({ title: "Settings saved", description: "Integration settings updated." });
  };

  const updateLocalSetting = (appId: string, key: string, value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [appId]: { ...(prev[appId] || {}), [key]: value },
    }));
  };

  const filtered = INTEGRATIONS.filter((app) => {
    const matchesCategory = activeCategory === "All" || app.category === activeCategory;
    const matchesSearch = !searchQuery || app.name.toLowerCase().includes(searchQuery.toLowerCase()) || app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const installedCount = INTEGRATIONS.filter((a) => installed.has(a.id)).length;

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />
      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 flex items-center gap-2.5">
                <Puzzle className="w-7 h-7 text-primary" />
                Integrations
              </h1>
              <p className="text-muted-foreground">
                Extend your profile with analytics, safety controls, marketing tools, and more.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm py-1 px-3">
                {installedCount} installed
              </Badge>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search integrations..."
              className="pl-11 h-11 rounded-xl bg-card border-border"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-foreground text-background shadow-md"
                    : "bg-card text-muted-foreground hover:text-foreground border border-border hover:border-foreground/20"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Integration List */}
          <div className="space-y-3">
            {filtered.map((app) => {
              const isInstalled = installed.has(app.id);
              const isExpanded = expandedApp === app.id;
              const Icon = app.icon;
              const appSettings = localSettings[app.id] || {};
              const needsUpgrade = app.isPro && !isPro;

              return (
                <Card
                  key={app.id}
                  className={`overflow-hidden transition-all duration-200 ${
                    isInstalled ? "border-primary/20" : "border-border"
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Main Row */}
                    <div className="flex items-center gap-4 p-5">
                      {/* Icon */}
                      <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Icon className={`w-5 h-5 ${app.iconColor}`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-foreground">{app.name}</h3>
                          {app.isPro && (
                            <Badge className="bg-primary/10 text-primary border-0 text-[10px] font-bold">
                              PRO
                            </Badge>
                          )}
                          {isInstalled && (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {app.description}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isInstalled && app.settingsFields.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                            className="gap-1.5 text-muted-foreground"
                          >
                            <Settings2 className="w-4 h-4" />
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </Button>
                        )}

                        {isInstalled ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUninstall(app.id)}
                            className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Power className="w-3.5 h-3.5" />
                            Remove
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleInstall(app.id)}
                            className={`gap-1.5 ${
                              needsUpgrade
                                ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                                : "bg-foreground text-background hover:bg-foreground/90"
                            }`}
                          >
                            {needsUpgrade ? "Upgrade" : "Install"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Settings Panel (Expanded) */}
                    {isExpanded && isInstalled && app.settingsFields.length > 0 && (
                      <div className="border-t border-border bg-muted/30 p-5">
                        <div className="space-y-4 max-w-lg">
                          {app.settingsFields.map((field) => (
                            <div key={field.key}>
                              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                {field.label}
                              </Label>
                              <Input
                                placeholder={field.placeholder}
                                value={appSettings[field.key] || ""}
                                onChange={(e) => updateLocalSetting(app.id, field.key, e.target.value)}
                                className="h-9 bg-card"
                              />
                            </div>
                          ))}
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveSettings(app.id)}
                              disabled={saving === app.id}
                              className="bg-foreground text-background hover:bg-foreground/90"
                            >
                              {saving === app.id ? "Saving..." : "Save Settings"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedApp(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <Puzzle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg text-foreground mb-2">No integrations found</h3>
              <p className="text-muted-foreground">
                Try a different search term or category filter.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardIntegrations;
