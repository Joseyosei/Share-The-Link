import { Link2, TrendingUp, Shield, Zap } from "lucide-react";

const features = [
  {
    icon: Link2,
    title: "One Link, Everything",
    description: "Share all your products, content, and social profiles from a single, beautiful link.",
  },
  {
    icon: TrendingUp,
    title: "Built for Entrepreneurs",
    description: "Sell products, accept payments, and grow your business seamlessly.",
  },
  {
    icon: Shield,
    title: "No Ads, Ever",
    description: "Your profile stays clean and professional. We never show ads to your audience.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Instant loading times mean your customers never wait. Speed = conversions.",
  },
];

export const Features = () => {
  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Everything you need to grow
          </h2>
          <p className="text-lg text-muted-foreground">
            Powerful features designed to help creators and entrepreneurs succeed.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-8 rounded-2xl gradient-card hover-lift hover-glow cursor-default"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl gradient-button flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
