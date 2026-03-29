import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const EXAMPLE_USERNAMES = [
  "yourname", "johndoe", "sarahcreates", "musicbyjay", "designbylisa",
  "fitbyalex", "thebakery", "codewithme", "artbynova", "drstyle",
  "podcastpro", "growwithem",
];

export const Hero = () => {
  const [username, setUsername] = useState("");
  const [typedText, setTypedText] = useState("");
  const [isUserTyping, setIsUserTyping] = useState(false);

  // Typewriter animation
  useEffect(() => {
    if (isUserTyping) return;

    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    const tick = () => {
      const currentWord = EXAMPLE_USERNAMES[currentIndex];
      if (!isDeleting) {
        charIndex++;
        setTypedText(currentWord.slice(0, charIndex));
        if (charIndex === currentWord.length) {
          timeout = setTimeout(() => { isDeleting = true; tick(); }, 2000);
          return;
        }
        timeout = setTimeout(tick, 100 + Math.random() * 50);
      } else {
        charIndex--;
        setTypedText(currentWord.slice(0, charIndex));
        if (charIndex === 0) {
          isDeleting = false;
          currentIndex = (currentIndex + 1) % EXAMPLE_USERNAMES.length;
          timeout = setTimeout(tick, 400);
          return;
        }
        timeout = setTimeout(tick, 50);
      }
    };

    timeout = setTimeout(tick, 600);
    return () => clearTimeout(timeout);
  }, [isUserTyping]);

  // Horizontal scroll navigation
  const scrollToSection = (direction: "left" | "right") => {
    const sections = document.querySelectorAll("section[id]");
    const scrollY = window.scrollY + window.innerHeight / 2;
    let currentIdx = 0;

    sections.forEach((section, i) => {
      if ((section as HTMLElement).offsetTop <= scrollY) currentIdx = i;
    });

    const targetIdx = direction === "left"
      ? Math.max(0, currentIdx - 1)
      : Math.min(sections.length - 1, currentIdx + 1);

    sections[targetIdx]?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="relative min-h-screen bg-black flex items-center pt-24 pb-16 overflow-hidden">
      {/* Cinematic background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-primary/8 via-violet-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[300px] bg-gradient-to-tl from-primary/5 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Left/Right scroll arrows */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex gap-2 pb-[env(safe-area-inset-bottom)]">
        <button
          onClick={() => scrollToSection("left")}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/20 shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          aria-label="Previous section"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scrollToSection("right")}
          className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/70 hover:text-white hover:bg-white/20 shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
          aria-label="Next section"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Tagline */}
          <p className="text-xs sm:text-sm uppercase tracking-[0.3em] text-white/40 mb-8 font-medium animate-fade-in">
            The link-in-bio platform for creators
          </p>

          {/* Hero headline - a16z style bold serif-like */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white leading-[0.95] mb-8 animate-fade-in stagger-1 tracking-tight">
            One link to share
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-400 to-primary bg-clip-text text-transparent">
              everything
            </span>{" "}
            you create
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-12 animate-fade-in stagger-2 leading-relaxed font-light">
            Products, content, and brand — all in one beautiful page.
            AI-powered. Built for entrepreneurs.
          </p>

          {/* Username claim input */}
          <div className="max-w-lg mx-auto mb-10 animate-fade-in stagger-3">
            <div className="flex items-center bg-white/5 backdrop-blur-lg rounded-2xl p-2 border border-white/10 hover:border-white/20 transition-colors">
              <span className="text-white/30 pl-4 text-sm whitespace-nowrap font-mono">
                sharethelink.app/
              </span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                    setIsUserTyping(true);
                  }}
                  onFocus={() => setIsUserTyping(true)}
                  onBlur={() => { if (!username) setIsUserTyping(false); }}
                  className="w-full bg-transparent text-white font-medium px-1 py-3.5 focus:outline-none text-sm font-mono"
                />
                {!username && !isUserTyping && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none text-white/25 font-medium text-sm font-mono">
                    {typedText}
                    <span className="inline-block w-[2px] h-[1em] bg-white/40 ml-[1px] align-middle animate-pulse" />
                  </span>
                )}
              </div>
              <Button
                asChild
                className="bg-white text-black hover:bg-white/90 font-semibold rounded-xl px-6"
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
              className="bg-white text-black hover:bg-white/90 font-semibold px-10 py-7 text-base rounded-xl"
            >
              <Link to="/signup">
                Get started free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="border border-white/20 text-white bg-white/5 hover:bg-white/10 backdrop-blur-sm font-medium px-10 py-7 text-base rounded-xl transition-all duration-300"
            >
              <a href="#pricing">View pricing</a>
            </Button>
          </div>

          {/* Trust text */}
          <p className="text-sm text-white/30 animate-fade-in stagger-4 tracking-wide">
            No credit card required &middot; Free forever plan
          </p>

          {/* Product Hunt Badge */}
          <div className="mt-10 animate-fade-in stagger-4">
            <a
              href="https://www.producthunt.com/products/share-the-link?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-share-the-link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-80 transition-opacity"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1100684&theme=dark&t=1773744898498"
                alt="Share The Link on Product Hunt"
                width="250"
                height="54"
                className="mx-auto"
              />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
    </section>
  );
};
