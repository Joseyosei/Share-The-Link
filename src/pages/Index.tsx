import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { AIBuilderDemo } from "@/components/landing/AIBuilderDemo";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { SwipeNavArrows } from "@/components/landing/SwipeNavArrows";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { Link } from "react-router-dom";
import {
  ArrowRight, Wand2, Share2, Radio, Zap, Shield, Globe,
  BarChart3, Layers, Sparkles, Lock, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════
   Card wrapper — each section is a full-viewport card
   ═══════════════════════════════════════════════════════════════ */
const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`h-[100dvh] w-screen flex items-center justify-center overflow-y-auto ${className}`}>
    {children}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   Card 2: Platform Overview / Walkthrough
   ═══════════════════════════════════════════════════════════════ */
const PlatformOverview = () => (
  <Card className="bg-muted/50">
    <div className="container mx-auto px-6 py-16">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
          Platform Overview
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
          See it in action
        </h2>
        <p className="text-lg text-muted-foreground">
          Watch how creators build, share, and monetize — all from one link.
        </p>
      </div>
      <ProductDemo />
    </div>
  </Card>
);

/* ═══════════════════════════════════════════════════════════════
   Card 3: AI Builder
   ═══════════════════════════════════════════════════════════════ */
const AIBuilderCard = () => (
  <Card className="gradient-hero relative">
    <div className="container mx-auto px-6 py-16 relative z-10">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <span className="inline-block px-4 py-1.5 rounded-full glass-card-light text-white text-sm font-semibold mb-4">
          <Sparkles className="w-4 h-4 inline mr-1.5 text-yellow-300" />
          AI-Powered
        </span>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          Describe it. AI builds it.
        </h2>
        <p className="text-lg text-white/70">
          Tell our AI about your brand. It generates a complete, conversion-optimized
          page in seconds.
        </p>
      </div>
      <AIBuilderDemo />
    </div>
  </Card>
);

/* ═══════════════════════════════════════════════════════════════
   Card 4: How It Works
   ═══════════════════════════════════════════════════════════════ */
const HowItWorks = () => {
  const steps = [
    { icon: Wand2, step: "01", title: "AI Generates Your Page", desc: "Describe your campaign. AI builds a beautiful, conversion-optimized page instantly." },
    { icon: Share2, step: "02", title: "Share to 7 Platforms", desc: "One click distributes to Instagram, TikTok, X, LinkedIn, Facebook, WhatsApp & Telegram." },
    { icon: Radio, step: "03", title: "Go Live & Monetize", desc: "Stream live to your audience. Accept tips with a 90/10 creator-first split." },
  ];

  return (
    <Card className="bg-background">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            From idea to live campaign in 30 seconds
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((item) => (
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
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Card 5: Why Share The Link
   ═══════════════════════════════════════════════════════════════ */
const WhyShareTheLink = () => {
  const reasons = [
    { icon: Zap, title: "Lightning Fast", desc: "Pages load instantly. No bloat, no delays." },
    { icon: Shield, title: "No Ads, Ever", desc: "Your audience sees your content, not ads." },
    { icon: Sparkles, title: "AI-Powered", desc: "AI builds your page, writes your bio, suggests layouts." },
    { icon: Globe, title: "One-Click Distribution", desc: "Share to 7 platforms simultaneously." },
    { icon: Radio, title: "Built-in Live Streaming", desc: "Go live and accept tips in real-time." },
    { icon: BarChart3, title: "Deep Analytics", desc: "Track clicks, views, geography, and more." },
    { icon: Layers, title: "Forms & Commerce", desc: "Collect leads, sell products, take bookings." },
    { icon: Lock, title: "Creator-First Revenue", desc: "90/10 split. You keep more of what you earn." },
  ];

  return (
    <Card className="bg-muted/30">
      <div className="container mx-auto px-6 py-16">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Why Share The Link
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Built different
          </h2>
          <p className="text-lg text-muted-foreground">
            Not just another link-in-bio. A complete platform for serious creators.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="group p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <reason.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{reason.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{reason.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Card 6: Pricing
   ═══════════════════════════════════════════════════════════════ */
const PricingCard = () => (
  <Card className="bg-background">
    <div className="py-16 w-full">
      <Pricing />
    </div>
  </Card>
);

/* ═══════════════════════════════════════════════════════════════
   Card 8: Final CTA
   ═══════════════════════════════════════════════════════════════ */
const FinalCTA = () => {
  const stats = [
    { value: "30s", label: "Average setup time" },
    { value: "7", label: "Platform distribution" },
    { value: "90/10", label: "Creator revenue split" },
    { value: "0", label: "Ads on your page" },
  ];

  return (
    <Card className="gradient-hero relative">
      <div className="container mx-auto px-6 text-center relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16 max-w-3xl mx-auto">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
              <p className="text-sm text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
          Ready to share everything with one link?
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
          Join thousands of creators and entrepreneurs who use Share The Link
          to grow their audience and monetize their content.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
          <Button
            asChild
            size="lg"
            className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-10 py-7 text-lg hover-lift rounded-xl"
          >
            <Link to="/signup">
              Start for Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold px-10 py-7 text-lg rounded-xl transition-all duration-300"
          >
            <Link to="/pricing">View Pricing</Link>
          </Button>
        </div>
        <p className="text-sm text-white/50 mb-8">
          No credit card required. Free forever plan available.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          {["SOC 2 Compliant", "GDPR Ready", "99.9% Uptime", "24/7 Support"].map((badge) => (
            <div key={badge} className="flex items-center gap-2 text-white/40">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

/* ═══════════════════════════════════════════════════════════════
   INDEX: Embla horizontal carousel with 8 swipeable cards

   Card Order:
   1. Hero (sharethelink.app/username)
   2. Platform Overview / Walkthrough
   3. AI Builder
   4. How It Works
   5. Why Share The Link
   6. Pricing
   7. Footer
   8. Final CTA (Why Share The Link closing)
   ═══════════════════════════════════════════════════════════════ */
const Index = () => {
  return (
    <div className="h-[100dvh] w-screen overflow-hidden">
      <Navbar />
      <Carousel
        opts={{ loop: false, align: "start", dragFree: false }}
        className="h-full w-full"
      >
        <CarouselContent className="ml-0 h-full">
          <CarouselItem className="pl-0 h-full">
            <Hero />
          </CarouselItem>
          <CarouselItem className="pl-0 h-full">
            <PlatformOverview />
          </CarouselItem>
          <CarouselItem className="pl-0 h-full">
            <AIBuilderCard />
          </CarouselItem>
          <CarouselItem className="pl-0 h-full">
            <HowItWorks />
          </CarouselItem>
          <CarouselItem className="pl-0 h-full">
            <WhyShareTheLink />
          </CarouselItem>
          <CarouselItem className="pl-0 h-full">
            <PricingCard />
          </CarouselItem>
          <CarouselItem className="pl-0 h-full">
            <Footer />
          </CarouselItem>
          <CarouselItem className="pl-0 h-full">
            <FinalCTA />
          </CarouselItem>
        </CarouselContent>
        <SwipeNavArrows />
      </Carousel>
    </div>
  );
};

export default Index;
