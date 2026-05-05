import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ProductDemo } from "@/components/landing/ProductDemo";
import { Features } from "@/components/landing/Features";
import { AIBuilderDemo } from "@/components/landing/AIBuilderDemo";
import { Pricing } from "@/components/landing/Pricing";
import { Reviews } from "@/components/landing/Reviews";
import { Footer } from "@/components/landing/Footer";
import { Link } from "react-router-dom";
import { ArrowRight, Radio, Wand2, Share2, Play, Eye, TrendingUp, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState, useCallback } from "react";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale").forEach((child) => {
              child.classList.add("revealed");
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const SHOWCASE_PROFILES = [
  {
    name: "Admin",
    username: "admin",
    description: "Share The Link official admin profile. Connecting people with one link.",
    link: "https://sharethelink.app/admin",
    avatar: "/logo.svg",
    bio: "Connecting People",
    location: "London, UK",
    badges: ["Verified"],
    socials: ["linkedin", "website"],
    views: "11",
  },
  {
    name: "Seen HQ",
    username: "seenhq",
    description: "The UK's leading short-form video promotion platform for local businesses. We film. We post. You get customers.",
    link: "https://sharethelink.app/seenhq",
    avatar: "",
    bio: "We film. We post. You get customers.",
    location: "London, UK",
    badges: ["Verified"],
    socials: ["twitter", "instagram", "youtube", "linkedin"],
    views: "109",
  },
];

const SOCIAL_ICON_MAP: Record<string, React.ReactNode> = {
  twitter: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
  instagram: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
  youtube: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
  linkedin: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>,
  website: <Globe className="w-4 h-4" />,
};

const ProfileShowcase = () => {
  const sectionRef = useScrollReveal();
  const [activeIndex, setActiveIndex] = useState(0);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    autoPlayRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SHOWCASE_PROFILES.length);
    }, 5000);
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); };
  }, [startAutoPlay]);

  const goTo = (index: number) => {
    setActiveIndex(index);
    startAutoPlay();
  };

  const prev = () => goTo((activeIndex - 1 + SHOWCASE_PROFILES.length) % SHOWCASE_PROFILES.length);
  const next = () => goTo((activeIndex + 1) % SHOWCASE_PROFILES.length);

  const profile = SHOWCASE_PROFILES[activeIndex];

  return (
    <section className="py-24 bg-muted/30" ref={sectionRef}>
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 scroll-reveal">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Live Profiles
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            See what creators are building
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Real profiles powered by Share The Link. Yours could be next.
          </p>
        </div>

        <div className="max-w-5xl mx-auto scroll-reveal-scale scroll-delay-2">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Phone mockup with profile preview card */}
            <div className="flex justify-center">
              <div
                className="relative w-[300px] sm:w-[320px] rounded-[2.5rem] overflow-hidden shadow-2xl border-[6px] border-gray-800 bg-[#0f1219]"
                style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.35)", aspectRatio: "9/18" }}
              >
                {/* Phone notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-800 rounded-b-xl z-10" />

                {/* Profile content inside phone */}
                <div
                  className="w-full h-full flex flex-col items-center pt-12 px-5 pb-6 overflow-hidden transition-opacity duration-500"
                  key={profile.username}
                  style={{ background: "linear-gradient(180deg, #171c2a 0%, #0f1219 100%)" }}
                >
                  {/* Glass card */}
                  <div className="w-full rounded-2xl p-5 flex flex-col items-center text-center"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      backdropFilter: "blur(20px)",
                    }}
                  >
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-white/10 border-[3px] border-white/20 flex items-center justify-center mb-3 overflow-hidden relative">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} className="w-12 h-12" />
                      ) : (
                        <span className="text-2xl font-bold text-white/70">{profile.name.charAt(0)}</span>
                      )}
                      <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-green-500 border-2 border-[#171c2a]" />
                    </div>

                    {/* Name & username */}
                    <h4 className="text-white font-bold text-lg tracking-wide">{profile.name.toUpperCase()}</h4>
                    <p className="text-white/50 text-sm mb-2">@{profile.username}</p>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-3">
                      {profile.badges.map((badge) => (
                        <span key={badge} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                          {badge}
                        </span>
                      ))}
                      <span className="text-white/30 text-xs">{profile.views} views</span>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1 text-white/40 text-xs mb-3">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {profile.location}
                    </div>

                    {/* Bio */}
                    <p className="text-white/60 text-sm leading-relaxed mb-4">{profile.bio}</p>

                    {/* Social icons */}
                    <div className="flex items-center gap-2">
                      {profile.socials.map((s) => (
                        <div key={s} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70">
                          {SOCIAL_ICON_MAP[s] || null}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA button */}
                  <a
                    href={profile.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 w-full py-3 rounded-xl text-center text-white font-semibold text-sm"
                    style={{ background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)" }}
                  >
                    Visit Live Profile
                  </a>
                </div>
              </div>
            </div>

            {/* Profile info & carousel controls */}
            <div className="text-center md:text-left space-y-6">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-2">{profile.name}</h3>
                <p className="text-muted-foreground text-base">@{profile.username}</p>
              </div>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {profile.description}
              </p>
              <a
                href={profile.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-button text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Visit Profile
                <ArrowRight className="w-4 h-4" />
              </a>

              {/* Carousel controls */}
              <div className="flex items-center gap-4 justify-center md:justify-start pt-4">
                <button
                  onClick={prev}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  aria-label="Previous profile"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <div className="flex items-center gap-2">
                  {SHOWCASE_PROFILES.map((p, i) => (
                    <button
                      key={p.username}
                      onClick={() => goTo(i)}
                      className={`transition-all duration-300 rounded-full ${
                        i === activeIndex
                          ? "w-8 h-3 bg-primary"
                          : "w-3 h-3 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                      aria-label={`View ${p.name} profile`}
                    />
                  ))}
                </div>
                <button
                  onClick={next}
                  className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                  aria-label="Next profile"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const HowItWorks = () => {
  const { t } = useTranslation();
  const sectionRef = useScrollReveal();
  return (
    <section className="py-24 bg-muted/50" ref={sectionRef}>
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 scroll-reveal">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            {t("howItWorks.badge")}
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            {t("howItWorks.title")}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            {
              icon: Wand2,
              step: "01",
              title: t("howItWorks.step1Title"),
              desc: t("howItWorks.step1Desc"),
            },
            {
              icon: Share2,
              step: "02",
              title: t("howItWorks.step2Title"),
              desc: t("howItWorks.step2Desc"),
            },
            {
              icon: Radio,
              step: "03",
              title: t("howItWorks.step3Title"),
              desc: t("howItWorks.step3Desc"),
            },
          ].map((item, i) => (
            <div key={item.step} className={`relative text-center group scroll-reveal scroll-delay-${i + 1}`}>
              <div className="w-16 h-16 rounded-2xl gradient-button flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <span className="text-5xl font-extrabold text-muted-foreground/10 absolute -top-4 left-1/2 -translate-x-1/2">
                {item.step}
              </span>
              <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MediaShowcase = () => {
  const { t } = useTranslation();
  const sectionRef = useScrollReveal();
  const SAMPLE_MEDIA = [
    { title: "How I Grew to 100K Followers", creator: "Alex Rivera", views: "12.4K", type: "Recording", image: "/images/media-thumb-1.jpg" },
    { title: "Sunday Service Live", creator: "Grace Church", views: "3.2K", type: "Live Stream", image: "/images/media-thumb-2.jpg" },
    { title: "Product Launch Event", creator: "TechStartup", views: "8.7K", type: "Recording", image: "/images/media-thumb-3.jpg" },
    { title: "Music Production Session", creator: "DJ Pulse", views: "5.1K", type: "Live Stream", image: "/images/media-thumb-4.jpg" },
    { title: "Fitness Workshop Q&A", creator: "Coach Pro", views: "2.9K", type: "Recording", image: "/images/media-thumb-5.jpg" },
    { title: "Art & Design Process", creator: "Creative Studio", views: "4.3K", type: "Recording", image: "/images/media-thumb-6.jpg" },
  ];

  return (
    <section className="py-24 bg-background" ref={sectionRef}>
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 scroll-reveal">
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Play className="w-4 h-4" />
              {t("mediaShowcase.badge")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              {t("mediaShowcase.title")}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg leading-relaxed">
              {t("mediaShowcase.description")}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="mt-4 md:mt-0 rounded-full px-6"
          >
            <Link to="/media">
              {t("mediaShowcase.browseAll")}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SAMPLE_MEDIA.map((item, i) => (
            <Link
              key={item.title}
              to="/media"
              className={`group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300 scroll-reveal-scale scroll-delay-${Math.min(i + 1, 5)}`}
            >
              <div className="relative aspect-video bg-muted flex items-center justify-center overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                <div className="relative w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-6 h-6 text-white ml-0.5" />
                </div>
                {item.type === "Live Stream" && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2.5 py-1 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-semibold text-white">{t("mediaShowcase.live")}</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors truncate">
                  {item.title}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{item.creator}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {item.views} {t("mediaShowcase.views")}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {t("mediaShowcase.trending")}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const CTASection = () => {
  const { t } = useTranslation();
  const sectionRef = useScrollReveal();
  return (
    <section className="py-24 gradient-hero relative" ref={sectionRef}>
      <div className="container mx-auto px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 text-balance scroll-reveal">
          {t("cta.title")}
        </h2>
        <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed scroll-reveal scroll-delay-1">
          {t("cta.description")}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-10 py-7 text-lg hover-lift"
          >
            <Link to="/signup">
              {t("cta.startFree")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="border-2 border-white/40 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold px-10 py-7 text-lg rounded-lg transition-all duration-300"
          >
            <Link to="/pricing">{t("cta.viewPricing")}</Link>
          </Button>
        </div>
        <p className="text-sm text-white/50 mt-6">
          {t("cta.noCreditCard")}
        </p>
      </div>
    </section>
  );
};

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <ProfileShowcase />
      <ProductDemo />
      <Features />
      <HowItWorks />
      <MediaShowcase />
      <AIBuilderDemo />
      <Reviews />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
