import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Shield, Lock, Eye, Server, CheckCircle } from "lucide-react";

const SecurityPage = () => {
  const securityFeatures = [
    {
      icon: Lock,
      title: "SSL Encryption",
      description: "All data transmitted between you and our servers is encrypted using industry-standard TLS 1.3 encryption.",
    },
    {
      icon: Server,
      title: "Secure Infrastructure",
      description: "Our infrastructure is hosted on enterprise-grade cloud providers with SOC 2 Type II certification.",
    },
    {
      icon: Eye,
      title: "Privacy by Design",
      description: "We follow privacy-by-design principles, collecting only the data necessary to provide our services.",
    },
    {
      icon: Shield,
      title: "Regular Audits",
      description: "We conduct regular security audits and penetration testing to identify and fix vulnerabilities.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-foreground/10 mx-auto mb-6 flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Security at Share The Link
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Your security is our top priority. Learn how we protect your data.
          </p>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {securityFeatures.map((feature) => (
              <div key={feature.title} className="bg-card rounded-2xl p-8 shadow-lg">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-primary to-secondary mb-4 flex items-center justify-center">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-24 bg-muted">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">
            Compliance & Certifications
          </h2>
          <div className="max-w-3xl mx-auto bg-card rounded-2xl p-8 shadow-lg">
            <div className="space-y-4">
              {[
                "GDPR compliant data processing",
                "CCPA compliant for California residents",
                "SOC 2 Type II certified infrastructure",
                "Regular third-party security audits",
                "99.9% uptime SLA guarantee",
                "24/7 security monitoring",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Report Vulnerability */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Report a Vulnerability
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Found a security issue? We appreciate your help in keeping Share The Link safe. 
            Please report any vulnerabilities to our security team.
          </p>
          <a 
            href="mailto:security@sharethelink.com"
            className="inline-block px-8 py-4 rounded-xl gradient-button text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            security@sharethelink.com
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SecurityPage;
