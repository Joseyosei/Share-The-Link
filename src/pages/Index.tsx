import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, Radio, Wand2, Share2 } from "lucide-react";
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
            desc: "One click distributes to Instagram, TikTok, Twitter, LinkedIn, Facebook, WhatsApp & Telegram.",
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
          className="bg-white text-foreground hover:bg-white/90 font-semibold px-10 py-7 text-lg hover-lift"
        >
          <Link to="/signup">
            Start for Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </Button>
        <Button
          asChild
          size="lg"
          className="cta-button-outline font-semibold px-10 py-7 text-lg rounded-lg"
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
      <Features />
      <HowItWorks />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
