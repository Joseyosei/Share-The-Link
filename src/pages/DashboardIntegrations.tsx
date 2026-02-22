import { useState } from "react";
import { Shield, Search, BarChart3, Link2, Facebook, Globe, CheckCircle, Lock, Eye, Tag, Zap, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  category: string;
  isPro: boolean;
  hasSettings: boolean;
}

const INTEGRATIONS: Integration[] = [
  {
    id: "adult-controls",
    name: "Adult Controls",
    description: "Add content warnings and age requirements to protect your profile. Blocks adult content links automatically.",
    icon: Shield,
    iconBg: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600",
    category: "Safety",
    isPro: false,
    hasSettings: true,
  },
  {
    id: "seo-controls",
    name: "SEO Controls",
    description: "Control how your profile appears in search engines and social media. Add custom meta titles, descriptions, and OG images.",
    icon: Search,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600",
    category: "Marketing",
    isPro: false,
    hasSettings: true,
  },
  {
    id: "facebook-pixel",
    name: "Facebook Pixel",
    description: "Add Facebook Pixel tracking to your profile for analytics and ad targeting. Retarget visitors who view your links.",
    icon: Facebook,
    iconBg: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-700",
    category: "Analytics",
    isPro: false,
    hasSettings: true,
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    description: "Add Google Analytics 4 tracking to your profile for detailed analytics and insights. Track visitor behavior in real-time.",
    icon: BarChart3,
    iconBg: "bg-orange-100 dark:bg-orange-900/30",
    iconColor: "text-orange-600",
    category: "Analytics",
    isPro: true,
    hasSettings: true,
  },
  {
    id: "utm-tracking",
    name: "UTM Tracking",
    description: "Automatically add UTM parameters to all external links on your profile for better campaign tracking and attribution.",
    icon: Tag,
    iconBg: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600",
    category: "Marketing",
    isPro: false,
    hasSettings: true,
  },
  {
    id: "link-locker",
    name: "Link Locker",
    description: "Password-protect sensitive links. Require visitors to enter a password before accessing specific content.",
    icon: Lock,
    iconBg: "bg-gray-100 dark:bg-gray-800",
    iconColor: "text-gray-700 dark:text-gray-300",
    category: "Safety",
    isPro: true,
    hasSettings: true,
  },
  {
    id: "sensitive-content",
    name: "Sensitive Content Warning",
    description: "Display a content warning overlay before visitors can view your profile. Useful for age-gated or sensitive content.",
    icon: Eye,
    iconBg: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-600",
    category: "Safety",
    isPro: false,
    hasSettings: true,
  },
  {
    id: "commerce-links",
    name: "Commerce Links",
    description: "Highlight product links with special badges, pricing tags, and buy-now CTAs to boost conversions on your profile.",
    icon: ShoppingBag,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
    iconColor: "text-emerald-600",
    category: "Commerce",
    isPro: false,
    hasSettings: false,
  },
  {
    id: "priority-links",
    name: "Priority Links",
    description: "Pin important links to the top of your profile with spotlight animations to drive more clicks.",
    icon: Zap,
    iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
    iconColor: "text-yellow-600",
    category: "Marketing",
    isPro: true,
    hasSettings: false,
  },
  {
    id: "custom-domain",
    name: "Custom Domain",
    description: "Use your own domain (e.g., links.yourbrand.com) instead of sharethelink.com for a fully branded experience.",
    icon: Globe,
    iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
    iconColor: "text-cyan-600",
    category: "Branding",
    isPro: true,
    hasSettings: true,
  },
];

const CATEGORIES = ["All", "Safety", "Analytics", "Marketing", "Commerce", "Branding"];

const DashboardIntegrations = () => {
  const { toast } = useToast();
  const { subscription } = useSubscription();
  const isPro = subscription?.subscribed;

  const [installedApps, setInstalledApps] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("stl_installed_integrations");
      return saved ? new Set(JSON.parse(saved)) : new Set(["adult-controls"]);
    } catch { return new Set(["adult-controls"]); }
  });

  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedApp, setExpandedApp] = useState<string | null>(null);

  // Settings state for each integration
  const [settings, setSettings] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem("stl_integration_settings");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const saveInstalledApps = (apps: Set<string>) => {
    setInstalledApps(apps);
    localStorage.setItem("stl_installed_integrations", JSON.stringify([...apps]));
  };

  const saveSettings = (newSettings: typeof settings) => {
    setSettings(newSettings);
    localStorage.setItem("stl_integration_settings", JSON.stringify(newSettings));
  };

  const handleInstall = (appId: string) => {
    const app = INTEGRATIONS.find((a) => a.id === appId);
    if (!app) return;
    if (app.isPro && !isPro) {
      toast({ title: "Pro feature", description: `Upgrade to Pro to use ${app.name}.`, variant: "destructive" });
      return;
    }
    const updated = new Set(installedApps);
    updated.add(appId);
    saveInstalledApps(updated);
    toast({ title: `${app.name} installed!`, description: "The integration is now active on your profile." });
  };

  const handleUninstall = (appId: string) => {
    const app = INTEGRATIONS.find((a) => a.id === appId);
    const updated = new Set(installedApps);
    updated.delete(appId);
    saveInstalledApps(updated);
    toast({ title: `${app?.name || "App"} removed`, description: "The integration has been disabled." });
  };

  const handleSettingChange = (appId: string, key: string, value: string) => {
    const updated = { ...settings, [appId]: { ...(settings[appId] || {}), [key]: value } };
    saveSettings(updated);
  };

  const filtered = INTEGRATIONS.filter((app) => {
    const matchesCategory = activeCategory === "All" || app.category === activeCategory;
    const matchesSearch = !searchQuery || app.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const installedCount = filtered.filter((a) => installedApps.has(a.id)).length;

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />
      <main className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
              <Zap className="w-8 h-8 text-primary" />
              Integrations
            </h1>
            <p className="text-muted-foreground">
              Install apps to extend your profile with analytics, safety controls, and marketing tools.
            </p>
          </div>

          {/* Search + Stats */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search integrations..."
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground flex items-center gap-1.5">
              Showing <span className="font-bold text-foreground">{filtered.length}</span> apps
              {installedCount > 0 && (
                <span className="ml-2 text-primary font-medium">{installedCount} installed</span>
              )}
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-muted-foreground hover:bg-muted border border-border"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Integration Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((app) => {
              const isInstalled = installedApps.has(app.id);
              const isExpanded = expandedApp === app.id;
              const Icon = app.icon;

              return (
                <Card
                  key={app.id}
                  className={`overflow-hidden transition-all duration-200 ${
                    isInstalled ? "border-primary/30 shadow-md" : ""
                  }`}
                >
                  <CardContent className="p-5">
                    {/* App badge */}
                    <div className="flex items-center justify-between mb-3">
                      {app.isPro ? (
                        <Badge className="bg-amber-500 text-white text-[10px] font-bold border-0">VIP</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] font-bold">APP</Badge>
                      )}
                      {isInstalled && (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      )}
                    </div>

                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl ${app.iconBg} flex items-center justify-center mb-3`}>
                      <Icon className={`w-6 h-6 ${app.iconColor}`} />
                    </div>

                    {/* Info */}
                    <h3 className="font-bold text-foreground mb-1">{app.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-2">
                      {app.description}
                    </p>

                    {/* Action */}
                    {isInstalled ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">Installed</span>
                          <Switch
                            checked={true}
                            onCheckedChange={() => handleUninstall(app.id)}
                          />
                        </div>
                        {app.hasSettings && (
                          <button
                            onClick={() => setExpandedApp(isExpanded ? null : app.id)}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {isExpanded ? "Hide Settings" : "Settings"}
                          </button>
                        )}
                        {isExpanded && app.id === "facebook-pixel" && (
                          <Input
                            placeholder="Enter Pixel ID"
                            value={settings[app.id]?.pixelId || ""}
                            onChange={(e) => handleSettingChange(app.id, "pixelId", e.target.value)}
                            className="text-xs h-8"
                          />
                        )}
                        {isExpanded && app.id === "google-analytics" && (
                          <Input
                            placeholder="Enter GA4 Measurement ID (G-XXXXX)"
                            value={settings[app.id]?.gaId || ""}
                            onChange={(e) => handleSettingChange(app.id, "gaId", e.target.value)}
                            className="text-xs h-8"
                          />
                        )}
                        {isExpanded && app.id === "utm-tracking" && (
                          <div className="space-y-2">
                            <Input placeholder="UTM Source" value={settings[app.id]?.source || ""} onChange={(e) => handleSettingChange(app.id, "source", e.target.value)} className="text-xs h-8" />
                            <Input placeholder="UTM Medium" value={settings[app.id]?.medium || ""} onChange={(e) => handleSettingChange(app.id, "medium", e.target.value)} className="text-xs h-8" />
                            <Input placeholder="UTM Campaign" value={settings[app.id]?.campaign || ""} onChange={(e) => handleSettingChange(app.id, "campaign", e.target.value)} className="text-xs h-8" />
                          </div>
                        )}
                        {isExpanded && app.id === "seo-controls" && (
                          <div className="space-y-2">
                            <Input placeholder="Meta Title" value={settings[app.id]?.metaTitle || ""} onChange={(e) => handleSettingChange(app.id, "metaTitle", e.target.value)} className="text-xs h-8" />
                            <Input placeholder="Meta Description" value={settings[app.id]?.metaDescription || ""} onChange={(e) => handleSettingChange(app.id, "metaDescription", e.target.value)} className="text-xs h-8" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleInstall(app.id)}
                        className={`w-full font-semibold ${
                          app.isPro && !isPro
                            ? "bg-amber-500 hover:bg-amber-600 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                        size="sm"
                      >
                        {app.isPro && !isPro ? "Upgrade to Install" : "Install"}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardIntegrations;
