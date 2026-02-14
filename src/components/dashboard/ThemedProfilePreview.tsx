import { User, ExternalLink, Twitter, Instagram, Youtube, Github, Linkedin, Globe, Share2 } from "lucide-react";
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
}

interface ThemedProfilePreviewProps {
  username: string;
  fullName: string;
  bio?: string;
  avatarUrl?: string;
  theme?: Theme;
  links?: PreviewLink[];
  socialLinks?: SocialLinks;
}

const socialIcons = [
  { key: "twitter", Icon: Twitter, label: "Twitter" },
  { key: "instagram", Icon: Instagram, label: "Instagram" },
  { key: "youtube", Icon: Youtube, label: "YouTube" },
  { key: "github", Icon: Github, label: "GitHub" },
  { key: "linkedin", Icon: Linkedin, label: "LinkedIn" },
  { key: "website", Icon: Globe, label: "Website" },
];

export const ThemedProfilePreview = ({
  username,
  fullName,
  bio,
  avatarUrl,
  theme,
  links,
  socialLinks,
}: ThemedProfilePreviewProps) => {
  const defaultTheme = {
    background: "bg-white",
    buttonStyle: "bg-gray-900",
    textColor: "text-gray-900",
  };

  const activeTheme = theme || defaultTheme;

  const buttonTextColor =
    activeTheme.buttonStyle.includes("bg-white") ||
    activeTheme.buttonStyle.includes("bg-amber-100") ||
    activeTheme.buttonStyle.includes("bg-lime-") ||
    activeTheme.buttonStyle.includes("bg-amber-200")
      ? "text-gray-900"
      : "text-white";

  const activeLinks = links ? links.filter((l) => l.isActive) : null;

  const hasSocials = socialLinks && Object.values(socialLinks).some(Boolean);

  return (
    <div className="sticky top-8">
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
          <div className={`min-h-[480px] ${activeTheme.background} overflow-y-auto`} style={{ maxHeight: "520px" }}>
            {/* Share button */}
            <div className="flex justify-end px-4 pt-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm ${activeTheme.textColor}`}>
                <Share2 className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>

            {/* Avatar */}
            <div className="flex flex-col items-center px-5 pb-2">
              <div className="w-20 h-20 rounded-full mb-3 flex items-center justify-center border-[3px] shadow-lg overflow-hidden bg-white/20 border-white/30">
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

              <h4 className={`font-bold text-base leading-tight text-center ${activeTheme.textColor}`}>
                {fullName || "Your Name"}
              </h4>
              <p className={`text-[11px] opacity-60 mt-0.5 ${activeTheme.textColor}`}>
                @{username || "username"}
              </p>
              {bio && (
                <p className={`text-[11px] text-center mt-1.5 opacity-75 leading-relaxed px-2 ${activeTheme.textColor}`}>
                  {bio.length > 80 ? bio.slice(0, 80) + "..." : bio}
                </p>
              )}

              {/* Social Icons */}
              {hasSocials && (
                <div className="flex items-center gap-2 mt-3">
                  {socialIcons.map(({ key, Icon }) => {
                    const value = socialLinks?.[key as keyof SocialLinks];
                    if (!value) return null;
                    return (
                      <div
                        key={key}
                        className={`w-7 h-7 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm ${activeTheme.textColor}`}
                      >
                        <Icon className="w-3 h-3 opacity-80" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Links */}
            <div className="space-y-2 px-5 py-3">
              {activeLinks ? (
                activeLinks.length > 0 ? (
                  activeLinks.map((link) => (
                    <div
                      key={link.id}
                      className={`w-full py-2.5 px-3.5 rounded-xl font-medium flex items-center justify-between text-[12px] transition-transform hover:scale-[1.02] ${activeTheme.buttonStyle} ${buttonTextColor}`}
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
                ["My Website", "Latest Video", "Shop Now"].map((link) => (
                  <div
                    key={link}
                    className={`w-full py-2.5 px-3.5 rounded-xl font-medium flex items-center justify-between text-[12px] ${activeTheme.buttonStyle} ${buttonTextColor}`}
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
