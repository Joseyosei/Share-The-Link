import { useEffect, useRef, useState } from "react";
import { Play, Pause, Link2, BarChart3, Wand2, Share2, Globe, Radio, ChevronRight } from "lucide-react";

const DEMO_STEPS = [
  {
    label: "Create Your Profile",
    icon: Link2,
    color: "from-violet-500 to-purple-600",
    description: "Set up your bio, avatar, and custom username in seconds",
    screen: "profile",
  },
  {
    label: "Add Your Links",
    icon: Globe,
    color: "from-blue-500 to-cyan-500",
    description: "Add unlimited links to your social media, shop, and content",
    screen: "links",
  },
  {
    label: "AI Builds Your Page",
    icon: Wand2,
    color: "from-amber-500 to-orange-500",
    description: "Describe your brand and AI creates a stunning page instantly",
    screen: "ai",
  },
  {
    label: "Auto-Share Everywhere",
    icon: Share2,
    color: "from-green-500 to-emerald-500",
    description: "Schedule and share to Twitter, Facebook, LinkedIn, WhatsApp & Email",
    screen: "share",
  },
  {
    label: "Go Live & Earn",
    icon: Radio,
    color: "from-red-500 to-pink-500",
    description: "Stream live and accept tips with our 90/10 creator split",
    screen: "live",
  },
  {
    label: "Track Performance",
    icon: BarChart3,
    color: "from-indigo-500 to-violet-500",
    description: "See clicks, views, and engagement across all your links",
    screen: "analytics",
  },
];

function AnimatedScreen({ step }: { step: number }) {
  const current = DEMO_STEPS[step];

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg bg-gray-950">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-gray-800 rounded-md px-3 py-1 text-xs text-gray-400 text-center max-w-xs mx-auto">
            sharethelink.com/dashboard
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-6 h-full">
        {/* Sidebar + Content layout */}
        <div className="flex gap-4 h-full">
          {/* Mini sidebar */}
          <div className="w-14 flex flex-col gap-3 pt-2">
            {DEMO_STEPS.map((s, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 ${
                  i === step
                    ? `bg-gradient-to-br ${s.color} shadow-lg scale-110`
                    : "bg-gray-800/50"
                }`}
              >
                <s.icon className={`w-3.5 h-3.5 ${i === step ? "text-white" : "text-gray-600"}`} />
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 space-y-4">
            <div
              className="transition-all duration-700 ease-out"
              style={{ opacity: 1, transform: "translateY(0)" }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-lg`}>
                  <current.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-white text-sm font-semibold">{current.label}</h4>
                  <p className="text-gray-500 text-xs">{current.description}</p>
                </div>
              </div>

              {/* Animated content blocks */}
              <div className="space-y-3">
                {current.screen === "profile" && (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse" />
                      <div className="space-y-1.5 flex-1">
                        <div className="h-3 bg-gray-700 rounded-full w-32 animate-[shimmer_2s_ease-in-out_infinite]" />
                        <div className="h-2 bg-gray-800 rounded-full w-24" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {["Username", "Display Name", "Bio", "Category"].map((f, i) => (
                        <div key={f} className="bg-gray-800/60 rounded-lg p-2.5 border border-gray-700/40" style={{ animationDelay: `${i * 150}ms` }}>
                          <div className="text-[10px] text-gray-500 mb-1">{f}</div>
                          <div className={`h-2.5 rounded-full bg-gradient-to-r ${current.color} opacity-60`} style={{ width: `${60 + i * 10}%` }} />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {current.screen === "links" && (
                  <div className="space-y-2">
                    {["Instagram Profile", "YouTube Channel", "My Shop", "Newsletter"].map((l, i) => (
                      <div
                        key={l}
                        className="flex items-center gap-3 p-2.5 bg-gray-800/60 rounded-lg border border-gray-700/40 transition-all"
                        style={{ animationDelay: `${i * 100}ms`, opacity: 1, transform: "translateX(0)" }}
                      >
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-gray-300 flex-1">{l}</span>
                        <div className="text-[10px] text-gray-500">{Math.floor(Math.random() * 200 + 50)} clicks</div>
                      </div>
                    ))}
                  </div>
                )}

                {current.screen === "ai" && (
                  <div className="space-y-3">
                    <div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700/40">
                      <div className="text-[10px] text-gray-500 mb-2">AI Prompt</div>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-purple-400">{'>'}</span>
                        <span className="text-xs text-gray-300 typing-animation">{"I'm a fitness coach helping..."}</span>
                        <span className="w-0.5 h-3.5 bg-purple-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {["Minimal", "Bold", "Elegant"].map((t, i) => (
                        <div key={t} className={`rounded-lg p-2 text-center text-[10px] border ${i === 1 ? `border-purple-500 bg-purple-500/10 text-purple-400` : "border-gray-700/40 bg-gray-800/40 text-gray-500"}`}>
                          {t}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {current.screen === "share" && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[
                        { name: "Twitter", color: "bg-sky-500" },
                        { name: "Facebook", color: "bg-blue-600" },
                        { name: "LinkedIn", color: "bg-blue-700" },
                        { name: "WhatsApp", color: "bg-green-500" },
                        { name: "Email", color: "bg-orange-500" },
                      ].map((p, i) => (
                        <div key={p.name} className={`${p.color} w-8 h-8 rounded-full flex items-center justify-center shadow-lg`} style={{ animationDelay: `${i * 100}ms` }}>
                          <span className="text-[8px] text-white font-bold">{p.name[0]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-gray-800/60 rounded-lg p-3 border border-green-500/30">
                      <div className="flex items-center gap-2 text-xs text-green-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Scheduled for 3:00 PM today
                      </div>
                    </div>
                  </div>
                )}

                {current.screen === "live" && (
                  <div className="space-y-3">
                    <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-video flex items-center justify-center">
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        <span className="text-[10px] text-white font-semibold">LIVE</span>
                      </div>
                      <Radio className="w-8 h-8 text-gray-600 animate-pulse" />
                      <div className="absolute bottom-2 right-2 bg-green-600/90 px-2 py-0.5 rounded-full text-[10px] text-white">
                        $25 tips
                      </div>
                    </div>
                  </div>
                )}

                {current.screen === "analytics" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Views", val: "2,847" },
                        { label: "Clicks", val: "1,203" },
                        { label: "CTR", val: "42.3%" },
                      ].map((s) => (
                        <div key={s.label} className="bg-gray-800/60 rounded-lg p-2 text-center border border-gray-700/40">
                          <div className="text-xs font-bold text-white">{s.val}</div>
                          <div className="text-[10px] text-gray-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                    {/* Mini chart */}
                    <div className="flex items-end gap-1 h-14 px-2">
                      {[30, 50, 35, 70, 55, 80, 65, 90, 60, 85, 75, 95].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-indigo-600 to-violet-400 rounded-t-sm transition-all duration-500"
                          style={{ height: `${h}%`, animationDelay: `${i * 50}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ProductDemo() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % DEMO_STEPS.length);
      }, 4000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying]);

  const handleStepClick = (i: number) => {
    setActiveStep(i);
    setIsPlaying(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            See It In Action
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Everything you need, in one platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Watch how Share The Link helps creators and entrepreneurs build, share, and grow.
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          {/* Browser mockup */}
          <div className="rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-black/20 bg-gray-950">
            <div className="aspect-[16/9] relative">
              <AnimatedScreen step={activeStep} />

              {/* Play/Pause overlay */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label={isPlaying ? "Pause demo" : "Play demo"}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-white ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Step indicators */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
            {DEMO_STEPS.map((step, i) => (
              <button
                key={i}
                onClick={() => handleStepClick(i)}
                className={`group text-left p-3 rounded-xl border transition-all duration-300 ${
                  i === activeStep
                    ? "border-primary/40 bg-primary/5 shadow-md"
                    : "border-border/40 bg-card hover:border-primary/20 hover:bg-card/80"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-6 h-6 rounded-md bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                    <step.icon className="w-3 h-3 text-white" />
                  </div>
                  <ChevronRight className={`w-3 h-3 transition-transform duration-300 ${i === activeStep ? "text-primary rotate-90" : "text-muted-foreground"}`} />
                </div>
                <div className={`text-xs font-medium transition-colors ${i === activeStep ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </div>
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4 flex gap-1.5">
            {DEMO_STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    i < activeStep
                      ? "bg-primary w-full"
                      : i === activeStep && isPlaying
                      ? "bg-primary animate-[progress_4s_linear]"
                      : i === activeStep
                      ? "bg-primary w-full"
                      : "w-0"
                  }`}
                  style={i === activeStep && isPlaying ? { animation: "progress 4s linear" } : undefined}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add the CSS animation */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
