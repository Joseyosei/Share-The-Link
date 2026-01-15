import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Sparkles, Bug, Zap } from "lucide-react";

const changelog = [
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
