import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Sparkles, Bug, Zap } from "lucide-react";

const changelog = [
  {
    version: "3.2.0",
    date: "February 16, 2026",
    changes: [
      { type: "feature", title: "AI Builder on Homepage", description: "Try the AI Page Builder directly on the landing page -- describe your business and see a live phone preview instantly, no signup required." },
      { type: "feature", title: "AI Builder theme selection", description: "Choose from 6 curated theme variants (Minimal Light, Bold Gradient, Warm Sunset, Dark Professional, Elegant Rose, Nature Fresh) after AI generates your profile." },
      { type: "feature", title: "AI web retrieval", description: "Paste your website URL and let the AI pull real info about your business to generate a more accurate profile." },
      { type: "fix", title: "Stream recordings now save automatically", description: "Ending a live stream now creates a recording entry so your videos appear in Media and Past Streams." },
      { type: "fix", title: "My Shop product creation fixed", description: "Resolved PostgREST schema cache error that prevented saving new products." },
      { type: "fix", title: "Auto-Share scheduling fixed", description: "Resolved the 'table not found in schema cache' error for scheduled link sharing." },
    ],
  },
  {
    version: "3.1.0",
    date: "February 12, 2026",
    changes: [
      { type: "feature", title: "Media Hub & Dashboard Media", description: "Public media discovery page with filters (All, Live Now, Recent, Trending) plus a protected dashboard media page to manage your own recordings." },
      { type: "feature", title: "My Shop", description: "List your products and services directly on your profile. Manage inventory, toggle listings, and track catalog value." },
      { type: "feature", title: "Auto-Share Links", description: "Schedule your links to be shared on Twitter/X, Facebook, LinkedIn, WhatsApp, and Email at a specific time." },
      { type: "improvement", title: "Features page updated", description: "Landing page features now showcase Live Streaming, Media Hub, AI Builder, My Shop, and Auto-Share." },
    ],
  },
  {
    version: "3.0.0",
    date: "February 8, 2026",
    changes: [
      { type: "feature", title: "Live Streaming", description: "Go live directly from your dashboard. Stream to your audience with real-time chat, viewer count, and tip collection." },
      { type: "feature", title: "AI Page Builder", description: "Describe your business in 2-3 sentences and AI generates a complete profile with bio, links, theme, and layout." },
      { type: "feature", title: "Live Stream PiP Mini-Player", description: "When navigating away from a live stream, a floating mini-player keeps the video playing in the corner." },
      { type: "feature", title: "Slack-style Navigation Guide", description: "New users get a tooltip walkthrough that highlights each sidebar item with contextual descriptions." },
      { type: "improvement", title: "Dark mode toggle in navbar", description: "Sun/moon toggle added after 'Join for free' for quick theme switching." },
    ],
  },
  {
    version: "2.5.0",
    date: "February 1, 2026",
    changes: [
      { type: "feature", title: "Help page", description: "Comprehensive help center with FAQs, video tutorials, and contact support -- accessible from the sidebar." },
      { type: "improvement", title: "Upgraded profile preview", description: "Dashboard live preview now shows avatar, social media icons, and a share button matching the Linktree aesthetic." },
      { type: "fix", title: "Dark mode button text visibility", description: "Fixed invisible button text on gradient sections across all landing pages in dark mode." },
    ],
  },
  {
    version: "2.4.0",
    date: "January 15, 2026",
    changes: [
      { type: "feature", title: "Dark mode support", description: "Toggle between light and dark themes across the entire platform." },
      { type: "feature", title: "QR code authentication", description: "Sign up or log in by scanning a QR code with your phone." },
      { type: "improvement", title: "Faster page loads", description: "Optimized asset loading for 40% faster page loads." },
    ],
  },
  {
    version: "2.3.0",
    date: "January 8, 2026",
    changes: [
      { type: "feature", title: "Advanced analytics dashboard", description: "Track clicks, views, and conversions with detailed charts." },
      { type: "feature", title: "Custom domains", description: "Use your own domain for a fully branded experience." },
      { type: "fix", title: "Fixed link ordering bug", description: "Drag and drop now correctly saves link positions." },
    ],
  },
  {
    version: "2.2.0",
    date: "December 20, 2025",
    changes: [
      { type: "feature", title: "Team collaboration", description: "Invite team members and manage permissions together." },
      { type: "improvement", title: "Improved mobile editor", description: "Edit your profile on the go with our redesigned mobile experience." },
      { type: "fix", title: "Email notification fixes", description: "Fixed issues with email notifications not being delivered." },
    ],
  },
  {
    version: "2.1.0",
    date: "December 1, 2025",
    changes: [
      { type: "feature", title: "Link scheduling", description: "Schedule links to appear and disappear automatically." },
      { type: "feature", title: "Product showcases", description: "Display products with images, prices, and buy buttons." },
      { type: "improvement", title: "Better SEO", description: "Improved meta tags and structured data for better search rankings." },
    ],
  },
];

const getIcon = (type: string) => {
  switch (type) {
    case "feature":
      return <Sparkles className="w-4 h-4" />;
    case "improvement":
      return <Zap className="w-4 h-4" />;
    case "fix":
      return <Bug className="w-4 h-4" />;
    default:
      return <Sparkles className="w-4 h-4" />;
  }
};

const getColor = (type: string) => {
  switch (type) {
    case "feature":
      return "bg-primary/10 text-primary";
    case "improvement":
      return "bg-accent/10 text-accent";
    case "fix":
      return "bg-secondary/10 text-secondary";
    default:
      return "bg-primary/10 text-primary";
  }
};

const ChangelogPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Changelog
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            See what's new and improved in Share The Link.
          </p>
        </div>
      </section>

      {/* Changelog */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto space-y-12">
            {changelog.map((release) => (
              <div key={release.version} className="bg-card rounded-2xl p-8 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <span className="px-4 py-2 rounded-full gradient-button text-primary-foreground font-bold">
                    v{release.version}
                  </span>
                  <span className="text-muted-foreground">{release.date}</span>
                </div>
                <div className="space-y-4">
                  {release.changes.map((change, index) => (
                    <div key={index} className="flex gap-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getColor(change.type)}`}>
                        {getIcon(change.type)}
                        {change.type}
                      </span>
                      <div>
                        <h3 className="font-semibold text-foreground">{change.title}</h3>
                        <p className="text-muted-foreground text-sm">{change.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ChangelogPage;
