import { useState, useEffect } from "react";
import { User, ExternalLink, Instagram, Youtube, Github, Linkedin, Globe, Share2, Music, MessageCircle } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";
import type { Theme } from "@/pages/DashboardAppearance";

interface PreviewLink {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  tiktok?: string;
  spotify?: string;
  whatsapp?: string;
}

interface CustomAppearance {
  wallpaperType?: string;
  backgroundGradient?: string;
  backgroundColor?: string;
  backgroundAnimation?: string;
  fontFamily?: string;
  titleColor?: string;
  bioColor?: string;
  buttonStyle?: string;
  buttonColor?: string;
}

interface ThemedProfilePreviewProps {
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  theme?: Theme;
  links?: PreviewLink[];
  socialLinks?: SocialLinks;
  customAppearance?: CustomAppearance;
}

const socialIcons = [
  { key: "twitter", Icon: XIcon, label: "X", color: "#000000" },
  { key: "instagram", Icon: Instagram, label: "Instagram", color: "#E4405F" },
  { key: "youtube", Icon: Youtube, label: "YouTube", color: "#FF0000" },
  { key: "github", Icon: Github, label: "GitHub", color: "#333" },
  { key: "linkedin", Icon: Linkedin, label: "LinkedIn", color: "#0A66C2" },
  { key: "tiktok", Icon: Music, label: "TikTok", color: "#000" },
  { key: "spotify", Icon: Music, label: "Spotify", color: "#1DB954" },
  { key: "whatsapp", Icon: MessageCircle, label: "WhatsApp", color: "#25D366" },
  { key: "website", Icon: Globe, label: "Website", color: "#6B7280" },
];

export const ThemedProfilePreview = ({
  username,
  fullName,
  bio,
  avatarUrl,
  theme,
  links,
  socialLinks,
  customAppearance,
}: ThemedProfilePreviewProps) => {
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(false);
    const timer = setTimeout(() => setAnimateIn(true), 50);
    return () => clearTimeout(timer);
  }, [theme?.id]);

  const defaultTheme = {
    background: "bg-white",
    buttonStyle: "bg-gray-900",
    textColor: "text-gray-900",
  };

  const activeTheme = theme || defaultTheme;

  // Compute effective background based on custom wallpaper settings
  const ca = customAppearance;
  const hasCustomWallpaper = ca?.wallpaperType && ca.wallpaperType !== "none";
  const isAnimated = ca?.wallpaperType === "animated";
  const effectiveBackground = hasCustomWallpaper
    ? ca?.wallpaperType === "gradient" || isAnimated
      ? `bg-gradient-to-br ${ca?.backgroundGradient || "from-purple-500 to-pink-500"}`
      : ca?.wallpaperType === "pattern"
        ? "bg-card bg-[radial-gradient(circle,_rgba(0,0,0,0.05)_1px,_transparent_1px)] bg-[size:16px_16px]"
        : activeTheme.background
    : activeTheme.background;

  // Animation class for animated wallpapers
  const animationClass = isAnimated ? `stl-anim-${ca?.backgroundAnimation || "aurora"}` : "";

  // Compute effective background style for solid color
  const bgStyle: React.CSSProperties = {};
  if (ca?.wallpaperType === "none" && ca?.backgroundColor) {
    bgStyle.backgroundColor = ca.backgroundColor;
  }

  // Compute effective button style
  const customBtnRadius = ca?.buttonStyle === "pill"
    ? "rounded-full"
    : ca?.buttonStyle === "sharp"
      ? "rounded-none"
      : ca?.buttonStyle === "outline"
        ? "rounded-xl bg-transparent border-2"
        : "rounded-xl";

  const hasCustomButton = !!(ca?.buttonColor || ca?.buttonStyle);
  const effectiveBtnClass = hasCustomButton ? customBtnRadius : activeTheme.buttonStyle;

  const btnInlineStyle: React.CSSProperties = ca?.buttonColor
    ? {
        backgroundColor: ca.buttonStyle === "outline" ? "transparent" : ca.buttonColor,
        borderColor: ca.buttonColor,
        color: ca.buttonStyle === "outline" ? ca.buttonColor : "#ffffff",
      }
    : {};

  const buttonTextColor = ca?.buttonColor
    ? (ca?.buttonStyle === "outline" ? "" : "text-white")
    : activeTheme.buttonStyle.includes("bg-white") ||
      activeTheme.buttonStyle.includes("bg-amber-100") ||
      activeTheme.buttonStyle.includes("bg-lime-") ||
      activeTheme.buttonStyle.includes("bg-amber-200") ||
      activeTheme.buttonStyle.includes("bg-yellow-")
        ? "text-gray-900"
        : "text-white";

  // Font and text color overrides
  const fontStyle: React.CSSProperties = ca?.fontFamily ? { fontFamily: ca.fontFamily } : {};
  const titleStyle: React.CSSProperties = ca?.titleColor ? { color: ca.titleColor, ...fontStyle } : fontStyle;
  const bioStyle: React.CSSProperties = ca?.bioColor ? { color: ca.bioColor, ...fontStyle } : fontStyle;

  const activeLinks = links ? links.filter((l) => l.isActive) : null;

  const hasSocials = socialLinks && Object.values(socialLinks).some(Boolean);

  // Detect social URLs from links themselves (for users who added social as links)
  const detectedSocials: SocialLinks = {};
  if (!hasSocials && activeLinks) {
    for (const link of activeLinks) {
      const url = link.url.toLowerCase();
      if (url.includes("twitter.com") || url.includes("x.com")) detectedSocials.twitter = link.url;
      if (url.includes("instagram.com")) detectedSocials.instagram = link.url;
      if (url.includes("youtube.com")) detectedSocials.youtube = link.url;
      if (url.includes("github.com")) detectedSocials.github = link.url;
      if (url.includes("linkedin.com")) detectedSocials.linkedin = link.url;
      if (url.includes("tiktok.com")) detectedSocials.tiktok = link.url;
      if (url.includes("spotify.com")) detectedSocials.spotify = link.url;
      if (url.includes("whatsapp.com") || url.includes("wa.me")) detectedSocials.whatsapp = link.url;
    }
  }

  const effectiveSocials = hasSocials ? socialLinks : detectedSocials;
  const hasEffectiveSocials = Object.values(effectiveSocials || {}).some(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Live Preview</h3>
        <a
          href={`/${username || "preview"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline font-medium"
        >
          View Profile
        </a>
      </div>

      <div className="relative mx-auto" style={{ width: "280px" }}>
        {/* Phone Frame */}
        <div className="absolute inset-0 bg-foreground rounded-[3rem] -z-10 scale-[1.02]" />
        <div className="bg-background rounded-[2.5rem] overflow-hidden border-4 border-foreground">
          {/* Phone Notch */}
          <div className="h-8 bg-foreground flex justify-center items-end pb-1">
            <div className="w-20 h-5 bg-background rounded-b-xl" />
          </div>

          {/* Profile Content */}
          <div className={`min-h-[480px] ${effectiveBackground} ${animationClass} overflow-y-auto`} style={{ maxHeight: "520px", ...bgStyle }}>
            {/* Share button */}
            <div className="flex justify-end px-4 pt-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm ${activeTheme.textColor}`}>
                <Share2 className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>

            {/* Avatar with entrance animation */}
            <div className="flex flex-col items-center px-5 pb-2">
              <div
                className={`w-20 h-20 rounded-full mb-3 flex items-center justify-center border-[3px] shadow-lg overflow-hidden bg-white/20 border-white/30 transition-all duration-500 ${
                  animateIn ? "opacity-100 scale-100" : "opacity-0 scale-75"
                }`}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <User className={`w-10 h-10 ${activeTheme.textColor} opacity-70`} />
                )}
              </div>

              <h4
                className={`font-bold text-base leading-tight text-center ${activeTheme.textColor} transition-all duration-500 delay-100 ${
                  animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
                style={titleStyle}
              >
                {fullName || "Your Name"}
              </h4>
              <p
                className={`text-[11px] opacity-60 mt-0.5 ${activeTheme.textColor} transition-all duration-500 delay-150 ${
                  animateIn ? "opacity-60" : "opacity-0"
                }`}
                style={fontStyle}
              >
                @{username || "username"}
              </p>
              {bio && (
                <p
                  className={`text-[11px] text-center mt-1.5 opacity-75 leading-relaxed px-2 ${activeTheme.textColor} transition-all duration-500 delay-200 ${
                    animateIn ? "opacity-75 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                  style={bioStyle}
                >
                  {bio.length > 80 ? bio.slice(0, 80) + "..." : bio}
                </p>
              )}

              {/* Social Icons -- detected from links or from profile */}
              {hasEffectiveSocials && (
                <div
                  className={`flex items-center gap-1.5 mt-3 transition-all duration-500 delay-300 ${
                    animateIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                >
                  {socialIcons.map(({ key, Icon, color }) => {
                    const value = effectiveSocials?.[key as keyof SocialLinks];
                    if (!value) return null;
                    return (
                      <a
                        key={key}
                        href={value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                        style={{ backgroundColor: `${color}22` }}
                      >
                        <Icon className="w-3 h-3" style={{ color }} />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Links with staggered entrance */}
            <div className="space-y-2 px-5 py-3">
              {activeLinks ? (
                activeLinks.length > 0 ? (
                  activeLinks.map((link, index) => (
                    <div
                      key={link.id}
                      className={`w-full py-2.5 px-3.5 font-medium flex items-center justify-between text-[12px] transition-all duration-300 hover:scale-[1.03] hover:shadow-md cursor-pointer ${hasCustomButton ? effectiveBtnClass : activeTheme.buttonStyle} ${buttonTextColor}`}
                      style={{
                        transitionDelay: animateIn ? `${350 + index * 80}ms` : "0ms",
                        opacity: animateIn ? 1 : 0,
                        transform: animateIn ? "translateY(0)" : "translateY(8px)",
                        ...btnInlineStyle,
                        ...fontStyle,
                      }}
                    >
                      <span className="truncate">{link.title}</span>
                      <ExternalLink className="w-3 h-3 opacity-60 shrink-0 ml-2" />
                    </div>
                  ))
                ) : (
                  <p className={`text-[11px] text-center py-4 opacity-40 ${activeTheme.textColor}`}>
                    Add links to see them here
                  </p>
                )
              ) : (
                ["My Website", "Latest Video", "Shop Now"].map((link, index) => (
                  <div
                    key={link}
                    className={`w-full py-2.5 px-3.5 font-medium flex items-center justify-between text-[12px] transition-all duration-300 hover:scale-[1.03] ${hasCustomButton ? effectiveBtnClass : activeTheme.buttonStyle} ${buttonTextColor}`}
                    style={{
                      transitionDelay: animateIn ? `${350 + index * 80}ms` : "0ms",
                      opacity: animateIn ? 1 : 0,
                      transform: animateIn ? "translateY(0)" : "translateY(8px)",
                      ...btnInlineStyle,
                      ...fontStyle,
                    }}
                  >
                    <span>{link}</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <p className={`text-[9px] text-center pb-4 mt-2 opacity-35 ${activeTheme.textColor}`}>
              Powered by Share The Link
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
