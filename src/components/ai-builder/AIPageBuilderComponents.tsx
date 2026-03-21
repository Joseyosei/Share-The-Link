import { useState, useEffect, useCallback } from "react";
import {
  Wand2, Loader2, Check, Sparkles, Palette, Type, Layout, ArrowRight,
  Target, PenTool, Zap, Globe, Search, User, ExternalLink, ArrowLeft,
  RefreshCw, Eye, Smartphone, RotateCcw, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAIPageBuilder, GeneratedPage, ThemeVariant } from "@/hooks/useAIPageBuilder";

// ── Live Phone Preview ──────────────────────────────────────────────
const PhonePreview = ({ page, className = "" }: { page: GeneratedPage; className?: string }) => {
  return (
    <div className={`relative mx-auto ${className}`} style={{ width: 280 }}>
      {/* Phone bezel */}
      <div className="rounded-[2.5rem] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="relative bg-gray-800 flex justify-center pt-2 pb-1">
          <div className="w-20 h-5 bg-gray-900 rounded-full" />
        </div>
        {/* Screen */}
        <div
          className="px-5 py-6 min-h-[420px] flex flex-col items-center"
          style={{
            backgroundColor: page.colors.background,
            fontFamily: page.font || "Inter",
            transition: "all 0.4s ease",
          }}
        >
          {/* Avatar placeholder */}
          <div
            className="w-16 h-16 rounded-full mb-3 flex items-center justify-center border-2"
            style={{ borderColor: page.colors.accent, backgroundColor: page.colors.primary + "15" }}
          >
            <User className="w-7 h-7" style={{ color: page.colors.primary }} />
          </div>

          {/* Name */}
          <div
            className="text-sm font-bold mb-0.5 text-center"
            style={{ color: page.colors.text }}
          >
            Your Name
          </div>
          <div
            className="text-[10px] mb-2 opacity-60"
            style={{ color: page.colors.text }}
          >
            @username
          </div>

          {/* Bio */}
          <p
            className="text-[11px] text-center mb-4 leading-relaxed max-w-[200px]"
            style={{ color: page.colors.secondary }}
          >
            {page.bio || "Your bio will appear here..."}
          </p>

          {/* CTA Buttons */}
          <div className="w-full space-y-2">
            {(page.ctas || []).slice(0, 4).map((cta, i) => (
              <div
                key={i}
                className="w-full py-2.5 px-3 rounded-xl text-center text-[11px] font-semibold transition-all duration-300 flex items-center justify-between"
                style={{
                  backgroundColor: cta.type === "primary" ? page.colors.primary : page.colors.primary + "18",
                  color: cta.type === "primary" ? page.colors.background : page.colors.primary,
                  border: cta.type === "secondary" ? `1.5px solid ${page.colors.primary}30` : "none",
                }}
              >
                <span>{cta.title}</span>
                <ChevronRight className="w-3 h-3 opacity-50" />
              </div>
            ))}
          </div>

          {/* Color accent bar */}
          <div className="flex gap-1 mt-auto pt-4">
            {Object.entries(page.colors).map(([key, color]) => (
              <div
                key={key}
                className="w-3 h-3 rounded-full border border-black/10"
                style={{ backgroundColor: color }}
                title={key}
              />
            ))}
          </div>
        </div>
        {/* Home indicator */}
        <div className="bg-gray-800 flex justify-center py-2">
          <div className="w-24 h-1 bg-gray-600 rounded-full" />
        </div>
      </div>
    </div>
  );
};

// ── AI Generation Loading Modal ─────────────────────────────────────
const AIGeneratingModal = ({ isOpen, currentStep }: { isOpen: boolean; currentStep: number }) => {
  const steps = [
    { icon: Globe, label: "Searching the web for your business...", color: "text-blue-500" },
    { icon: Target, label: "Analyzing business goals...", color: "text-purple-500" },
    { icon: PenTool, label: "Crafting your bio and content...", color: "text-pink-500" },
    { icon: Palette, label: "Generating theme options...", color: "text-orange-500" },
    { icon: Zap, label: "Finalizing your page...", color: "text-green-500" },
  ];

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md [&>button]:hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        <div className="py-8 px-4">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full gradient-button flex items-center justify-center pulse-glow">
              <Wand2 className="w-10 h-10 text-white animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-center mb-2">AI is building your page</h3>
          <p className="text-sm text-muted-foreground text-center mb-8">
            Fetching info from the web and generating themes
          </p>

          <div className="space-y-4">
            {steps.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = i === currentStep;
              const isDone = i < currentStep;
              return (
                <div
                  key={s.label}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                    isActive ? "bg-primary/5 scale-[1.02]" : isDone ? "opacity-60" : "opacity-30"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isDone ? "bg-green-100" : isActive ? "bg-primary/10" : "bg-muted"
                  }`}>
                    {isDone ? (
                      <Check className="w-4 h-4 text-green-600 animate-count" />
                    ) : isActive ? (
                      <StepIcon className={`w-4 h-4 ${s.color} animate-pulse`} />
                    ) : (
                      <StepIcon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <span className={`text-sm font-medium transition-colors ${
                    isActive ? "text-foreground" : isDone ? "text-muted-foreground" : "text-muted-foreground/50"
                  }`}>
                    {s.label}
                  </span>
                  {isActive && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary ml-auto" />
                  )}
                  {isDone && (
                    <Check className="w-4 h-4 text-green-500 ml-auto" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full gradient-button rounded-full transition-all duration-700 ease-out"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Theme Card ──────────────────────────────────────────────────────
const ThemeCard = ({
  theme,
  isSelected,
  onClick,
}: {
  theme: ThemeVariant;
  isSelected: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? "border-primary shadow-lg scale-[1.02]"
          : "border-border hover:border-primary/40 hover:shadow-md"
      }`}
    >
      {/* Color preview strip */}
      <div className="flex gap-1 mb-3 h-8 rounded-lg overflow-hidden">
        <div className="flex-1" style={{ backgroundColor: theme.colors.background }} />
        <div className="flex-1" style={{ backgroundColor: theme.colors.primary }} />
        <div className="flex-1" style={{ backgroundColor: theme.colors.secondary }} />
        <div className="flex-1" style={{ backgroundColor: theme.colors.accent }} />
      </div>
      {/* Mini preview */}
      <div
        className="rounded-lg p-3 mb-3"
        style={{ backgroundColor: theme.colors.background }}
      >
        <div
          className="text-xs font-bold mb-1"
          style={{ color: theme.colors.text }}
        >
          Preview
        </div>
        <div
          className="w-full h-6 rounded-md mb-1"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div
          className="w-3/4 h-6 rounded-md"
          style={{ backgroundColor: theme.colors.secondary, opacity: 0.6 }}
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{theme.name}</p>
          <p className="text-xs text-muted-foreground">{theme.description}</p>
        </div>
        {isSelected && (
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <Badge variant="outline" className="text-[10px]">{theme.font}</Badge>
        <Badge variant="outline" className="text-[10px] capitalize">{theme.layout}</Badge>
      </div>
    </button>
  );
};

// ── Example Prompts ─────────────────────────────────────────────────
const EXAMPLE_PROMPTS = [
  { label: "Photographer", text: "I'm a freelance photographer specializing in weddings and portraits. I want clients to book sessions and view my portfolio." },
  { label: "Bakery owner", text: "I run a bakery called Sweet Crumbs. We sell custom cakes, pastries, and offer catering for events." },
  { label: "Life coach", text: "I'm a certified life coach helping people overcome anxiety and build confidence. I offer 1-on-1 sessions and group workshops." },
  { label: "Jewelry maker", text: "I sell handmade jewelry on Etsy. I specialize in minimalist gold and silver pieces inspired by nature." },
  { label: "Fitness trainer", text: "I'm a personal trainer offering online workout programs and nutrition coaching for busy professionals." },
  { label: "Music artist", text: "I'm an independent R&B artist. I want to share my latest releases, tour dates, and merch store." },
  { label: "Restaurant", text: "I own a family Italian restaurant called Nonna's Kitchen. We do dine-in, takeout, and catering." },
  { label: "Developer", text: "I'm a full-stack developer building SaaS products. I want to showcase my projects and accept freelance work." },
];

// ── Main Wizard ─────────────────────────────────────────────────────
interface AIPageBuilderWizardProps {
  onComplete?: (page: GeneratedPage) => void;
}

export const AIPageBuilderWizard = ({ onComplete }: AIPageBuilderWizardProps) => {
  const { generatePage, applyDesign, applyThemeToPage, loading, generatedPage, themeVariants } = useAIPageBuilder();
  const [step, setStep] = useState<"describe" | "themes" | "preview" | "apply">("describe");
  const [businessDescription, setBusinessDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [applying, setApplying] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedThemeIndex, setSelectedThemeIndex] = useState<number | null>(null);

  // Animate through generation steps
  useEffect(() => {
    if (!showGeneratingModal) {
      setGeneratingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setGeneratingStep((prev) => {
        if (prev >= 4) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
    return () => clearInterval(interval);
  }, [showGeneratingModal]);

  const handleGenerate = useCallback(async () => {
    if (!businessDescription.trim()) return;

    setShowGeneratingModal(true);
    setGeneratingStep(0);

    try {
      const page = await generatePage(businessDescription, websiteUrl || undefined);
      await new Promise((r) => setTimeout(r, 500));
      setShowGeneratingModal(false);
      if (page) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        setStep("themes");
      }
    } catch {
      setShowGeneratingModal(false);
    }
  }, [businessDescription, websiteUrl, generatePage]);

  const handleSelectTheme = (index: number) => {
    setSelectedThemeIndex(index);
    if (themeVariants[index]) {
      applyThemeToPage(themeVariants[index]);
    }
  };

  const handleProceedToPreview = () => {
    setStep("preview");
  };

  const handleApply = async () => {
    if (!generatedPage) return;

    setApplying(true);
    try {
      await applyDesign(generatedPage);
      setStep("apply");
      onComplete?.(generatedPage);
    } finally {
      setApplying(false);
    }
  };

  const handleStartOver = () => {
    setStep("describe");
    setBusinessDescription("");
    setWebsiteUrl("");
    setSelectedThemeIndex(null);
  };

  const allSteps = ["describe", "themes", "preview", "apply"];
  const stepLabels = ["Describe", "Theme", "Preview", "Apply"];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps with labels */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 mb-8">
        {allSteps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                  step === s
                    ? "bg-primary text-primary-foreground shadow-lg scale-110"
                    : i < allSteps.indexOf(step)
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i < allSteps.indexOf(step) ? (
                  <Check className="w-4 h-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${
                step === s ? "text-primary" : i < allSteps.indexOf(step) ? "text-green-600" : "text-muted-foreground"
              }`}>
                {stepLabels[i]}
              </span>
            </div>
            {i < allSteps.length - 1 && (
              <div className={`w-6 sm:w-12 h-0.5 mx-1 mt-[-12px] sm:mt-[-14px] transition-colors ${
                i < allSteps.indexOf(step)
                  ? "bg-green-500"
                  : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Describe */}
      {step === "describe" && (
        <Card className="border-2 border-dashed border-primary/20">
          <CardContent className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Describe Your Business</h2>
              <p className="text-muted-foreground">
                Tell us about your business in detail. The more you share, the better your page will be.
              </p>
            </div>

            <Textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Example: I'm a fitness coach named Sarah helping busy professionals build sustainable workout habits. I offer 1-on-1 coaching, group classes, and a nutrition program. My brand is energetic and motivational."
              className="min-h-36 text-base resize-y"
              maxLength={2000}
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {businessDescription.length < 10 ? `At least 10 characters required` : ""}
              </span>
              <span className="text-xs text-muted-foreground">{businessDescription.length}/2000</span>
            </div>

            {/* Website URL for web retrieval */}
            <div className="mt-4">
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                Website URL (optional)
              </label>
              <div className="flex gap-2">
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://your-website.com"
                  type="url"
                />
                {websiteUrl && (
                  <Badge variant="outline" className="shrink-0 flex items-center gap-1">
                    <Search className="w-3 h-3" />
                    Will fetch info
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                AI will pull your business info, branding, and details from this URL
              </p>
            </div>

            {/* Example prompts - scrollable grid */}
            <div className="mt-5">
              <span className="text-sm font-medium text-muted-foreground block mb-2">Quick start examples:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example.label}
                    className="text-left p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-accent/50 transition-all text-sm group"
                    onClick={() => setBusinessDescription(example.text)}
                  >
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">{example.label}</span>
                    <span className="text-[10px] text-muted-foreground block mt-0.5 line-clamp-2">{example.text.slice(0, 60)}...</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || businessDescription.length < 10}
              className="w-full mt-6 gradient-button text-white py-7 text-lg font-semibold"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              Generate with AI
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Generation Modal */}
      <AIGeneratingModal isOpen={showGeneratingModal} currentStep={generatingStep} />

      {/* Step 2: Theme Selection with side-by-side preview */}
      {step === "themes" && themeVariants.length > 0 && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-[1fr_300px] gap-6">
            {/* Theme grid */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Palette className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold mb-1">Choose Your Theme</h2>
                  <p className="text-sm text-muted-foreground">
                    Select a visual style for your profile. See the live preview on the right.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {themeVariants.map((theme, index) => (
                    <ThemeCard
                      key={theme.name}
                      theme={theme}
                      isSelected={selectedThemeIndex === index}
                      onClick={() => handleSelectTheme(index)}
                    />
                  ))}
                </div>

                <p className="text-center text-xs text-muted-foreground mt-4">
                  Or skip to use the AI-recommended theme
                </p>
              </CardContent>
            </Card>

            {/* Live phone preview (visible on larger screens) */}
            {generatedPage && (
              <div className="hidden lg:flex flex-col items-center sticky top-8">
                <div className="flex items-center gap-2 mb-3">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Live Preview</span>
                </div>
                <PhonePreview page={generatedPage} />
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleStartOver} className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
            <Button onClick={handleProceedToPreview} className="flex-1 gradient-button text-white">
              <ArrowRight className="w-4 h-4 mr-2" />
              {selectedThemeIndex !== null ? "Preview with Theme" : "Skip & Preview"}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview with phone mockup + details */}
      {step === "preview" && generatedPage && (
        <div className={`space-y-6 ${showSuccess ? "animate-scale-in" : ""}`}>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">Page generated successfully</span>
              <Badge className="ml-auto bg-white/20 text-white hover:bg-white/30 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Enhanced
              </Badge>
            </div>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Eye className="w-5 h-5 text-primary" />
                Your Generated Design
              </h2>

              <div className="grid lg:grid-cols-[300px_1fr] gap-8">
                {/* Phone preview */}
                <div className="flex flex-col items-center">
                  <PhonePreview page={generatedPage} />
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    This is how your profile will look to visitors
                  </p>
                </div>

                {/* Design details */}
                <div className="space-y-5">
                  {/* Bio */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Type className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Bio</span>
                      <Badge variant="outline" className="text-xs text-primary border-primary/30">
                        <Sparkles className="w-3 h-3 mr-1" /> AI-written
                      </Badge>
                    </div>
                    <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg text-sm">
                      {generatedPage.bio}
                    </p>
                  </div>

                  {/* Colors Preview */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Color Palette</span>
                      {selectedThemeIndex !== null && (
                        <Badge variant="outline" className="text-xs text-primary border-primary/30">
                          {themeVariants[selectedThemeIndex]?.name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-3">
                      {Object.entries(generatedPage.colors).map(([name, color]) => (
                        <div key={name} className="text-center">
                          <div
                            className="w-10 h-10 rounded-lg border shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[10px] text-muted-foreground capitalize mt-1 block">
                            {name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Layout & Font */}
                  <div className="flex gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Layout className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Layout</span>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {generatedPage.layout}
                      </Badge>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Type className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">Font</span>
                      </div>
                      <Badge variant="secondary">{generatedPage.font}</Badge>
                    </div>
                  </div>

                  {/* CTAs Preview */}
                  {generatedPage.ctas && generatedPage.ctas.length > 0 && (
                    <div>
                      <span className="font-medium block mb-2">Suggested Links</span>
                      <div className="space-y-2">
                        {generatedPage.ctas.map((cta, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-2">
                              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="font-medium text-sm">{cta.title}</span>
                            </div>
                            <Badge variant={cta.type === "primary" ? "default" : "outline"} className="text-xs">
                              {cta.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {generatedPage.suggestions && generatedPage.suggestions.length > 0 && (
                    <div className="bg-accent/10 p-4 rounded-lg">
                      <span className="font-medium block mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        AI Tips for Your Page
                      </span>
                      <ul className="text-sm text-muted-foreground space-y-1.5">
                        {generatedPage.suggestions.map((s, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("themes")} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Change Theme
            </Button>
            <Button
              onClick={handleApply}
              disabled={applying}
              className="flex-1 gradient-button text-white"
            >
              {applying ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="w-4 h-4 mr-2" />
              )}
              Apply to My Profile
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "apply" && (
        <Card className="border-2 border-green-500/30 overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 py-6 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-count">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Design Applied Successfully</h2>
            <p className="text-muted-foreground mb-6">
              Your profile has been updated with the new AI-generated design.
              Visitors will see the changes immediately.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleStartOver}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Another
              </Button>
              <Button asChild className="gradient-button text-white">
                <a href="/dashboard">View Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Compact version for dashboard
export const AIPageBuilderCard = ({ onClick }: { onClick: () => void }) => {
  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 cursor-pointer hover:shadow-lg transition-shadow" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Wand2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg mb-1">AI Page Builder</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Describe your business and get a professional page design in 30 seconds.
            </p>
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by AI
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
