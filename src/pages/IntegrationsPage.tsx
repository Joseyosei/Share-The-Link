import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const integrations = [
  {
    name: "Shopify",
    description: "Sync your products and collections directly to your profile.",
    category: "E-commerce",
    logo: "🛍️",
  },
  {
    name: "Stripe",
    description: "Accept payments and sell digital products seamlessly.",
    category: "Payments",
    logo: "💳",
  },
  {
    name: "Google Analytics",
    description: "Track detailed visitor analytics with your GA account.",
    category: "Analytics",
    logo: "📊",
  },
  {
    name: "Mailchimp",
    description: "Collect email subscribers directly from your profile.",
    category: "Email Marketing",
    logo: "📧",
  },
  {
    name: "YouTube",
    description: "Embed your latest videos automatically.",
    category: "Video",
    logo: "▶️",
  },
  {
    name: "Spotify",
    description: "Share your music and podcast episodes.",
    category: "Music",
    logo: "🎵",
  },
  {
    name: "TikTok",
    description: "Display your latest TikTok content.",
    category: "Social",
    logo: "🎬",
  },
  {
    name: "Instagram",
    description: "Show your Instagram feed on your profile.",
    category: "Social",
    logo: "📸",
  },
];

const IntegrationsPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Integrations
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Connect your favorite tools and platforms to supercharge your profile.
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map((integration) => (
              <div key={integration.name} className="group bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="text-4xl mb-4">{integration.logo}</div>
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
                  {integration.category}
                </span>
                <h3 className="text-lg font-bold text-foreground mb-2">{integration.name}</h3>
                <p className="text-sm text-muted-foreground">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Don't see what you need?
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            We're always adding new integrations. Let us know what tools you'd like to connect.
          </p>
          <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-white/90 font-semibold">
            <Link to="/contact">Request Integration</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IntegrationsPage;
