import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Link2,
  Radio,
  Play,
  Wand2,
  Store,
  Palette,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  CheckCircle2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface GuideStep {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  color: string;
  tip: string;
}

const steps: GuideStep[] = [
  {
    icon: LayoutDashboard,
    title: "Dashboard",
    description:
      "Your command center. See link stats, total clicks, and quick access to all features at a glance.",
    href: "/dashboard",
    color: "from-violet-500 to-purple-600",
    tip: "Check your dashboard daily to track link performance.",
  },
  {
    icon: Link2,
    title: "Links",
    description:
      "Add, edit, reorder, and manage all your links. Toggle links on/off, schedule auto-shares to social media, and track clicks per link.",
    href: "/dashboard/links",
    color: "from-blue-500 to-cyan-500",
    tip: "Use Auto-Share to schedule links to Twitter, WhatsApp, and more.",
  },
  {
    icon: Radio,
    title: "Live Streaming",
    description:
      "Go live directly from your browser. Stream to your audience, receive tips, and your streams are automatically recorded for replay.",
    href: "/streaming",
    color: "from-red-500 to-rose-600",
    tip: "Past streams are saved to the Media page for viewers to rewatch.",
  },
  {
    icon: Play,
    title: "Media",
    description:
      "Browse and watch recorded live streams from all creators. Discover trending content and replay your own past streams.",
    href: "/media",
    color: "from-pink-500 to-fuchsia-600",
    tip: "Share your stream recordings to grow your audience.",
  },
  {
    icon: Wand2,
    title: "AI Page Builder",
    description:
      "Describe your business in a few words and our AI generates a professional page design for you in seconds.",
    href: "/ai-builder",
    color: "from-purple-500 to-indigo-600",
    tip: "Try prompts like 'I'm a photographer' or 'I run a bakery'.",
  },
  {
    icon: Store,
    title: "My Shop",
    description:
      "List products and services for your audience to discover. Add digital goods, courses, merch, or any item with a purchase link.",
    href: "/connect",
    color: "from-emerald-500 to-teal-600",
    tip: "Add an image and external purchase link for each product.",
  },
  {
    icon: Palette,
    title: "Appearance",
    description:
      "Customize how your public profile looks. Choose from multiple themes, change colors, fonts, and button styles.",
    href: "/dashboard/appearance",
    color: "from-orange-500 to-amber-500",
    tip: "Preview changes in real-time before saving.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description:
      "Track detailed link performance -- clicks over time, top-performing links, geographic data, and referral sources.",
    href: "/analytics",
    color: "from-sky-500 to-blue-600",
    tip: "Use analytics to understand which links resonate with your audience.",
  },
  {
    icon: Settings,
    title: "Settings",
    description:
      "Update your profile info, social media handles, change your password, and manage your subscription plan.",
    href: "/dashboard/settings",
    color: "from-slate-500 to-gray-600",
    tip: "Add social media handles so visitors can find you everywhere.",
  },
];

export const NavigationGuide = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Show on first visit
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("stl-guide-seen");
    if (!hasSeenGuide) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("stl-guide-seen", "true");
  };

  const handleNext = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGoToPage = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    handleClose();
    navigate(steps[currentStep].href);
  };

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-pink-600 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Open navigation guide"
      >
        <HelpCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Guide Card */}
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-pink-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-500" />
            <span className="text-sm font-semibold text-muted-foreground">
              Platform Guide
            </span>
            <span className="text-xs text-muted-foreground/60">
              {currentStep + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="px-6 py-4">
          {/* Icon + Title */}
          <div className="flex items-center gap-4 mb-4">
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shrink-0 shadow-lg`}
            >
              <StepIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {step.title}
              </h3>
              <button
                onClick={handleGoToPage}
                className="text-sm text-violet-500 hover:text-violet-600 font-medium transition-colors"
              >
                Go to {step.title} page
                <ChevronRight className="w-3 h-3 inline ml-0.5" />
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-muted-foreground leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Tip */}
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
            <p className="text-sm text-violet-700 dark:text-violet-300">
              <span className="font-semibold">Tip: </span>
              {step.tip}
            </p>
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-1.5 px-6 pb-3">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? "w-6 bg-gradient-to-r from-violet-600 to-pink-600"
                  : completedSteps.has(i)
                    ? "w-2 bg-emerald-500"
                    : "w-2 bg-muted-foreground/20 hover:bg-muted-foreground/40"
              }`}
              aria-label={`Go to step ${i + 1}: ${steps[i].title}`}
            />
          ))}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between px-6 pb-5 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="text-muted-foreground"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              className="text-muted-foreground"
            >
              Skip Tour
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:opacity-90 border-0"
            >
              {currentStep === steps.length - 1 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Finish
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
