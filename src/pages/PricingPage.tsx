import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Check, X, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PRICING_PLANS, formatPrice, getCheckoutUrl } from "@/lib/stripe-products";

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
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const navigate = useNavigate();

  const handlePlanClick = (planId: string) => {
    if (planId === "free") {
      navigate("/signup");
      return;
    }
    const checkoutUrl = getCheckoutUrl(planId, interval);
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
    }
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === "string") {
      return <span className="font-medium text-foreground">{value}</span>;
    }
    return value ? (
      <Check className="w-5 h-5 text-primary mx-auto" />
    ) : (
      <X className="w-5 h-5 text-muted-foreground/50 mx-auto" />
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center relative z-10">
          <span className="inline-block px-4 py-2 rounded-full bg-white/10 text-white text-sm font-medium mb-6 backdrop-blur-sm border border-white/20">
            Simple Pricing
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
            Choose your plan
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Start free and upgrade as you grow. No hidden fees, cancel anytime.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-black/20 border border-white/20 backdrop-blur-sm">
            <button
              onClick={() => setInterval("monthly")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                interval === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval("yearly")}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
                interval === "yearly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs text-emerald-400 font-bold">Save 33%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 bg-background -mt-8">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan) => {
              const price = interval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const perMonth = interval === "yearly" ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                    plan.highlighted
                      ? "bg-foreground text-background shadow-2xl md:scale-105 z-10"
                      : "bg-card text-card-foreground shadow-lg"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 rounded-full text-sm font-semibold gradient-button text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className={`text-sm mb-4 ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                      {plan.description}
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-extrabold">
                        {price === 0 ? "Free" : formatPrice(interval === "yearly" ? perMonth : price)}
                      </span>
                      {price > 0 && (
                        <span className={plan.highlighted ? "text-background/70" : "text-muted-foreground"}>
                          /month
                        </span>
                      )}
                    </div>
                    {interval === "yearly" && price > 0 && (
                      <p className={`text-xs mt-1 ${plan.highlighted ? "text-background/50" : "text-muted-foreground"}`}>
                        Billed {formatPrice(price)} per year
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                          plan.highlighted ? "bg-background/20" : "bg-primary/10"
                        }`}>
                          <Check className={`w-3 h-3 ${plan.highlighted ? "text-background" : "text-primary"}`} />
                        </div>
                        <span className={`text-sm ${plan.highlighted ? "text-background/90" : ""}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanClick(plan.id)}
                    className={`w-full py-6 font-semibold text-base ${
                      plan.highlighted
                        ? "bg-background text-foreground hover:bg-background/90"
                        : plan.id === "free"
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "gradient-button text-white hover:opacity-90"
                    }`}
                  >
                    {plan.id === "free" ? "Get Started Free" : `Subscribe to ${plan.name}`}
                  </Button>

                  {plan.id !== "free" && (
                    <p className={`text-center text-xs mt-3 ${plan.highlighted ? "text-background/40" : "text-muted-foreground/60"}`}>
                      Secure checkout powered by Stripe
                    </p>
                  )}
                </div>
              );
            })}
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
                <div className="text-sm text-muted-foreground">Free forever</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-primary">Pro</div>
                <div className="text-sm text-muted-foreground">{formatPrice(7)}/month</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-foreground">Business</div>
                <div className="text-sm text-muted-foreground">{formatPrice(23)}/month</div>
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
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Join thousands of creators and entrepreneurs using Share The Link.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-10 py-7 text-lg">
              <Link to="/signup">Start for Free</Link>
            </Button>
            <Button asChild size="lg" className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold px-10 py-7 text-lg rounded-lg transition-all duration-300">
              <Link to="/contact">Contact Sales</Link>
            </Button>
          </div>
          <p className="text-sm text-white/50 mt-6">
            Secure payments powered by Stripe. Cancel anytime.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
