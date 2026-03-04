import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Link2, TrendingUp, Shield, Zap, BarChart3, Palette, Globe, Users, Smartphone, Lock, Clock, Star, Radio, Play, Wand2, Store, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Link2,
    title: "One Link, Everything",
    description: "Share all your products, content, and social profiles in one beautiful, customizable page that represents your brand.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: TrendingUp,
    title: "Built for Entrepreneurs",
    description: "Sell products directly through your profile with zero transaction fees. Integrate with your favorite e-commerce tools.",
    gradient: "from-secondary to-accent",
  },
  {
    icon: Shield,
    title: "No Ads, Ever",
    description: "Your profile stays clean and professional. We never show ads to your visitors - your brand takes center stage.",
    gradient: "from-accent to-primary",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed. Your visitors get instant access to your content with sub-second page loads worldwide.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track clicks, views, and conversions with detailed insights. Understand your audience with real-time analytics.",
    gradient: "from-secondary to-accent",
  },
  {
    icon: Palette,
    title: "Custom Themes",
    description: "Make your profile uniquely yours with custom colors, fonts, backgrounds, and button styles. Express your brand identity.",
    gradient: "from-accent to-primary",
  },
  {
    icon: Radio,
    title: "Live Streaming",
    description: "Go live directly from your dashboard. Stream to your audience with real-time chat, tips, and viewer analytics built in.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Play,
    title: "Media Hub",
    description: "All your stream recordings in one place. Your audience can browse, search, and watch your content anytime.",
    gradient: "from-secondary to-accent",
  },
  {
    icon: Wand2,
    title: "AI Page Builder",
    description: "Describe your business and let AI design your profile page in seconds. Choose from generated themes and layouts.",
    gradient: "from-accent to-primary",
  },
  {
    icon: Store,
    title: "My Shop",
    description: "List your products and services directly on your profile. Your audience can discover and purchase without leaving your page.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Share2,
    title: "Auto-Share Links",
    description: "Schedule your links to be shared on X, Facebook, LinkedIn, and WhatsApp automatically at the perfect time.",
    gradient: "from-secondary to-accent",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Enterprise-grade security protects your data. SSL encryption, regular backups, and GDPR compliance included.",
    gradient: "from-accent to-primary",
  },
];

const FeaturesPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-6">
            ✨ Everything You Need
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Powerful features for<br />modern creators
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            From analytics to customization, we've built everything you need to grow your audience and monetize your content.
          </p>
          <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-white/90 font-semibold">
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-border"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <IconComponent className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-card-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to level up your online presence?
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of creators and entrepreneurs who trust Share The Link to grow their audience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-white/90 font-semibold">
              <Link to="/signup">Start for Free</Link>
            </Button>
            <Button asChild size="lg" className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-all duration-300">
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
