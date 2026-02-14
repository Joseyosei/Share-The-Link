import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuideStep {
  sidebarLabel: string;
  title: string;
  description: string;
  tip: string;
  route: string;
}

const STEPS: GuideStep[] = [
  {
    sidebarLabel: "Dashboard",
    title: "Your Command Center",
    description: "See all your stats, links, and a live preview of your public profile at a glance.",
    tip: "Check your dashboard daily to track click growth.",
    route: "/dashboard",
  },
  {
    sidebarLabel: "Links",
    title: "Manage Your Links",
    description: "Add, edit, reorder, and schedule auto-shares for all your important links.",
    tip: "Use the toggle to temporarily hide links without deleting them.",
    route: "/dashboard/links",
  },
  {
    sidebarLabel: "Live Streaming",
    title: "Go Live Instantly",
    description: "Stream directly to your audience using your camera or screen. Earn tips from viewers in real-time.",
    tip: "Past streams are automatically recorded so fans can replay them.",
    route: "/streaming",
  },
  {
    sidebarLabel: "Media",
    title: "Your Content Library",
    description: "Browse and watch live streams and recorded content from all creators on the platform.",
    tip: "The mini-player lets you keep watching while browsing other pages.",
    route: "/media",
  },
  {
    sidebarLabel: "AI Builder",
    title: "AI-Powered Pages",
    description: "Describe your business and our AI will generate a professional link page for you in seconds.",
    tip: "Try prompts like 'I'm a photographer' or 'I run a bakery'.",
    route: "/ai-builder",
  },
  {
    sidebarLabel: "My Shop",
    title: "Sell Your Products",
    description: "List digital products, services, or merchandise for your audience to discover and purchase.",
    tip: "Add an external purchase link (Gumroad, Shopify, etc.) for each product.",
    route: "/connect",
  },
  {
    sidebarLabel: "Appearance",
    title: "Customize Your Look",
    description: "Choose from beautiful themes, customize colors, fonts, and button styles for your public profile.",
    tip: "Preview changes in real-time before publishing.",
    route: "/dashboard/appearance",
  },
  {
    sidebarLabel: "Analytics",
    title: "Track Performance",
    description: "See detailed click analytics, visitor data, and performance trends for all your links.",
    tip: "Use analytics to identify which links resonate most with your audience.",
    route: "/dashboard/analytics",
  },
  {
    sidebarLabel: "Settings",
    title: "Account Settings",
    description: "Update your profile photo, name, bio, social handles, and change your password.",
    tip: "Add all your social media handles to display them on your public profile.",
    route: "/dashboard/settings",
  },
  {
    sidebarLabel: "Help",
    title: "Help & Support",
    description: "Find answers to common questions, watch video tutorials, and contact our support team.",
    tip: "You can reopen this guide anytime from the Help page or the floating button.",
    route: "/help",
  },
];

const STORAGE_KEY = "stl-guide-seen";

export const NavigationGuide = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  // Find and highlight the current sidebar nav item
  const updateHighlight = useCallback(() => {
    if (!isOpen) {
      setHighlightRect(null);
      return;
    }
    const label = STEPS[currentStep].sidebarLabel;
    // Search through all anchor elements in sidebar
    const allLinks = document.querySelectorAll("aside a, nav a");
    let found: HTMLElement | null = null;
    allLinks.forEach((el) => {
      const text = el.textContent?.trim() || "";
      if (text.includes(label) && !found) {
        found = el as HTMLElement;
      }
    });
    if (found) {
      setHighlightRect(found.getBoundingClientRect());
    } else {
      setHighlightRect(null);
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    updateHighlight();
    const id = setInterval(updateHighlight, 400);
    window.addEventListener("resize", updateHighlight);
    return () => {
      clearInterval(id);
      window.removeEventListener("resize", updateHighlight);
    };
  }, [updateHighlight]);

  const close = () => {
    setIsOpen(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const next = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
    else close();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const goToPage = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    close();
    navigate(STEPS[currentStep].route);
  };

  // Floating button when closed
  if (!isOpen) {
    return (
      <button
        onClick={() => { setCurrentStep(0); setIsOpen(true); }}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Open navigation guide"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    );
  }

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Position tooltip to the right of highlighted sidebar item
  const hasHL = highlightRect && highlightRect.width > 0;
  const tooltipTop = hasHL
    ? Math.max(16, Math.min(highlightRect!.top + highlightRect!.height / 2 - 130, window.innerHeight - 360))
    : undefined;
  const tooltipLeft = hasHL ? highlightRect!.right + 18 : undefined;

  return (
    <>
      {/* Backdrop overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px]" onClick={close} />

      {/* Highlight ring */}
      {hasHL && (
        <div
          className="fixed z-[9999] rounded-xl pointer-events-none transition-all duration-300 ease-out"
          style={{
            top: highlightRect!.top - 5,
            left: highlightRect!.left - 5,
            width: highlightRect!.width + 10,
            height: highlightRect!.height + 10,
            boxShadow: "0 0 0 3px rgba(139,92,246,0.5), 0 0 20px 4px rgba(139,92,246,0.25)",
            border: "2px solid rgb(139,92,246)",
          }}
        />
      )}

      {/* Tooltip Card -- positioned next to sidebar item */}
      <div
        className="fixed z-[10000] w-[340px] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
        style={
          hasHL
            ? { top: tooltipTop, left: tooltipLeft }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
        }
      >
        {/* Arrow pointing left */}
        {hasHL && (
          <div
            className="absolute -left-[9px] w-[18px] h-[18px] bg-card border-l border-b border-border rotate-45"
            style={{ top: hasHL ? Math.min(Math.max(highlightRect!.top + highlightRect!.height / 2 - tooltipTop! - 9, 24), 240) : 60 }}
          />
        )}

        {/* Progress */}
        <div className="h-1.5 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-pink-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-[11px] font-bold text-violet-500 uppercase tracking-wider">
                Step {currentStep + 1} of {STEPS.length}
              </span>
            </div>
            <button
              onClick={close}
              className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
              aria-label="Close guide"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Title */}
          <h3 className="text-lg font-bold text-foreground mb-1">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{step.description}</p>

          {/* Tip box */}
          <div className="bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 rounded-xl px-3.5 py-2.5 mb-4">
            <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
              <span className="font-bold">Tip:</span> {step.tip}
            </p>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-1 mb-4">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? "w-5 bg-gradient-to-r from-violet-600 to-pink-500"
                    : completedSteps.has(i)
                      ? "w-1.5 bg-emerald-500"
                      : "w-1.5 bg-muted-foreground/20 hover:bg-muted-foreground/40"
                }`}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prev}
              disabled={currentStep === 0}
              className="text-xs h-9"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
              Back
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToPage}
              className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 h-9 flex-1"
            >
              Try it
              <ChevronRight className="w-3 h-3 ml-0.5" />
            </Button>

            <Button
              size="sm"
              onClick={next}
              className="text-xs bg-gradient-to-r from-violet-600 to-pink-500 text-white border-0 hover:opacity-90 h-9"
            >
              {currentStep === STEPS.length - 1 ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Done
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </>
              )}
            </Button>
          </div>

          <button onClick={close} className="w-full mt-2.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center">
            Skip tutorial
          </button>
        </div>
      </div>
    </>
  );
};
