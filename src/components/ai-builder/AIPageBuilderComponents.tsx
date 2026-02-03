import { useState } from "react";
import { Wand2, Loader2, Check, Sparkles, Palette, Type, Layout, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAIPageBuilder, GeneratedPage } from "@/hooks/useAIPageBuilder";

interface AIPageBuilderWizardProps {
  onComplete?: (page: GeneratedPage) => void;
}

export const AIPageBuilderWizard = ({ onComplete }: AIPageBuilderWizardProps) => {
  const { generatePage, applyDesign, loading, generatedPage } = useAIPageBuilder();
  const [step, setStep] = useState<"describe" | "preview" | "apply">("describe");
  const [businessDescription, setBusinessDescription] = useState("");
  const [applying, setApplying] = useState(false);

  const handleGenerate = async () => {
    if (!businessDescription.trim()) return;
    
    try {
      const page = await generatePage(businessDescription);
      if (page) {
        setStep("preview");
      }
    } catch {
      // Error handled in hook
    }
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
              className="w-full mt-6 gradient-button"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Generating your page...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate My Page
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && generatedPage && (
        <div className="space-y-6">
          <Card>
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
        <Card className="border-2 border-accent">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Design Applied! 🎉</h2>
            <p className="text-muted-foreground mb-6">
              Your profile has been updated with the new AI-generated design.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={handleStartOver}>
                Generate Another
              </Button>
              <Button asChild className="gradient-button">
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
