import { useState, useRef, useEffect } from "react";
import { Play, Film } from "lucide-react";

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
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const TABS = [
  { id: "overview", label: "Platform Overview", duration: "0:39" },
  { id: "walkthrough", label: "Full Walkthrough", duration: "1:12" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export const PlatformVideos = () => {
  const sectionRef = useScrollReveal();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);

  const switchTab = (tab: TabId) => {
    setActiveTab(tab);
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    try {
      iframe.contentWindow.postMessage({ type: "stl-switch-channel", channel: tab }, "*");
    } catch {
      // cross-origin fallback: reload with hash
      iframe.src = `/share-the-link-motion.html#${tab}`;
    }
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden" ref={sectionRef}>
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30 pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 scroll-reveal">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Film className="w-4 h-4" />
            Watch How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            See Share The Link in action
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A motion overview and step-by-step walkthrough of the platform. Watch how you can go from idea to live campaign in 30 seconds.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 scroll-reveal scroll-delay-1">
          <div className="inline-flex gap-1.5 p-1.5 rounded-full bg-muted border border-border">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === tab.id
                    ? "gradient-button text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${activeTab === tab.id ? "text-white" : ""}`} />
                {tab.label}
                <span className={`text-xs ${activeTab === tab.id ? "text-white/70" : "text-muted-foreground/60"}`}>
                  {tab.duration}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Video Player */}
        <div className="max-w-5xl mx-auto scroll-reveal-scale scroll-delay-2">
          <div className="relative rounded-2xl overflow-hidden border border-border shadow-2xl bg-black" style={{ aspectRatio: "16/9" }}>
            {!loaded && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-[#6d4fe8] via-[#e2559c] to-[#f3904d]">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center mb-4 animate-pulse">
                  <Play className="w-7 h-7 text-white ml-0.5" />
                </div>
                <p className="text-white/80 text-sm font-medium">Loading player...</p>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={`/share-the-link-motion.html#${activeTab}`}
              title={`Share The Link ${activeTab === "overview" ? "Platform Overview" : "Full Walkthrough"}`}
              className="w-full h-full border-0"
              style={{ aspectRatio: "16/9" }}
              allow="fullscreen"
              onLoad={() => setLoaded(true)}
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              {activeTab === "overview"
                ? "A 39-second overview of everything Share The Link offers — from AI page building to live streaming."
                : "A full walkthrough: claim your name, build with AI, share to 7 platforms, go live, and track your growth."}
            </p>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Interactive — click play to start
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
