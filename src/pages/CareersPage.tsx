import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { MapPin, Clock, Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const openings = [
  {
    title: "Senior Frontend Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build beautiful, performant user interfaces for millions of creators.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description: "Shape the future of how creators share their content online.",
  },
  {
    title: "Growth Marketing Manager",
    department: "Marketing",
    location: "Remote",
    type: "Full-time",
    description: "Drive user acquisition and engagement through creative marketing strategies.",
  },
  {
    title: "Customer Success Lead",
    department: "Support",
    location: "Remote",
    type: "Full-time",
    description: "Help our users succeed and build lasting relationships with creators.",
  },
];

const benefits = [
  "Competitive salary & equity",
  "Remote-first culture",
  "Unlimited PTO",
  "Health, dental & vision",
  "Learning & development budget",
  "Home office setup allowance",
  "Annual team retreats",
  "Parental leave",
];

const CareersPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Join Our Team
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Help us empower creators and entrepreneurs around the world.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Why Work With Us
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {benefits.map((benefit) => (
              <div key={benefit} className="bg-card rounded-xl p-4 text-center shadow-sm">
                <p className="text-foreground font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Open Positions
          </h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {openings.map((job) => (
              <div key={job.title} className="group bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                      {job.department}
                    </span>
                    <h3 className="text-xl font-bold text-foreground mb-2">{job.title}</h3>
                    <p className="text-muted-foreground mb-3">{job.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <Button className="gradient-button text-primary-foreground hover:opacity-90 group-hover:translate-x-1 transition-transform">
                    Apply
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CareersPage;
