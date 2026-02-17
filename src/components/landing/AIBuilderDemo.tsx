import { useState } from "react";
import { Link } from "react-router-dom";
import { Wand2, Sparkles, ArrowRight, Globe, Palette, Type, Layout, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeneratedPreview {
  name: string;
  bio: string;
  colors: { primary: string; secondary: string; bg: string; text: string };
  links: Array<{ title: string; icon: string }>;
  layout: string;
}

// Extract a real name from user input
const extractName = (text: string): string => {
  // Try to find "I'm [Name]" or "My name is [Name]"
  const iAmMatch = text.match(/(?:I'm|I am|my name is|name is)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i);
  if (iAmMatch) return iAmMatch[1].trim();

  // Try to find capitalized proper nouns (2+ words starting with uppercase)
  const properNouns = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g);
  if (properNouns && properNouns.length > 0) {
    // Filter out common non-name phrases
    const filtered = properNouns.filter(n =>
      !/(The|For|And|With|From|About|How|What|Where|New|Live|Free|Digital|Social|Based|Lead|Grace|Prayer|Alpha)/i.test(n.split(" ")[0]) || n.split(" ").length >= 2
    );
    return filtered[0] || properNouns[0];
  }

  return "";
};

// Extract organization/business name
const extractOrg = (text: string): string => {
  // Common patterns for org names
  const orgPatterns = [
    /(?:founder|lead|ceo|owner|creator|head|director)(?:\s+\w+)?\s+(?:of|at)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i,
    /(?:called|named)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*)/i,
    /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)+)\s+(?:Ministry|Church|Studio|Agency|Academy|School|Lab|Shop|Store|Band|Fitness|Coaching)/i,
  ];
  for (const pattern of orgPatterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return "";
};

// Create a bio from the user's actual description
const createBio = (text: string, maxLen = 120): string => {
  // Clean up the text -- remove URLs, trim
  let cleaned = text.replace(/https?:\/\/\S+/g, "").trim();
  // If it's short enough, use it directly
  if (cleaned.length <= maxLen) return cleaned;
  // Truncate to nearest sentence
  const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim());
  let bio = "";
  for (const s of sentences) {
    const next = bio ? bio + ". " + s.trim() : s.trim();
    if (next.length > maxLen) break;
    bio = next;
  }
  return (bio || sentences[0]?.trim().slice(0, maxLen) || cleaned.slice(0, maxLen)) + ".";
};

// Category detection with themed links
interface CategoryConfig {
  keywords: string[];
  colors: { primary: string; secondary: string; bg: string; text: string };
  links: Array<{ title: string; icon: string }>;
  layout: string;
  fallbackName: string;
}

const categories: CategoryConfig[] = [
  {
    keywords: ["photo", "video", "film", "camera", "cinemat"],
    colors: { primary: "#1a1a2e", secondary: "#e94560", bg: "#0f0f1a", text: "#ffffff" },
    links: [
      { title: "Portfolio", icon: "camera" },
      { title: "Book a Session", icon: "calendar" },
      { title: "Instagram", icon: "instagram" },
      { title: "YouTube", icon: "play" },
    ],
    layout: "bold",
    fallbackName: "Creative Studio",
  },
  {
    keywords: ["coach", "fitness", "trainer", "health", "wellness", "gym"],
    colors: { primary: "#059669", secondary: "#34d399", bg: "#ecfdf5", text: "#064e3b" },
    links: [
      { title: "Free Consultation", icon: "phone" },
      { title: "Programs & Pricing", icon: "star" },
      { title: "Client Testimonials", icon: "heart" },
      { title: "Follow on Instagram", icon: "instagram" },
    ],
    layout: "minimal",
    fallbackName: "Wellness Hub",
  },
  {
    keywords: ["music", "artist", "band", "dj", "singer", "rapper"],
    colors: { primary: "#7c3aed", secondary: "#a78bfa", bg: "#1e1033", text: "#f5f3ff" },
    links: [
      { title: "Latest Release", icon: "music" },
      { title: "Tour Dates", icon: "calendar" },
      { title: "Merch Store", icon: "shopping-bag" },
      { title: "Spotify", icon: "headphones" },
    ],
    layout: "bold",
    fallbackName: "Artist Page",
  },
  {
    keywords: ["shop", "store", "product", "sell", "ecommerce", "jewelry", "handmade"],
    colors: { primary: "#d97706", secondary: "#fbbf24", bg: "#fffbeb", text: "#78350f" },
    links: [
      { title: "Shop All Products", icon: "shopping-bag" },
      { title: "New Arrivals", icon: "sparkles" },
      { title: "Shipping Info", icon: "truck" },
      { title: "Contact Us", icon: "mail" },
    ],
    layout: "elegant",
    fallbackName: "My Shop",
  },
  {
    keywords: ["church", "pastor", "ministry", "faith", "sermon", "worship", "prayer", "christian"],
    colors: { primary: "#7c3aed", secondary: "#c084fc", bg: "#faf5ff", text: "#3b0764" },
    links: [
      { title: "Watch Sermons", icon: "play" },
      { title: "Prayer Requests", icon: "heart" },
      { title: "Give / Donate", icon: "gift" },
      { title: "Join Community", icon: "users" },
    ],
    layout: "elegant",
    fallbackName: "Ministry Hub",
  },
  {
    keywords: ["tech", "developer", "software", "startup", "saas", "coding", "engineer"],
    colors: { primary: "#0ea5e9", secondary: "#38bdf8", bg: "#0c1222", text: "#e2e8f0" },
    links: [
      { title: "My Projects", icon: "code" },
      { title: "GitHub", icon: "github" },
      { title: "Blog", icon: "book" },
      { title: "Hire Me", icon: "briefcase" },
    ],
    layout: "minimal",
    fallbackName: "Tech Profile",
  },
];

const defaultCategory: Omit<CategoryConfig, "keywords"> = {
  colors: { primary: "#8b5cf6", secondary: "#a78bfa", bg: "#faf5ff", text: "#1e1b4b" },
  links: [
    { title: "About Me", icon: "user" },
    { title: "My Work", icon: "briefcase" },
    { title: "Get in Touch", icon: "mail" },
    { title: "Follow Me", icon: "heart" },
  ],
  layout: "professional",
  fallbackName: "My Page",
};

// Smart generator that uses ACTUAL user input
const generatePreview = (description: string): GeneratedPreview => {
  const lower = description.toLowerCase();

  // Detect category
  const matched = categories.find(cat => cat.keywords.some(kw => lower.includes(kw)));
  const cat = matched || defaultCategory;

  // Extract real info from user input
  const personName = extractName(description);
  const orgName = extractOrg(description);
  const bio = createBio(description);

  // Use real name/org or fallback
  const displayName = orgName || personName || cat.fallbackName;

  return {
    name: displayName,
    bio,
    colors: cat.colors,
    links: cat.links,
    layout: cat.layout,
  };
};

const quickPrompts = [
  "I'm a fitness coach helping people transform their health",
  "I'm a photographer capturing stunning moments",
  "I run a handmade jewelry store",
  "I'm a pastor building an online ministry",
  "I'm a music artist releasing new tracks",
  "I'm a developer building SaaS products",
];

export const AIBuilderDemo = () => {
  const [description, setDescription] = useState("");
  const [preview, setPreview] = useState<GeneratedPreview | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleGenerate = () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setShowResult(false);

    // Simulate AI generation with a brief delay
    setTimeout(() => {
      const result = generatePreview(description);
      setPreview(result);
      setIsGenerating(false);
      setShowResult(true);
    }, 1500);
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Wand2 className="w-4 h-4" />
            AI-Powered
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Build your page in seconds
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Describe your business and watch AI create a professional profile page instantly. No design skills needed.
          </p>
        </div>

        {/* Main Demo Area */}
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* Left: Input Area */}
            <div className="space-y-6">
              <div className="bg-card rounded-2xl p-6 shadow-lg border border-border">
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Describe your business or brand
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Example: I'm a fitness coach helping busy professionals build sustainable workout habits. I offer 1-on-1 coaching, group classes, and a nutrition program."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none text-sm leading-relaxed"
                />

                {/* Quick prompts */}
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2 font-medium">Try one of these:</p>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.slice(0, 4).map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => setDescription(prompt)}
                        className="px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs hover:bg-primary/10 hover:text-primary transition-colors border border-border"
                      >
                        {prompt.slice(0, 30)}...
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!description.trim() || isGenerating}
                  className="w-full mt-5 gradient-button text-white font-semibold py-6 rounded-xl text-base"
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </span>
                  )}
                </Button>
              </div>

              {/* Feature Pills */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                {[
                  { icon: Globe, label: "Web retrieval" },
                  { icon: Palette, label: "Theme selection" },
                  { icon: Type, label: "Auto bio" },
                  { icon: Layout, label: "Smart layouts" },
                ].map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs font-medium border border-border"
                  >
                    <f.icon className="w-3.5 h-3.5" />
                    {f.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Preview Phone Mockup */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Phone frame */}
                <div className="w-[280px] md:w-[300px] rounded-[2.5rem] border-[8px] border-foreground/10 bg-card shadow-2xl overflow-hidden">
                  {/* Phone notch */}
                  <div className="h-6 bg-foreground/10 flex items-center justify-center">
                    <div className="w-16 h-1 rounded-full bg-foreground/20" />
                  </div>

                  {/* Phone content */}
                  <div
                    className="min-h-[480px] p-6 transition-all duration-700"
                    style={{
                      backgroundColor: showResult && preview ? preview.colors.bg : undefined,
                      color: showResult && preview ? preview.colors.text : undefined,
                    }}
                  >
                    {!showResult ? (
                      // Empty / waiting state
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                          <Wand2 className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium mb-1">Your preview will appear here</p>
                        <p className="text-xs text-muted-foreground/60">Describe your business to get started</p>
                      </div>
                    ) : preview ? (
                      // Generated preview
                      <div className="flex flex-col items-center text-center animate-fade-in">
                        {/* Avatar placeholder */}
                        <div
                          className="w-20 h-20 rounded-full mb-4 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                          style={{ backgroundColor: preview.colors.primary }}
                        >
                          {preview.name.charAt(0)}
                        </div>

                        <h3
                          className="text-lg font-bold mb-2"
                          style={{ color: preview.colors.text }}
                        >
                          {preview.name}
                        </h3>

                        <p
                          className="text-xs leading-relaxed mb-6 opacity-80"
                          style={{ color: preview.colors.text }}
                        >
                          {preview.bio}
                        </p>

                        {/* Link buttons */}
                        <div className="w-full space-y-3">
                          {preview.links.map((link, i) => (
                            <div
                              key={i}
                              className="w-full py-3 px-4 rounded-xl text-center text-sm font-medium transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                              style={{
                                backgroundColor: i === 0 ? preview.colors.primary : `${preview.colors.primary}15`,
                                color: i === 0 ? "#ffffff" : preview.colors.text,
                                border: i === 0 ? "none" : `1px solid ${preview.colors.primary}30`,
                              }}
                            >
                              {link.title}
                            </div>
                          ))}
                        </div>

                        {/* Powered by badge */}
                        <p className="mt-6 text-[10px] opacity-40" style={{ color: preview.colors.text }}>
                          sharethelink.com
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Decorative glow */}
                {showResult && preview && (
                  <div
                    className="absolute -inset-4 rounded-[3rem] blur-2xl opacity-20 -z-10 transition-all duration-1000"
                    style={{ backgroundColor: preview.colors.primary }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* CTA after generation */}
          {showResult && (
            <div className="mt-12 text-center animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Page generated successfully
              </div>
              <p className="text-muted-foreground mb-6">
                Sign up to customize, add your real links, and publish your page.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="gradient-button text-white font-semibold px-8">
                  <Link to="/signup">
                    Claim Your Page
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold px-8">
                  <Link to="/ai-builder">
                    Open Full AI Builder
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
