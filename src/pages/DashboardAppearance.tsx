import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { Palette, Image, Type, Square, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAppearanceSettings } from "@/hooks/useAppearanceSettings";
import { useLinks } from "@/hooks/useLinks";
import { ThemedProfilePreview } from "@/components/dashboard/ThemedProfilePreview";

export interface Theme {
  id: string;
  name: string;
  background: string;
  buttonStyle: string;
  textColor: string;
  isPro?: boolean;
}

export const themes: Theme[] = [
  { id: "air", name: "Air", background: "bg-white", buttonStyle: "bg-gray-900", textColor: "text-gray-900" },
  { id: "agate", name: "Agate", background: "bg-gradient-to-br from-purple-500 to-pink-500", buttonStyle: "bg-white", textColor: "text-white" },
  { id: "bliss", name: "Bliss", background: "bg-gradient-to-br from-gray-200 to-gray-400", buttonStyle: "bg-gray-800", textColor: "text-gray-800" },
  { id: "blocks", name: "Blocks", background: "bg-gradient-to-br from-violet-600 to-purple-700", buttonStyle: "bg-pink-500", textColor: "text-white", isPro: true },
  { id: "bloom", name: "Bloom", background: "bg-gradient-to-br from-blue-900 to-slate-900", buttonStyle: "bg-pink-400", textColor: "text-white", isPro: true },
  { id: "breeze", name: "Breeze", background: "bg-gradient-to-br from-pink-200 to-pink-300", buttonStyle: "bg-white", textColor: "text-pink-900" },
  { id: "encore", name: "Encore", background: "bg-gradient-to-br from-amber-900 to-stone-800", buttonStyle: "bg-amber-100", textColor: "text-amber-100" },
  { id: "grid", name: "Grid", background: "bg-lime-100", buttonStyle: "bg-white", textColor: "text-lime-900" },
  { id: "groove", name: "Groove", background: "bg-gradient-to-br from-cyan-400 to-purple-600", buttonStyle: "bg-lime-400", textColor: "text-white", isPro: true },
  { id: "haven", name: "Haven", background: "bg-gradient-to-br from-stone-200 to-stone-400", buttonStyle: "bg-white", textColor: "text-stone-800" },
  { id: "lake", name: "Lake", background: "bg-slate-900", buttonStyle: "bg-white", textColor: "text-white" },
  { id: "mineral", name: "Mineral", background: "bg-amber-50", buttonStyle: "bg-amber-200", textColor: "text-amber-900" },
  { id: "nourish", name: "Nourish", background: "bg-gradient-to-br from-orange-300 to-yellow-200", buttonStyle: "bg-lime-400", textColor: "text-orange-900", isPro: true },
  { id: "rise", name: "Rise", background: "bg-gradient-to-br from-orange-500 to-red-600", buttonStyle: "bg-lime-400", textColor: "text-white", isPro: true },
  { id: "sweat", name: "Sweat", background: "bg-gradient-to-br from-pink-500 to-blue-600", buttonStyle: "bg-blue-500", textColor: "text-white", isPro: true },
  { id: "twilight", name: "Twilight", background: "bg-gradient-to-br from-purple-300 to-pink-300", buttonStyle: "bg-pink-400", textColor: "text-purple-900" },
];

const categories = [
  { id: "theme", name: "Theme", icon: Palette },
  { id: "wallpaper", name: "Wallpaper", icon: Image },
  { id: "text", name: "Text", icon: Type },
  { id: "buttons", name: "Buttons", icon: Square },
];

const DashboardAppearance = () => {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { settings, updateSettings } = useAppearanceSettings();
  const { links } = useLinks();
  const [selectedTheme, setSelectedTheme] = useState("air");
  const [activeCategory, setActiveCategory] = useState("theme");
  const [isSaving, setIsSaving] = useState(false);

  // Load theme from settings
  useEffect(() => {
    if (settings?.theme) {
      setSelectedTheme(settings.theme);
    }
  }, [settings]);

  const handleSelectTheme = async (themeId: string, isPro?: boolean) => {
    if (isPro) {
      toast({
        title: "Pro Feature",
        description: "Upgrade to Pro to unlock this theme!",
      });
      return;
    }

    setSelectedTheme(themeId);
    setIsSaving(true);

    try {
      await updateSettings({ theme: themeId });
      toast({
        title: "Theme applied!",
        description: "Your profile appearance has been updated.",
      });
    } catch (error) {
      console.error("Error saving theme:", error);
      toast({
        title: "Error",
        description: "Failed to save theme. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedThemeData = themes.find((t) => t.id === selectedTheme);

  // Get user data for preview
  const username = profile?.username || "username";
  const fullName = profile?.full_name || "Your Name";
  const bio = profile?.bio || "Creator & Entrepreneur";

  // Transform links for the preview
  const previewLinks = links.map((link: { id: string; title: string; url: string; is_active?: boolean | null }) => ({
    id: link.id,
    title: link.title,
    url: link.url,
    isActive: link.is_active ?? true,
  }));

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1">Appearance</h1>
              <p className="text-muted-foreground">
                Customize your profile's look and feel.
              </p>
            </div>
            <Button 
              className="gradient-button text-primary-foreground hover:opacity-90 gap-2"
              disabled={isSaving}
            >
              <Sparkles className="w-4 h-4" />
              {isSaving ? "Saving..." : "Enhance"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Categories & Themes */}
            <div className="lg:col-span-2 space-y-6">
              {/* Categories */}
              <div className="bg-card rounded-2xl p-4 shadow-lg">
                <div className="flex gap-2">
                  {categories.map((cat) => {
                    const IconComponent = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                          activeCategory === cat.id
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Themes Grid */}
              {activeCategory === "theme" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Theme</h2>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background">
                        Customizable
                      </button>
                      <button className="px-4 py-2 text-sm font-medium rounded-lg text-muted-foreground hover:bg-muted">
                        Curated
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {themes.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleSelectTheme(theme.id, theme.isPro)}
                        className={`relative group rounded-xl overflow-hidden aspect-[3/4] ${theme.background} border-2 transition-all ${
                          selectedTheme === theme.id
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-transparent hover:border-border"
                        }`}
                      >
                        {/* Theme Preview */}
                        <div className="absolute inset-0 p-3 flex flex-col items-center justify-center gap-2">
                          <span className={`text-lg font-bold ${theme.textColor}`}>Aa</span>
                          <div className={`w-3/4 h-6 rounded-lg ${theme.buttonStyle}`} />
                        </div>

                        {/* Pro Badge */}
                        {theme.isPro && (
                          <div className="absolute top-2 right-2">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                          </div>
                        )}

                        {/* Selected Check */}
                        {selectedTheme === theme.id && (
                          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}

                        {/* Theme Name */}
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                          <span className={`text-xs font-medium ${theme.textColor}`}>
                            {theme.name}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Wallpaper Section */}
              {activeCategory === "wallpaper" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-foreground mb-4">Wallpaper</h2>
                  <div className="grid grid-cols-3 gap-4">
                    {["None", "Gradient", "Pattern", "Image"].map((option) => (
                      <button
                        key={option}
                        className="aspect-square rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Section */}
              {activeCategory === "text" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-foreground mb-4">Text</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Font Family
                      </label>
                      <select className="w-full p-3 rounded-xl border border-border bg-background text-foreground">
                        <option>Inter</option>
                        <option>Roboto</option>
                        <option>Open Sans</option>
                        <option>Playfair Display</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Title Color
                      </label>
                      <input
                        type="color"
                        defaultValue="#1a1a2e"
                        className="w-full h-12 rounded-xl border border-border cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Buttons Section */}
              {activeCategory === "buttons" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-foreground mb-4">Buttons</h2>
                  <div className="grid grid-cols-2 gap-4">
                    {["Rounded", "Sharp", "Pill", "Outline"].map((style) => (
                      <button
                        key={style}
                        className={`p-4 rounded-xl border-2 ${
                          style === "Rounded"
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div
                          className={`w-full h-10 bg-foreground ${
                            style === "Pill"
                              ? "rounded-full"
                              : style === "Sharp"
                              ? "rounded-none"
                              : style === "Outline"
                              ? "bg-transparent border-2 border-foreground rounded-lg"
                              : "rounded-lg"
                          }`}
                        />
                        <p className="text-sm font-medium text-center mt-2 text-foreground">{style}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live Preview */}
            <div className="hidden lg:block">
              <ThemedProfilePreview
                username={username}
                fullName={fullName}
                bio={bio}
                theme={selectedThemeData}
                links={previewLinks}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardAppearance;
