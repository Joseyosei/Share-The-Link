import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { AIBuilderDemo } from "@/components/landing/AIBuilderDemo";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import {
  ArrowRight, Wand2, Share2, Radio, Zap, Shield, Globe,
  BarChart3, Layers, Sparkles, Lock, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════
   SECTION 2: Platform Overview / Walkthrough
   ═══════════════════════════════════════════════════════════════ */
const PlatformOverview = () => (
  <section id="overview" className="relative bg-black py-32 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,80,255,0.04),transparent_70%)]" />
    <div className="container mx-auto px-6 relative z-10">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-4 font-medium">Platform Overview</p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          See it in action
        </h2>
        <p className="text-lg text-white/40 leading-relaxed">
          Watch how creators build, share, and monetize — all from one link.
        </p>
      </div>
      <ProductDemo />
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   SECTION 3: AI Builder
   ═══════════════════════════════════════════════════════════════ */
const AIBuilderSection = () => (
  <section id="ai-builder" className="relative bg-gray-950 py-32 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(120,80,255,0.06),transparent_60%)]" />
    <div className="container mx-auto px-6 relative z-10">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <p className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-4 font-medium">AI-Powered</p>
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
          Describe it. AI builds it.
        </h2>
        <p className="text-lg text-white/40 leading-relaxed">
          Tell our AI about your brand. It generates a complete, conversion-optimized
          page in seconds — bio, colors, layout, and all.
        </p>
      </div>
      <AIBuilderDemo />
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   SECTION 4: How It Works
   ═══════════════════════════════════════════════════════════════ */
const HowItWorks = () => {
  const steps = [
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
  ];

  return (
    <section id="how-it-works" className="relative bg-black py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(120,80,255,0.04),transparent_60%)]" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-4 font-medium">How It Works</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            From idea to live
            <br />
            <span className="text-white/40">in 30 seconds</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((item) => (
            <div key={item.step} className="relative group text-center">
              <div className="text-7xl font-black text-white/[0.03] absolute -top-6 left-1/2 -translate-x-1/2 select-none">
                {item.step}
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
                <item.icon className="w-7 h-7 text-white/60 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
              <p className="text-white/40 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SECTION 5: Why Share The Link
   ═══════════════════════════════════════════════════════════════ */
const WhyShareTheLink = () => {
  const reasons = [
    { icon: Zap, title: "Lightning Fast", desc: "Pages load instantly. No bloat, no delays — just pure speed that keeps visitors engaged." },
    { icon: Shield, title: "No Ads, Ever", desc: "Your audience sees your content, not someone else's ads. Clean, distraction-free experience." },
    { icon: Sparkles, title: "AI-Powered", desc: "Our AI builds your page, writes your bio, and suggests layouts that convert." },
    { icon: Globe, title: "One-Click Distribution", desc: "Share to Instagram, TikTok, X, LinkedIn, Facebook, WhatsApp & Telegram simultaneously." },
    { icon: Radio, title: "Built-in Live Streaming", desc: "Go live directly from your page. Accept tips and interact with your audience in real-time." },
    { icon: BarChart3, title: "Deep Analytics", desc: "Track clicks, views, geography, and more. Understand exactly how your audience engages." },
    { icon: Layers, title: "Forms & Commerce", desc: "Collect leads, sell products, take bookings — all without leaving your page." },
    { icon: Lock, title: "Creator-First Revenue", desc: "90/10 split on tips and transactions. You keep more of what you earn." },
  ];

  return (
    <section id="why-stl" className="relative bg-gray-950 py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,80,255,0.04),transparent_70%)]" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-20">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/70 mb-4 font-medium">Why Share The Link</p>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Built different
          </h2>
          <p className="text-lg text-white/40 leading-relaxed">
            Not just another link-in-bio. A complete platform for creators who are serious about growth.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="group p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-5 group-hover:bg-white/10 transition-colors">
                <reason.icon className="w-5 h-5 text-white/50 group-hover:text-white/80 transition-colors" />
              </div>
              <h3 className="text-base font-semibold text-white mb-2">{reason.title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{reason.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   SECTION 6: Pricing (wrapper with dark bg)
   ═══════════════════════════════════════════════════════════════ */
const PricingSection = () => (
  <section id="pricing" className="relative bg-black py-32 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.04),transparent_60%)]" />
    <div className="relative z-10">
      <Pricing />
    </div>
  </section>
);

/* ═══════════════════════════════════════════════════════════════
   SECTION 8: Final CTA — "Why Share The Link" (closing)
   ═══════════════════════════════════════════════════════════════ */
const FinalCTA = () => {
  const stats = [
    { value: "30s", label: "Average setup time" },
    { value: "7", label: "Platform distribution" },
    { value: "90/10", label: "Creator revenue split" },
    { value: "0", label: "Ads on your page" },
  ];

  return (
    <section id="cta" className="relative bg-black py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-black to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,80,255,0.06),transparent_60%)]" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</p>
                <p className="text-sm text-white/30 tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Ready to share everything
            <br />
            <span className="text-white/40">with one link?</span>
          </h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-12 leading-relaxed">
            Join thousands of creators and entrepreneurs who use Share The Link
            to grow their audience and monetize their content.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              asChild
              size="lg"
              className="bg-white text-black hover:bg-white/90 font-semibold px-10 py-7 text-lg rounded-xl"
            >
              <Link to="/signup">
                Start for Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-white/20 text-white bg-white/5 hover:bg-white/10 font-medium px-10 py-7 text-lg rounded-xl transition-all duration-300"
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>

          <p className="text-sm text-white/20">
            No credit card required &middot; Free forever plan available
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
            {["SOC 2 Compliant", "GDPR Ready", "99.9% Uptime", "24/7 Support"].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-white/20">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs tracking-wide">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════════
   INDEX: Section order per user specification
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
    <div className="min-h-screen bg-black">
      <Navbar />
      <Hero />
      <PlatformOverview />
      <AIBuilderSection />
      <HowItWorks />
      <WhyShareTheLink />
      <PricingSection />
      <FinalCTA />
      <Footer />
    </div>
  );
};

export default Index;
