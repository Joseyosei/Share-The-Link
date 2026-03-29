import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
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

  return (
    <div className="relative h-full w-full gradient-hero flex items-center overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-card-light mb-8 animate-fade-in shimmer">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium text-white">
              Built for Entrepreneurs & Creators
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary-foreground leading-[1.1] mb-6 animate-fade-in stagger-1 tracking-tight">
            One link to share
            <br />
            everything you create
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 max-w-xl mx-auto mb-10 animate-fade-in stagger-2 leading-relaxed">
            The link-in-bio platform for creators. Products, content, and brand — all in one page.
          </p>

          {/* Username claim input */}
          <div className="max-w-md mx-auto mb-8 animate-fade-in stagger-3">
            <div className="flex items-center bg-primary-foreground/10 backdrop-blur-lg rounded-2xl p-2 border border-primary-foreground/20">
              <span className="text-primary-foreground/60 pl-4 text-sm whitespace-nowrap">
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
                  className="w-full bg-transparent text-primary-foreground font-medium px-1 py-3 focus:outline-none text-sm"
                />
                {!username && !isUserTyping && (
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none text-primary-foreground/40 font-medium text-sm">
                    {typedText}
                    <span className="inline-block w-[2px] h-[1em] bg-primary-foreground/60 ml-[1px] align-middle animate-pulse" />
                  </span>
                )}
              </div>
              <Button
                asChild
                className="bg-white text-gray-900 hover:bg-white/90 font-semibold rounded-xl"
              >
                <Link to="/signup">
                  Claim
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 animate-fade-in stagger-4">
            <Button
              asChild
              size="lg"
              className="bg-white text-gray-900 hover:bg-white/90 font-semibold px-8 py-6 text-base hover-lift rounded-xl"
            >
              <Link to="/signup">
                Get started free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              asChild
              className="border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-6 text-base rounded-xl transition-all duration-300"
            >
              <Link to="/pricing">View pricing</Link>
            </Button>
          </div>

          {/* Trust text */}
          <p className="text-sm text-primary-foreground/60 animate-fade-in stagger-4">
            No credit card required • Free forever plan
          </p>

          {/* Product Hunt Badge */}
          <div className="mt-8 animate-fade-in stagger-4">
            <a
              href="https://www.producthunt.com/products/share-the-link?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-share-the-link"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-90 transition-opacity"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1100684&theme=light&t=1773744898498"
                alt="Share The Link on Product Hunt"
                width="250"
                height="54"
                className="mx-auto"
              />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
