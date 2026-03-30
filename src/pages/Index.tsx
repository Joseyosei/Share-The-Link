import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { Features } from "@/components/landing/Features";
import { AIBuilderDemo } from "@/components/landing/AIBuilderDemo";
import { Pricing } from "@/components/landing/Pricing";
import { Reviews } from "@/components/landing/Reviews";
import { Footer } from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, Radio, Wand2, Share2, Play, Eye, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const HowItWorks = () => (
  <section className="py-24 bg-muted/50">
    <div className="container mx-auto px-6">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
          How It Works
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
          From idea to live campaign in 30 seconds
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        {[
          {
            icon: Wand2,
            step: "01",
            title: "AI Generates Your Page",
            desc: "Describe your campaign. AI builds a beautiful, conversion-optimized page instantly.",
          },
          {
            icon: Share2,
            step: "02",
            title: "Share to 7 Platforms",
            desc: "One click distributes to Instagram, TikTok, X, LinkedIn, Facebook, WhatsApp & Telegram.",
          },
          {
            icon: Radio,
            step: "03",
            title: "Go Live & Monetize",
            desc: "Stream live to your audience. Accept tips with a 90/10 creator-first split.",
          },
        ].map((item, i) => (
          <div key={item.step} className="relative text-center group">
            <div className="w-16 h-16 rounded-2xl gradient-button flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
              <item.icon className="w-8 h-8 text-white" />
            </div>
            <span className="text-5xl font-extrabold text-muted-foreground/10 absolute -top-4 left-1/2 -translate-x-1/2">
              {item.step}
            </span>
            <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
            <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const MediaShowcase = () => {
  const SAMPLE_MEDIA = [
    { title: "How I Grew to 100K Followers", creator: "Alex Rivera", views: "12.4K", type: "Recording", image: "/images/media-thumb-1.jpg" },
    { title: "Sunday Service Live", creator: "Grace Church", views: "3.2K", type: "Live Stream", image: "/images/media-thumb-2.jpg" },
    { title: "Product Launch Event", creator: "TechStartup", views: "8.7K", type: "Recording", image: "/images/media-thumb-3.jpg" },
    { title: "Music Production Session", creator: "DJ Pulse", views: "5.1K", type: "Live Stream", image: "/images/media-thumb-4.jpg" },
    { title: "Fitness Workshop Q&A", creator: "Coach Pro", views: "2.9K", type: "Recording", image: "/images/media-thumb-5.jpg" },
    { title: "Art & Design Process", creator: "Creative Studio", views: "4.3K", type: "Recording", image: "/images/media-thumb-6.jpg" },
  ];

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Play className="w-4 h-4" />
              Media Hub
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              Explore what creators are sharing
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg leading-relaxed">
              Browse live streams, recordings, and content from creators on Share The Link.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-4 md:mt-0 rounded-full px-6"
          >
            <Link to="/media">
              Browse All Media
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_MEDIA.map((item, i) => (
            <Link
              key={item.title}
              to="/media"
              className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
            >
              {/* Thumbnail with image */}
              <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
                {item.type === "Live Stream" && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-semibold text-white">LIVE</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{item.creator}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {item.views} views
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Trending
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => (
  <section className="py-24 gradient-hero relative">
    <div className="container mx-auto px-6 text-center relative z-10">
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
        Ready to share everything with one link?
      </h2>
      <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
        Join thousands of creators and entrepreneurs who use Share The Link
        to grow their audience and monetize their content.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          asChild
          size="lg"
          className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-10 py-7 text-lg hover-lift"
        >
          <Link to="/signup">
            Start for Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold px-10 py-7 text-lg rounded-lg transition-all duration-300"
        >
          <Link to="/pricing">View Pricing</Link>
        </Button>
      </div>
      <p className="text-sm text-white/50 mt-6">
        No credit card required. Free forever plan available.
      </p>
    </div>
  </section>
);

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ProductDemo />
      <Features />
      <HowItWorks />
      <MediaShowcase />
      <AIBuilderDemo />
      <Reviews />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
