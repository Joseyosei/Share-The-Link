import { useState, useEffect, useCallback } from "react";
import { Wand2, Loader2, Check, Sparkles, Palette, Type, Layout, ArrowRight, Target, PenTool, Share2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAIPageBuilder, GeneratedPage } from "@/hooks/useAIPageBuilder";

// AI Generation Loading Modal with animated steps
const AIGeneratingModal = ({ isOpen, currentStep }: { isOpen: boolean; currentStep: number }) => {
  const steps = [
    { icon: Target, label: "Analyzing campaign goals...", color: "text-purple-500" },
    { icon: PenTool, label: "Optimizing copy for engagement...", color: "text-pink-500" },
    { icon: Share2, label: "Generating shareable assets...", color: "text-orange-500" },
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
          <p className="text-sm text-muted-foreground text-center mb-8">This usually takes a few seconds</p>

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

          {/* Progress bar */}
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

interface AIPageBuilderWizardProps {
  onComplete?: (page: GeneratedPage) => void;
}

export const AIPageBuilderWizard = ({ onComplete }: AIPageBuilderWizardProps) => {
  const { generatePage, applyDesign, loading, generatedPage } = useAIPageBuilder();
  const [step, setStep] = useState<"describe" | "preview" | "apply">("describe");
  const [businessDescription, setBusinessDescription] = useState("");
  const [applying, setApplying] = useState(false);
  const [showGeneratingModal, setShowGeneratingModal] = useState(false);
  const [generatingStep, setGeneratingStep] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Animate through generation steps
  useEffect(() => {
    if (!showGeneratingModal) {
      setGeneratingStep(0);
      return;
    }
    const interval = setInterval(() => {
      setGeneratingStep((prev) => {
        if (prev >= 3) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [showGeneratingModal]);

  const handleGenerate = useCallback(async () => {
    if (!businessDescription.trim()) return;

    setShowGeneratingModal(true);
    setGeneratingStep(0);

    try {
      const page = await generatePage(businessDescription);
      // Ensure minimum display time for the modal
      await new Promise((r) => setTimeout(r, 500));
      setShowGeneratingModal(false);
      if (page) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
        setStep("preview");
      }
    } catch {
      setShowGeneratingModal(false);
    }
  }, [businessDescription, generatePage]);

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
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {["describe", "preview", "apply"].map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : i < ["describe", "preview", "apply"].indexOf(step)
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < ["describe", "preview", "apply"].indexOf(step) ? (
                <Check className="w-4 h-4" />
              ) : (
                i + 1
              )}
            </div>
            {i < 2 && (
              <div className={`w-12 h-0.5 mx-2 ${
                i < ["describe", "preview", "apply"].indexOf(step)
                  ? "bg-accent"
                  : "bg-muted"
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Describe */}
      {step === "describe" && (
        <Card className="border-2 border-dashed border-primary/20">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Wand2 className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Describe Your Business</h2>
              <p className="text-muted-foreground">
                Tell us about your business in 2-3 sentences. Our AI will create a professional page design for you.
              </p>
            </div>

            <Textarea
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Example: I'm a fitness coach helping busy professionals build sustainable workout habits. I offer 1-on-1 coaching, group classes, and a nutrition program."
              className="min-h-32 text-base"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground">Try:</span>
              {[
                "I'm a photographer",
                "I run a bakery",
                "I'm a life coach",
                "I sell handmade jewelry",
              ].map((example) => (
                <Badge
                  key={example}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setBusinessDescription(example)}
                >
                  {example}
                </Badge>
              ))}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || businessDescription.length < 10}
              className="w-full mt-6 gradient-button text-white py-7 text-lg font-semibold"
              size="lg"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Generate with AI
            </Button>
          </CardContent>
        </Card>
      )}

      {/* AI Generation Modal */}
      <AIGeneratingModal isOpen={showGeneratingModal} currentStep={generatingStep} />

      {/* Step 2: Preview */}
      {step === "preview" && generatedPage && (
        <div className={`space-y-6 ${showSuccess ? "animate-scale-in" : ""}`}>
          <Card className="overflow-hidden">
            {/* Success banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">Page generated successfully</span>
              <Badge className="ml-auto bg-white/20 text-white hover:bg-white/30 text-xs">
                <Sparkles className="w-3 h-3 mr-1" />
                AI-Enhanced
              </Badge>
            </div>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Your Generated Design
              </h2>

              {/* Bio Preview */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Bio</span>
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">
                    <Sparkles className="w-3 h-3 mr-1" /> AI-written
                  </Badge>
                </div>
                <p className="text-muted-foreground bg-muted/50 p-4 rounded-lg">
                  {generatedPage.bio}
                </p>
              </div>

              {/* Colors Preview */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Color Palette</span>
                  <Badge variant="outline" className="text-xs text-primary border-primary/30">
                    <Sparkles className="w-3 h-3 mr-1" /> AI-picked
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {Object.entries(generatedPage.colors).map(([name, color]) => (
                    <div key={name} className="text-center">
                      <div
                        className="w-12 h-12 rounded-lg border shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-xs text-muted-foreground capitalize mt-1 block">
                        {name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Layout & Font */}
              <div className="mb-6 flex gap-4">
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
                <div className="mb-6">
                  <span className="font-medium block mb-2">Suggested Links</span>
                  <div className="space-y-2">
                    {generatedPage.ctas.map((cta, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <span className="font-medium">{cta.title}</span>
                        <Badge variant={cta.type === "primary" ? "default" : "outline"}>
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
                  <span className="font-medium block mb-2">💡 AI Suggestions</span>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {generatedPage.suggestions.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleStartOver} className="flex-1">
              Start Over
            </Button>
            <Button
              onClick={handleApply}
              disabled={applying}
              className="flex-1 gradient-button"
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

      {/* Step 3: Complete */}
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
