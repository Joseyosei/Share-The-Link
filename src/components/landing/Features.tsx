import { Link2, TrendingUp, Shield, Zap, Wand2, Radio, Share2, Timer } from "lucide-react";
import { useEffect, useRef } from "react";

const features = [
  {
    icon: Wand2,
    title: "AI Page Builder",
    description: "Describe your business, get a pro campaign page in 30 seconds. AI does the heavy lifting.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: Share2,
    title: "One-Click Distribution",
    description: "Share to Instagram, TikTok, X, LinkedIn, Facebook, WhatsApp, and Telegram instantly.",
    gradient: "from-pink-500 to-orange-500",
  },
  {
    icon: Radio,
    title: "Built-in Live Streaming",
    description: "Go live directly from your profile. No other link-in-bio tool can do this.",
    gradient: "from-red-500 to-pink-500",
  },
  {
    icon: Timer,
    title: "Countdown Timers",
    description: "Create urgency and drive conversions with animated countdown timers on any link.",
    gradient: "from-orange-500 to-yellow-500",
  },
  {
    icon: Link2,
    title: "One Link, Everything",
    description: "Products, content, social profiles, all in one beautiful, customizable page.",
    gradient: "from-purple-500 to-blue-500",
  },
  {
    icon: TrendingUp,
    title: "Built for Entrepreneurs",
    description: "Sell products with zero transaction fees. Built for people who build businesses.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Shield,
    title: "No Ads, Ever",
    description: "Your profile stays clean and professional. Your brand takes center stage.",
    gradient: "from-green-500 to-emerald-500",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Sub-second page loads worldwide. Speed equals conversions.",
    gradient: "from-yellow-500 to-orange-500",
  },
];

export const Features = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.querySelectorAll(".scroll-reveal, .scroll-reveal-scale").forEach((child) => child.classList.add("revealed"));
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden" ref={sectionRef}>
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Why Share The Link
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Everything you need to grow
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            AI-powered campaign pages, one-click distribution to 7 platforms,
            and the only link-in-bio with built-in live streaming.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-8 rounded-2xl liquid-glass glass-specular hover-lift hover-glow cursor-default relative overflow-hidden scroll-reveal-scale scroll-delay-${Math.min(index + 1, 5)}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Subtle gradient accent on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
