import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { Twitter, Instagram, Youtube, Github } from "lucide-react";
import { Logo } from "@/components/Logo";

const footerLinks = {
  Product: [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Integrations", href: "/integrations" },
    { name: "Changelog", href: "/changelog" },
  ],
  Company: [
    { name: "About", href: "/about" },
    { name: "Blog", href: "/blog" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
  ],
  Legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Security", href: "/security" },
  ],
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
  { icon: Github, href: "#", label: "GitHub" },
];

export const Footer = forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>((props, ref) => {
  return (
    <footer ref={ref} className="bg-foreground text-background py-16" {...props}>
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4"><Logo textClassName="text-background" /></Link>
            <p className="text-background/70 mb-6 max-w-sm">The ultimate link-in-bio platform for entrepreneurs and creators. Share everything in one beautiful page.</p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label} className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link to={link.href} className="text-background/70 hover:text-background transition-colors">{link.name}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/50 text-sm">© {new Date().getFullYear()} Share The Link. All rights reserved.</p>
          <p className="text-background/50 text-sm">Made with ❤️ for creators worldwide</p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";
