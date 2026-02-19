import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { Palette, Image, Type, Square, Sparkles, Check, Upload, Loader2 } from "lucide-react";
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

const FONT_OPTIONS = [
  "Inter", "Roboto", "Open Sans", "Playfair Display", "Montserrat", "Lato",
  "Poppins", "Raleway", "Merriweather", "Oswald", "Nunito", "Source Sans Pro",
];

const WALLPAPER_OPTIONS = [
  { id: "none", label: "None", preview: "bg-card" },
  { id: "gradient", label: "Gradient", preview: "bg-gradient-to-br from-purple-500 to-pink-500" },
  { id: "pattern", label: "Pattern", preview: "bg-card bg-[radial-gradient(circle,_rgba(0,0,0,0.05)_1px,_transparent_1px)] bg-[size:16px_16px]" },
  { id: "image", label: "Image", preview: "bg-card" },
];

const GRADIENT_OPTIONS = [
  { id: "purple-pink", label: "Purple Sunset", value: "from-purple-500 to-pink-500" },
  { id: "blue-cyan", label: "Ocean Blue", value: "from-blue-500 to-cyan-400" },
  { id: "green-teal", label: "Forest Green", value: "from-green-500 to-teal-400" },
  { id: "orange-red", label: "Warm Fire", value: "from-orange-400 to-red-500" },
  { id: "pink-rose", label: "Rose Pink", value: "from-pink-400 to-rose-300" },
  { id: "slate-gray", label: "Dark Slate", value: "from-slate-700 to-gray-900" },
  { id: "amber-yellow", label: "Golden Hour", value: "from-amber-400 to-yellow-300" },
  { id: "indigo-violet", label: "Deep Indigo", value: "from-indigo-500 to-violet-500" },
];

const BUTTON_STYLES = [
  { id: "rounded", label: "Rounded", className: "rounded-lg" },
  { id: "sharp", label: "Sharp", className: "rounded-none" },
  { id: "pill", label: "Pill", className: "rounded-full" },
  { id: "outline", label: "Outline", className: "rounded-lg bg-transparent border-2 border-foreground" },
];

const DashboardAppearance = () => {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { settings, updateSettings } = useAppearanceSettings();
  const { links } = useLinks();
  const [selectedTheme, setSelectedTheme] = useState("air");
  const [activeCategory, setActiveCategory] = useState("theme");
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Appearance state
  const [wallpaperType, setWallpaperType] = useState("none");
  const [backgroundGradient, setBackgroundGradient] = useState("from-purple-500 to-pink-500");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [titleColor, setTitleColor] = useState("#1a1a2e");
  const [bioColor, setBioColor] = useState("#6b7280");
  const [buttonStyle, setButtonStyle] = useState("rounded");
  const [buttonColor, setButtonColor] = useState("#1a1a2e");

  // Load settings from DB
  useEffect(() => {
    if (settings) {
      if (settings.theme) setSelectedTheme(settings.theme);
      if (settings.background_type) setWallpaperType(settings.background_type);
      if (settings.background_gradient) setBackgroundGradient(settings.background_gradient);
      if (settings.background_color) setBackgroundColor(settings.background_color);
      if (settings.font_family) setFontFamily(settings.font_family);
      if (settings.title_color) setTitleColor(settings.title_color);
      if (settings.bio_color) setBioColor(settings.bio_color);
      if (settings.button_style) setButtonStyle(settings.button_style);
      if (settings.button_color) setButtonColor(settings.button_color);
    }
  }, [settings]);

  const saveSettings = async (updates: Record<string, string>) => {
    setIsSaving(true);
    try {
      await updateSettings(updates as any);
      toast({ title: "Saved!", description: "Appearance updated." });
    } catch (error) {
      console.error("Error saving:", error);
      toast({ title: "Error", description: "Failed to save. Try again.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTheme = async (themeId: string, isPro?: boolean) => {
    if (isPro) {
      toast({ title: "Pro Feature", description: "Upgrade to Pro to unlock this theme!" });
      return;
    }
    setSelectedTheme(themeId);
    await saveSettings({ theme: themeId });
  };

  const handleWallpaperType = async (type: string) => {
    setWallpaperType(type);
    await saveSettings({ background_type: type });
  };

  const handleGradient = async (gradient: string) => {
    setBackgroundGradient(gradient);
    await saveSettings({ background_gradient: gradient });
  };

  const handleBackgroundColor = async (color: string) => {
    setBackgroundColor(color);
    await saveSettings({ background_color: color });
  };

  const handleFontFamily = async (font: string) => {
    setFontFamily(font);
    await saveSettings({ font_family: font });
  };

  const handleTitleColor = async (color: string) => {
    setTitleColor(color);
    await saveSettings({ title_color: color });
  };

  const handleBioColor = async (color: string) => {
    setBioColor(color);
    await saveSettings({ bio_color: color });
  };

  const handleButtonStyle = async (style: string) => {
    setButtonStyle(style);
    await saveSettings({ button_style: style });
  };

  const handleButtonColor = async (color: string) => {
    setButtonColor(color);
    await saveSettings({ button_color: color });
  };

  // Enhance button -- auto-pick appealing settings based on profile
  const handleEnhance = async () => {
    setIsEnhancing(true);
    try {
      const bio = profile?.bio?.toLowerCase() || "";
      const name = profile?.full_name?.toLowerCase() || "";
      const combined = `${bio} ${name}`;

      // Detect category and auto-apply a matching theme + settings
      let enhancedSettings: Record<string, string> = {};

      if (/pastor|church|ministry|faith|worship|sermon|gospel|prayer/i.test(combined)) {
        enhancedSettings = {
          theme: "twilight",
          background_type: "gradient",
          background_gradient: "from-indigo-500 to-violet-500",
          font_family: "Playfair Display",
          title_color: "#4c1d95",
          bio_color: "#6d28d9",
          button_style: "rounded",
          button_color: "#7c3aed",
        };
      } else if (/music|artist|dj|singer|rapper|producer/i.test(combined)) {
        enhancedSettings = {
          theme: "lake",
          background_type: "gradient",
          background_gradient: "from-slate-700 to-gray-900",
          font_family: "Montserrat",
          title_color: "#ffffff",
          bio_color: "#94a3b8",
          button_style: "pill",
          button_color: "#e11d48",
        };
      } else if (/fitness|coach|trainer|health|wellness|gym/i.test(combined)) {
        enhancedSettings = {
          theme: "grid",
          background_type: "gradient",
          background_gradient: "from-green-500 to-teal-400",
          font_family: "Poppins",
          title_color: "#064e3b",
          bio_color: "#047857",
          button_style: "pill",
          button_color: "#059669",
        };
      } else if (/photo|video|creative|film|camera/i.test(combined)) {
        enhancedSettings = {
          theme: "bloom",
          background_type: "gradient",
          background_gradient: "from-slate-700 to-gray-900",
          font_family: "Inter",
          title_color: "#f8fafc",
          bio_color: "#94a3b8",
          button_style: "rounded",
          button_color: "#f472b6",
        };
      } else if (/shop|store|product|fashion|boutique/i.test(combined)) {
        enhancedSettings = {
          theme: "mineral",
          background_type: "gradient",
          background_gradient: "from-amber-400 to-yellow-300",
          font_family: "Raleway",
          title_color: "#78350f",
          bio_color: "#92400e",
          button_style: "rounded",
          button_color: "#d97706",
        };
      } else if (/tech|developer|engineer|code|startup|saas/i.test(combined)) {
        enhancedSettings = {
          theme: "lake",
          background_type: "none",
          font_family: "Inter",
          title_color: "#f8fafc",
          bio_color: "#94a3b8",
          button_style: "sharp",
          button_color: "#3b82f6",
        };
      } else {
        // Default professional enhance
        enhancedSettings = {
          theme: "agate",
          background_type: "gradient",
          background_gradient: "from-purple-500 to-pink-500",
          font_family: "Poppins",
          title_color: "#ffffff",
          bio_color: "#e2e8f0",
          button_style: "pill",
          button_color: "#8b5cf6",
        };
      }

      // Apply all at once
      await updateSettings(enhancedSettings as any);

      // Update local state
      if (enhancedSettings.theme) setSelectedTheme(enhancedSettings.theme);
      if (enhancedSettings.background_type) setWallpaperType(enhancedSettings.background_type);
      if (enhancedSettings.background_gradient) setBackgroundGradient(enhancedSettings.background_gradient);
      if (enhancedSettings.font_family) setFontFamily(enhancedSettings.font_family);
      if (enhancedSettings.title_color) setTitleColor(enhancedSettings.title_color);
      if (enhancedSettings.bio_color) setBioColor(enhancedSettings.bio_color);
      if (enhancedSettings.button_style) setButtonStyle(enhancedSettings.button_style);
      if (enhancedSettings.button_color) setButtonColor(enhancedSettings.button_color);

      toast({ title: "Enhanced!", description: "Your profile has been auto-styled based on your niche." });
    } catch (error) {
      console.error("Enhance error:", error);
      toast({ title: "Error", description: "Failed to enhance. Try again.", variant: "destructive" });
    } finally {
      setIsEnhancing(false);
    }
  };

  const selectedThemeData = themes.find((t) => t.id === selectedTheme);
  const username = profile?.username || "username";
  const fullName = profile?.full_name || "Your Name";
  const bio = profile?.bio || "Creator & Entrepreneur";
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
              <p className="text-muted-foreground">Customize your profile's look and feel.</p>
            </div>
            <Button
              className="gradient-button text-primary-foreground hover:opacity-90 gap-2"
              disabled={isEnhancing || isSaving}
              onClick={handleEnhance}
            >
              {isEnhancing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isEnhancing ? "Enhancing..." : "Enhance"}
            </Button>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left: Categories & Content */}
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

              {/* THEME TAB */}
              {activeCategory === "theme" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg">
                  <h2 className="text-xl font-bold text-foreground mb-6">Theme</h2>
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
                        <div className="absolute inset-0 p-3 flex flex-col items-center justify-center gap-2">
                          <span className={`text-lg font-bold ${theme.textColor}`}>Aa</span>
                          <div className={`w-3/4 h-6 rounded-lg ${theme.buttonStyle}`} />
                        </div>
                        {theme.isPro && (
                          <div className="absolute top-2 right-2">
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                          </div>
                        )}
                        {selectedTheme === theme.id && (
                          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-2 text-center">
                          <span className={`text-xs font-medium ${theme.textColor}`}>{theme.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* WALLPAPER TAB */}
              {activeCategory === "wallpaper" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Wallpaper</h2>

                  {/* Wallpaper Type Selection */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {WALLPAPER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleWallpaperType(option.id)}
                        className={`aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all border-2 ${option.preview} ${
                          wallpaperType === option.id
                            ? "border-primary ring-2 ring-primary ring-offset-2"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        {wallpaperType === option.id && (
                          <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <span className="text-muted-foreground">{option.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Gradient Picker */}
                  {wallpaperType === "gradient" && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-3 block">Choose Gradient</label>
                      <div className="grid grid-cols-4 gap-3">
                        {GRADIENT_OPTIONS.map((grad) => (
                          <button
                            key={grad.id}
                            onClick={() => handleGradient(grad.value)}
                            className={`h-16 rounded-xl bg-gradient-to-br ${grad.value} border-2 transition-all ${
                              backgroundGradient === grad.value
                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                : "border-transparent hover:border-border"
                            }`}
                            title={grad.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solid Color Picker */}
                  {wallpaperType === "none" && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">Background Color</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          onBlur={(e) => handleBackgroundColor(e.target.value)}
                          className="w-14 h-14 rounded-xl border border-border cursor-pointer"
                        />
                        <span className="text-sm text-muted-foreground">{backgroundColor}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TEXT TAB */}
              {activeCategory === "text" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Text</h2>

                  {/* Font Family */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Font Family</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => handleFontFamily(e.target.value)}
                      className="w-full p-3 rounded-xl border border-border bg-background text-foreground"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-1" style={{ fontFamily }}>
                      Preview: The quick brown fox jumps over the lazy dog.
                    </p>
                  </div>

                  {/* Title Color */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Title Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={titleColor}
                        onChange={(e) => setTitleColor(e.target.value)}
                        onBlur={(e) => handleTitleColor(e.target.value)}
                        className="w-full h-12 rounded-xl border border-border cursor-pointer"
                      />
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-muted">
                      <span style={{ color: titleColor, fontFamily }} className="font-bold text-lg">
                        {profile?.full_name || "Your Name"}
                      </span>
                    </div>
                  </div>

                  {/* Bio Color */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Bio / Description Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bioColor}
                        onChange={(e) => setBioColor(e.target.value)}
                        onBlur={(e) => handleBioColor(e.target.value)}
                        className="w-full h-12 rounded-xl border border-border cursor-pointer"
                      />
                    </div>
                    <div className="mt-2 p-3 rounded-lg bg-muted">
                      <span style={{ color: bioColor, fontFamily }} className="text-sm">
                        {profile?.bio || "Your bio text will appear like this."}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* BUTTONS TAB */}
              {activeCategory === "buttons" && (
                <div className="bg-card rounded-2xl p-6 shadow-lg space-y-6">
                  <h2 className="text-xl font-bold text-foreground">Buttons</h2>

                  {/* Button Shape */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-3 block">Button Shape</label>
                    <div className="grid grid-cols-2 gap-4">
                      {BUTTON_STYLES.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => handleButtonStyle(style.id)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            buttonStyle === style.id
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div
                            className={`w-full h-10 ${style.className} ${
                              style.id === "outline" ? "" : "bg-foreground"
                            }`}
                          />
                          <p className="text-sm font-medium text-center mt-2 text-foreground">{style.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Button Color */}
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">Button Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={buttonColor}
                        onChange={(e) => setButtonColor(e.target.value)}
                        onBlur={(e) => handleButtonColor(e.target.value)}
                        className="w-14 h-14 rounded-xl border border-border cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground">{buttonColor}</span>
                    </div>
                    <div className="mt-3">
                      <div
                        className={`w-full py-3 px-4 text-center text-white font-medium ${
                          buttonStyle === "pill" ? "rounded-full" :
                          buttonStyle === "sharp" ? "rounded-none" :
                          buttonStyle === "outline" ? "rounded-lg bg-transparent border-2" :
                          "rounded-lg"
                        }`}
                        style={{
                          backgroundColor: buttonStyle === "outline" ? "transparent" : buttonColor,
                          borderColor: buttonColor,
                          color: buttonStyle === "outline" ? buttonColor : "#ffffff",
                        }}
                      >
                        Button Preview
                      </div>
                    </div>
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
