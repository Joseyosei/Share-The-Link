import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Check, X, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for getting started",
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/month",
    description: "For growing creators",
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Business",
    price: "$29",
    period: "/month",
    description: "For teams and agencies",
    cta: "Contact Sales",
    popular: false,
  },
];

const comparisonFeatures = [
  {
    category: "Links & Content",
    features: [
      { name: "Unlimited links", free: true, pro: true, business: true },
      { name: "Social icons", free: true, pro: true, business: true },
      { name: "Video embeds", free: false, pro: true, business: true },
      { name: "Product showcases", free: false, pro: true, business: true },
      { name: "Link scheduling", free: false, pro: true, business: true, tooltip: "Schedule links to appear and disappear automatically" },
    ],
  },
  {
    category: "Customization",
    features: [
      { name: "Basic themes", free: true, pro: true, business: true },
      { name: "Custom colors", free: false, pro: true, business: true },
      { name: "Custom fonts", free: false, pro: true, business: true },
      { name: "Custom backgrounds", free: false, pro: true, business: true },
      { name: "Remove branding", free: false, pro: true, business: true },
      { name: "Custom CSS", free: false, pro: false, business: true },
    ],
  },
  {
    category: "Analytics",
    features: [
      { name: "Basic click tracking", free: true, pro: true, business: true },
      { name: "View statistics", free: true, pro: true, business: true },
      { name: "Device breakdown", free: false, pro: true, business: true },
      { name: "Geographic data", free: false, pro: true, business: true },
      { name: "Conversion tracking", free: false, pro: true, business: true },
      { name: "Export data (CSV)", free: false, pro: false, business: true },
      { name: "API access", free: false, pro: false, business: true },
    ],
  },
  {
    category: "Domain & Branding",
    features: [
      { name: "sharethelink.com/username", free: true, pro: true, business: true },
      { name: "Custom subdomain", free: false, pro: true, business: true, tooltip: "Use your-brand.sharethelink.com" },
      { name: "Custom domain", free: false, pro: false, business: true, tooltip: "Use your own domain like links.yourbrand.com" },
      { name: "SSL certificate", free: true, pro: true, business: true },
    ],
  },
  {
    category: "E-commerce",
    features: [
      { name: "Product links", free: true, pro: true, business: true },
      { name: "Affiliate links", free: true, pro: true, business: true },
      { name: "Tip jar / Donations", free: false, pro: true, business: true },
      { name: "Digital product sales", free: false, pro: false, business: true },
      { name: "0% transaction fees", free: false, pro: false, business: true, tooltip: "We don't take any cut from your sales" },
    ],
  },
  {
    category: "Team & Support",
    features: [
      { name: "Email support", free: true, pro: true, business: true },
      { name: "Priority support", free: false, pro: true, business: true },
      { name: "Live chat support", free: false, pro: false, business: true },
      { name: "Dedicated account manager", free: false, pro: false, business: true },
      { name: "Team members", free: "1", pro: "3", business: "Unlimited" },
      { name: "Multiple profiles", free: "1", pro: "5", business: "Unlimited" },
    ],
  },
];

const PricingPage = () => {
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "string") {
      return <span className="font-medium text-foreground">{value}</span>;
    }
    return value ? (
      <Check className="w-5 h-5 text-green-500 mx-auto" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-primary-foreground/10 text-primary-foreground text-sm font-medium mb-6">
            💰 Simple Pricing
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Choose your plan
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-background -mt-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular
                    ? "bg-foreground text-background shadow-2xl scale-105 z-10"
                    : "bg-card text-card-foreground shadow-lg"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 rounded-full text-sm font-semibold gradient-button text-primary-foreground">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className={`text-sm mb-4 ${plan.popular ? "text-background/70" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className={plan.popular ? "text-background/70" : "text-muted-foreground"}>
                      {plan.period}
                    </span>
                  </div>
                </div>

                <Button
                  asChild
                  className={`w-full py-6 font-semibold ${
                    plan.popular
                      ? "bg-background text-foreground hover:bg-background/90"
                      : "gradient-button text-primary-foreground hover:opacity-90"
                  }`}
                >
                  <Link to="/signup">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compare all features
            </h2>
            <p className="text-lg text-muted-foreground">
              See exactly what you get with each plan
            </p>
          </div>

          <div className="max-w-5xl mx-auto bg-card rounded-2xl shadow-lg overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 p-6 bg-muted/50 border-b border-border sticky top-0">
              <div className="font-semibold text-foreground">Features</div>
              <div className="text-center">
                <div className="font-bold text-foreground">Free</div>
                <div className="text-sm text-muted-foreground">$0/forever</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary">Pro</div>
                <div className="text-sm text-muted-foreground">$9/month</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-foreground">Business</div>
                <div className="text-sm text-muted-foreground">$29/month</div>
              </div>
            </div>

            {/* Table Body */}
            {comparisonFeatures.map((category) => (
              <div key={category.category}>
                {/* Category Header */}
                <div className="grid grid-cols-4 gap-4 px-6 py-4 bg-muted/30">
                  <div className="col-span-4 font-semibold text-foreground text-lg">
                    {category.category}
                  </div>
                </div>

                {/* Features */}
                {category.features.map((feature, index) => (
                  <div
                    key={feature.name}
                    className={`grid grid-cols-4 gap-4 px-6 py-4 ${
                      index % 2 === 0 ? "bg-card" : "bg-muted/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-foreground">
                      {feature.name}
                      {feature.tooltip && (
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{feature.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="text-center">{renderFeatureValue(feature.free)}</div>
                    <div className="text-center">{renderFeatureValue(feature.pro)}</div>
                    <div className="text-center">{renderFeatureValue(feature.business)}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently asked questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto grid gap-6">
            {[
              {
                q: "Can I switch plans later?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate your billing.",
              },
              {
                q: "Is there a free trial?",
                a: "Pro and Business plans come with a 14-day free trial. No credit card required to start.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and Apple Pay. Enterprise customers can also pay by invoice.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. You can cancel your subscription at any time with no cancellation fees. Your account will remain active until the end of your billing period.",
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-card rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-foreground mb-2">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of creators and entrepreneurs using Share The Link.
          </p>
          <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link to="/signup">Start for Free →</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
