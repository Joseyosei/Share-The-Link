import { useState } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  ShoppingBag, CreditCard, BarChart3, Mail, Play, Music, Film, Camera,
  CheckCircle, Clock, ChevronDown, ChevronUp, ExternalLink, Zap, Shield, ArrowRight,
} from "lucide-react";

type IntegrationStatus = "available" | "coming_soon" | "beta";

interface Integration {
  name: string;
  description: string;
  longDescription: string;
  category: string;
  icon: React.ElementType;
  iconBg: string;
  status: IntegrationStatus;
  setupSteps?: string[];
  features?: string[];
  learnMoreUrl?: string;
}

const integrations: Integration[] = [
  {
    name: "Stripe",
    description: "Accept payments and sell digital products seamlessly.",
    longDescription:
      "Connect your Stripe account to accept payments directly from your profile. Sell digital products, accept tips from your audience, and manage subscriptions -- all with automatic fee calculation and real-time payment notifications.",
    category: "Payments",
    icon: CreditCard,
    iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    status: "available",
    features: [
      "Accept one-time and recurring payments",
      "Sell digital products from your profile",
      "Collect tips and donations from fans",
      "Automatic GBP fee calculation (2.9% + 20p)",
      "Real-time payment notifications",
      "Stripe Customer Portal for subscribers",
    ],
    setupSteps: [
      "Go to Dashboard > Settings > Billing & Subscription",
      "Your Stripe account is already connected via Share The Link",
      "Add products in My Shop to start selling",
      "Enable tips on your Live Streaming page",
    ],
  },
  {
    name: "Shopify",
    description: "Sync your products and collections directly to your profile.",
    longDescription:
      "Connect your Shopify store to automatically display your products on your Share The Link profile. Products sync in real-time, and visitors can purchase directly from your page without leaving.",
    category: "E-commerce",
    icon: ShoppingBag,
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    status: "coming_soon",
    features: [
      "Auto-sync products from your Shopify store",
      "Display product images, prices, and descriptions",
      "Direct checkout links to your Shopify store",
      "Real-time inventory updates",
    ],
  },
  {
    name: "Google Analytics",
    description: "Track detailed visitor analytics with your GA account.",
    longDescription:
      "Add your Google Analytics tracking ID to get detailed insights into who visits your profile. Track page views, click-through rates, referral sources, and user demographics -- all in your existing GA dashboard.",
    category: "Analytics",
    icon: BarChart3,
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    status: "coming_soon",
    features: [
      "Track profile page views and unique visitors",
      "Monitor link click-through rates",
      "Identify top referral sources",
      "View audience demographics and geography",
      "Custom event tracking for buttons and forms",
    ],
    setupSteps: [
      "Create a GA4 property in Google Analytics",
      "Copy your Measurement ID (G-XXXXXXXXXX)",
      "Go to Dashboard > Settings > Integrations",
      "Paste your Measurement ID and save",
    ],
  },
  {
    name: "Mailchimp",
    description: "Collect email subscribers directly from your profile.",
    longDescription:
      "Add an email signup form to your profile that sends subscribers straight to your Mailchimp audience. Build your mailing list automatically whenever someone visits your page.",
    category: "Email Marketing",
    icon: Mail,
    iconBg: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    status: "coming_soon",
    features: [
      "Embed signup forms on your profile",
      "Auto-add subscribers to your Mailchimp audience",
      "Custom welcome emails for new subscribers",
      "Segment subscribers by source",
    ],
  },
  {
    name: "YouTube",
    description: "Embed your latest videos automatically.",
    longDescription:
      "Connect your YouTube channel to automatically display your latest videos on your profile. When you upload a new video, your profile updates within minutes. Great for driving views from your audience.",
    category: "Video",
    icon: Play,
    iconBg: "bg-red-500/10 text-red-600 dark:text-red-400",
    status: "coming_soon",
    features: [
      "Auto-embed latest videos from your channel",
      "Customise how many videos to display",
      "Video thumbnail previews on your profile",
      "Direct links to your YouTube channel",
    ],
  },
  {
    name: "Spotify",
    description: "Share your music and podcast episodes.",
    longDescription:
      "Showcase your Spotify tracks, albums, and podcast episodes directly on your profile with embedded players. Visitors can preview your content and follow you on Spotify without leaving your page.",
    category: "Music",
    icon: Music,
    iconBg: "bg-green-500/10 text-green-600 dark:text-green-400",
    status: "coming_soon",
    features: [
      "Embed Spotify player on your profile",
      "Display latest tracks or podcast episodes",
      "Follow button for your Spotify profile",
      "Playlist showcases and album highlights",
    ],
  },
  {
    name: "TikTok",
    description: "Display your latest TikTok content.",
    longDescription:
      "Connect your TikTok account to showcase your latest videos on your profile. Viewers can watch your content directly and follow you on TikTok -- perfect for cross-platform growth.",
    category: "Social",
    icon: Film,
    iconBg: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    status: "coming_soon",
    features: [
      "Auto-display latest TikTok videos",
      "Embedded video previews",
      "Follow button for your TikTok profile",
      "Video view count display",
    ],
  },
  {
    name: "Instagram",
    description: "Show your Instagram feed on your profile.",
    longDescription:
      "Display your latest Instagram posts in a beautiful grid on your profile. Keep your audience engaged with your latest photos and reels without them needing to leave your page.",
    category: "Social",
    icon: Camera,
    iconBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    status: "coming_soon",
    features: [
      "Instagram feed grid on your profile",
      "Latest posts auto-update",
      "Link to your Instagram profile",
      "Story highlights showcase",
    ],
  },
];

const statusConfig: Record<IntegrationStatus, { label: string; className: string }> = {
  available: { label: "Available", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  beta: { label: "Beta", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  coming_soon: { label: "Coming Soon", className: "bg-muted text-muted-foreground border-border" },
};

const IntegrationsPage = () => {
  const [expandedIntegration, setExpandedIntegration] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const categories = ["all", ...Array.from(new Set(integrations.map((i) => i.category)))];

  const filteredIntegrations =
    filterCategory === "all"
      ? integrations
      : integrations.filter((i) => i.category === filterCategory);

  const toggleIntegration = (name: string) => {
    setExpandedIntegration(expandedIntegration === name ? null : name);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 text-balance">
            Integrations
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto text-pretty">
            Connect your favourite tools and platforms to supercharge your profile.
          </p>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 bg-card border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{integrations.length}</p>
              <p className="text-sm text-muted-foreground">Total Integrations</p>
            </div>
            <div className="w-px h-10 bg-border hidden sm:block" />
            <div>
              <p className="text-2xl font-bold text-emerald-600">{integrations.filter(i => i.status === "available").length}</p>
              <p className="text-sm text-muted-foreground">Available Now</p>
            </div>
            <div className="w-px h-10 bg-border hidden sm:block" />
            <div>
              <p className="text-2xl font-bold text-muted-foreground">{integrations.filter(i => i.status === "coming_soon").length}</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filter + Grid */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-6">
          {/* Category Filter */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  filterCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>

          {/* Integrations List */}
          <div className="max-w-3xl mx-auto space-y-4">
            {filteredIntegrations.map((integration) => {
              const isExpanded = expandedIntegration === integration.name;
              const status = statusConfig[integration.status];
              const Icon = integration.icon;

              return (
                <div
                  key={integration.name}
                  className="bg-card rounded-2xl shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Summary (always visible) */}
                  <button
                    onClick={() => toggleIntegration(integration.name)}
                    className="w-full p-6 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${integration.iconBg}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-foreground">{integration.name}</h3>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.className}`}>
                            {status.label}
                          </span>
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {integration.category}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{integration.description}</p>
                      </div>
                      <div className="flex-shrink-0 hidden md:block">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-border animate-in slide-in-from-top-2 duration-300">
                      {/* Description */}
                      <div className="mt-6 mb-6">
                        <p className="text-muted-foreground leading-relaxed">{integration.longDescription}</p>
                      </div>

                      {/* Features */}
                      {integration.features && (
                        <div className="mb-6">
                          <h4 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-primary" />
                            Features
                          </h4>
                          <ul className="space-y-2">
                            {integration.features.map((feature, i) => (
                              <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span className="text-sm leading-relaxed">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Setup Steps */}
                      {integration.setupSteps && integration.status === "available" && (
                        <div className="mb-6">
                          <h4 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            How to Set Up
                          </h4>
                          <ol className="space-y-2">
                            {integration.setupSteps.map((step, i) => (
                              <li key={i} className="flex items-start gap-3 text-muted-foreground">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span className="text-sm leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Action */}
                      <div className="pt-4 border-t border-border">
                        {integration.status === "available" ? (
                          <Button asChild className="gradient-button text-primary-foreground hover:opacity-90">
                            <Link to="/dashboard">
                              Set Up {integration.name}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                          </Button>
                        ) : (
                          <div className="flex items-center gap-3">
                            <Button variant="outline" disabled className="cursor-not-allowed">
                              <Clock className="w-4 h-4 mr-2" />
                              Coming Soon
                            </Button>
                            <p className="text-sm text-muted-foreground">
                              We're working on this. Stay tuned!
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6 text-balance">
            {"Don't see what you need?"}
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8 text-pretty">
            {"We're always adding new integrations. Let us know what tools you'd like to connect."}
          </p>
          <Button asChild size="lg" className="bg-card text-foreground hover:bg-card/90 font-semibold">
            <Link to="/contact">
              Request Integration
              <ExternalLink className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IntegrationsPage;
