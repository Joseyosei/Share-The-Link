import { Link } from "react-router-dom";
import { Twitter, Instagram, Youtube, Github, Linkedin, Send, Settings } from "lucide-react";
import { Logo } from "@/components/Logo";

const footerLinks = {
  Product: [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Integrations", href: "/integrations" },
    { name: "Changelog", href: "/changelog" },
    { name: "AI Page Builder", href: "/ai-builder" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
    { name: "Team", href: "/team" },
  ],
  Legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Security", href: "/security" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "https://x.com/sharethelink", label: "X (Twitter)" },
  { icon: Instagram, href: "https://instagram.com/sharethelink", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com/@sharethelink", label: "YouTube" },
  { icon: Github, href: "https://github.com/Joseyosei/Share-The-Link", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/company/sharethelink", label: "LinkedIn" },
  { icon: Send, href: "https://t.me/sharethelink", label: "Telegram" },
];

export const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16 relative overflow-hidden">
      {/* Subtle gradient accent at the top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <Logo textClassName="text-background" />
            </Link>
            <p className="text-background/70 mb-6 max-w-sm leading-relaxed">
              The ultimate link-in-bio platform for entrepreneurs and creators.
              Share everything in one beautiful page. AI-powered, with built-in
              live streaming and monetization.
            </p>

            {/* Social links */}
            <div className="flex flex-wrap gap-3">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-primary/30 hover:scale-110 transition-all duration-300"
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                );
              })}
            </div>

            {/* User attach prompt */}
            <div className="mt-6 p-4 rounded-xl bg-background/5 border border-background/10">
              <p className="text-sm text-background/60 mb-2">
                Add your social links to your profile
              </p>
              <Link
                to="/signup"
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
              >
                Create your page for free
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4 text-background">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-background/60 hover:text-background transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/40 text-sm">
            &copy; {new Date().getFullYear()} Share The Link. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-background/40 text-sm hover:text-background/70 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-background/40 text-sm hover:text-background/70 transition-colors">
              Terms
            </Link>
            <p className="text-background/40 text-sm">
              Made with <span className="text-pink-400">&#9829;</span> for creators worldwide
            </p>
            <Link
              to="/admin"
              className="text-background/20 hover:text-background/50 transition-colors"
              aria-label="Admin panel"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
