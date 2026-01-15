import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Users, Heart, Globe, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            About Share The Link
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            We're on a mission to help creators and entrepreneurs share their world with one simple link.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Our Story
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Share The Link was born from a simple frustration: social media profiles only allow one link. 
              We saw creators, entrepreneurs, and businesses struggling to share everything they do in a 
              single bio link.
            </p>
            <p className="text-lg text-muted-foreground mb-6">
              So we built the solution. A beautiful, customizable link-in-bio page that lets you share 
              all your content, products, and social profiles in one place.
            </p>
            <p className="text-lg text-muted-foreground">
              Today, thousands of creators worldwide use Share The Link to grow their audience and 
              monetize their content.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-16">
            What We Stand For
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Creator First", description: "Everything we build is designed with creators in mind." },
              { icon: Heart, title: "Simplicity", description: "Powerful features that are easy to use." },
              { icon: Globe, title: "Accessibility", description: "Your content should be accessible to everyone." },
              { icon: Zap, title: "Performance", description: "Lightning fast pages that load instantly." },
            ].map((value) => (
              <div key={value.title} className="bg-card rounded-2xl p-8 text-center shadow-lg">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-primary to-secondary mx-auto mb-4 flex items-center justify-center">
                  <value.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-6">
            Join Our Community
          </h2>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Start sharing your world with one beautiful link today.
          </p>
          <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link to="/signup">Get Started Free</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutPage;
