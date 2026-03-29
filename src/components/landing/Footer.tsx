import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Github, Linkedin, Settings, X } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

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
  ],
  Legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Security", href: "/security" },
  ],
};

const socialLinks = [
  { icon: XIcon, href: "https://x.com/sharethelink", label: "X" },
  { icon: InstagramIcon, href: "https://instagram.com/sharethelink", label: "Instagram" },
  { icon: YouTubeIcon, href: "https://youtube.com/@sharethelink", label: "YouTube" },
  { icon: Github, href: "https://github.com/Joseyosei/Share-The-Link", label: "GitHub" },
  { icon: Linkedin, href: "https://linkedin.com/company/sharethelink", label: "LinkedIn" },
  { icon: TelegramIcon, href: "https://t.me/sharethelink", label: "Telegram" },
];

// ── Countdown Timer Component ──
const CountdownTimer = ({ targetDate }: { targetDate: string }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calcTime = () => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };
    setTimeLeft(calcTime());
    const timer = setInterval(() => setTimeLeft(calcTime()), 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const blocks = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Min", value: timeLeft.minutes },
    { label: "Sec", value: timeLeft.seconds },
  ];

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {blocks.map((block, i) => (
        <div key={block.label} className="flex items-center gap-2 sm:gap-3">
          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
              {String(block.value).padStart(2, "0")}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/30 mt-0.5">{block.label}</span>
          </div>
          {i < blocks.length - 1 && <span className="text-xl text-white/20 font-light">:</span>}
        </div>
      ))}
    </div>
  );
};

export const Footer = () => {
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [launchDate, setLaunchDate] = useState("2026-09-01T00:00:00Z");
  const [clickedStore, setClickedStore] = useState<"ios" | "android">("ios");

  useEffect(() => {
    const loadLaunchDate = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "app_launch_date")
          .single();
        if (data?.value && (data.value as any).date) {
          setLaunchDate((data.value as any).date);
        }
      } catch { /* use default */ }
    };
    loadLaunchDate();
  }, []);

  const handleStoreClick = (store: "ios" | "android") => {
    setClickedStore(store);
    setShowComingSoon(true);
  };

  return (
    <footer className="bg-black text-white border-t border-white/[0.06] relative overflow-hidden">
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

      <div className="container mx-auto px-6 pt-20 pb-12 relative z-10">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-5">
              <Logo textClassName="text-white" />
            </Link>
            <p className="text-white/30 mb-8 max-w-sm leading-relaxed text-sm">
              The ultimate link-in-bio platform for entrepreneurs and creators.
              Share everything in one beautiful page. AI-powered, with built-in
              live streaming and monetization.
            </p>

            {/* Social links */}
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center hover:bg-white/10 hover:border-white/15 transition-all duration-300"
                  >
                    <IconComponent className="w-4 h-4 text-white/40" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-xs uppercase tracking-[0.2em] text-white/20 mb-5 font-medium">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-white/40 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* App Store Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-8 mb-8 border-b border-white/[0.06]">
          <span className="text-xs text-white/20 uppercase tracking-[0.2em]">Get the app</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleStoreClick("ios")}
              className="flex items-center gap-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl px-4 py-2.5 transition-all hover:border-white/15"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-white/50" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div className="text-left">
                <p className="text-[10px] text-white/30 leading-none">Download on the</p>
                <p className="text-sm font-medium text-white/60 leading-tight">App Store</p>
              </div>
            </button>

            <button
              onClick={() => handleStoreClick("android")}
              className="flex items-center gap-2.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl px-4 py-2.5 transition-all hover:border-white/15"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current text-white/50" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.196 12l2.502-2.492zM5.864 2.658L16.8 9.99l-2.301 2.302L5.864 2.658z"/>
              </svg>
              <div className="text-left">
                <p className="text-[10px] text-white/30 leading-none">GET IT ON</p>
                <p className="text-sm font-medium text-white/60 leading-tight">Google Play</p>
              </div>
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/20 text-xs tracking-wide">
            &copy; {new Date().getFullYear()} Share The Link. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link to="/privacy" className="text-white/20 text-xs hover:text-white/40 transition-colors">
              Privacy
            </Link>
            <Link to="/terms" className="text-white/20 text-xs hover:text-white/40 transition-colors">
              Terms
            </Link>
            <p className="text-white/15 text-xs hidden sm:block">
              Made with <span className="text-pink-400/60">&#9829;</span> for creators worldwide
            </p>
            <Link
              to="/dashboard/admin"
              className="text-white/10 hover:text-white/30 transition-colors"
              aria-label="Admin panel"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Coming Soon Modal ── */}
      {showComingSoon && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowComingSoon(false)} />
          <div className="relative bg-gray-950 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl border border-white/10">
            <button
              onClick={() => setShowComingSoon(false)}
              className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              {clickedStore === "ios" ? (
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-white/60" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-white/60" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302a1 1 0 0 1 0 1.38l-2.302 2.302L15.196 12l2.502-2.492zM5.864 2.658L16.8 9.99l-2.301 2.302L5.864 2.658z"/>
                </svg>
              )}
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Coming Soon</h2>
            <p className="text-white/40 mb-6 text-sm">
              The Share The Link {clickedStore === "ios" ? "iOS" : "Android"} app is on its way. Be the first to know when it launches.
            </p>

            <div className="bg-white/[0.03] rounded-xl p-5 mb-6 border border-white/[0.06]">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 mb-3">Launching in</p>
              <div className="flex justify-center">
                <CountdownTimer targetDate={launchDate} />
              </div>
              <p className="text-xs text-white/20 mt-3">
                {new Date(launchDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <Link
              to="/signup"
              onClick={() => setShowComingSoon(false)}
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors w-full text-sm"
            >
              Sign Up for Early Access
            </Link>
          </div>
        </div>
      )}
    </footer>
  );
};
