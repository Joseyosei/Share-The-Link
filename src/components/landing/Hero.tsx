import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const Hero = () => {
  const [username, setUsername] = useState("");

  return (
    <section className="relative min-h-screen gradient-bg flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card-light mb-8 animate-fade-in shimmer">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">
              Built for Entrepreneurs & Creators
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight mb-6 animate-fade-in stagger-1">
            One link to share
            <br />
            everything you create
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 animate-fade-in stagger-2">
            The ultimate link-in-bio platform for founders and creators.
            Showcase your products, content, and brand in one beautiful page.
          </p>

          {/* Username Preview */}
          <div className="max-w-md mx-auto mb-8 animate-fade-in stagger-3">
            <div className="flex items-center bg-primary-foreground/10 backdrop-blur-lg rounded-xl p-2 border border-primary-foreground/20">
              <span className="text-primary-foreground/60 pl-4 text-sm md:text-base">
                sharethelink.com/
              </span>
              <input
                type="text"
                placeholder="yourname"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                className="flex-1 bg-transparent text-primary-foreground font-medium px-1 py-3 focus:outline-none text-sm md:text-base"
              />
              <Button
                asChild
                className="bg-white text-gray-900 hover:bg-white/90 font-semibold"
              >
                <Link to="/signup">
                  Claim
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in stagger-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-8 py-6 text-lg hover-lift"
            >
              <Link to="/signup">
                Get started free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-6 text-lg rounded-lg transition-all duration-300"
            >
              <a href="#pricing">View pricing</a>
            </Button>
          </div>

          {/* Trust text */}
          <p className="text-sm text-primary-foreground/60 animate-fade-in stagger-4">
            No credit card required • Free forever plan
          </p>
        </div>
      </div>
    </section>
  );
};
