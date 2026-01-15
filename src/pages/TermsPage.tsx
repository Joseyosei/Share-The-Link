import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

const TermsPage = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 gradient-hero">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
            Terms of Service
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
            Last updated: January 15, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto prose prose-lg">
            <div className="bg-card rounded-2xl p-8 shadow-lg space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using Share The Link, you agree to be bound by these Terms of Service. 
                  If you disagree with any part of these terms, you may not access our service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">2. Description of Service</h2>
                <p className="text-muted-foreground">
                  Share The Link provides a platform for users to create customizable link-in-bio pages 
                  to share their content, products, and social profiles.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">3. User Accounts</h2>
                <p className="text-muted-foreground">
                  You are responsible for maintaining the confidentiality of your account credentials 
                  and for all activities that occur under your account. You must notify us immediately 
                  of any unauthorized use.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">4. Acceptable Use</h2>
                <p className="text-muted-foreground mb-4">
                  You agree not to:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Use the service for any illegal purpose</li>
                  <li>Post content that infringes on intellectual property rights</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Impersonate any person or entity</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">5. Content Ownership</h2>
                <p className="text-muted-foreground">
                  You retain ownership of all content you create. By using our service, you grant us 
                  a license to display and distribute your content as necessary to provide the service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">6. Termination</h2>
                <p className="text-muted-foreground">
                  We may terminate or suspend your account at any time for violations of these terms 
                  or for any other reason at our sole discretion.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">7. Limitation of Liability</h2>
                <p className="text-muted-foreground">
                  Share The Link shall not be liable for any indirect, incidental, special, or 
                  consequential damages arising from your use of the service.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-foreground mb-4">8. Contact</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms, please contact legal@sharethelink.com.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TermsPage;
