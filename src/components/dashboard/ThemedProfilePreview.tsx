import { User, ExternalLink } from "lucide-react";
import type { Theme } from "@/pages/DashboardAppearance";

interface ThemedProfilePreviewProps {
  username: string;
  fullName: string;
  bio?: string;
  theme?: Theme;
}

export const ThemedProfilePreview = ({ 
  username, 
  fullName, 
  bio,
  theme 
}: ThemedProfilePreviewProps) => {
  // Default theme if none selected
  const defaultTheme = {
    background: "bg-white",
    buttonStyle: "bg-gray-900",
    textColor: "text-gray-900",
  };

  const activeTheme = theme || defaultTheme;
  
  // Determine button text color based on button background
  const buttonTextColor = activeTheme.buttonStyle.includes("bg-white") || 
                          activeTheme.buttonStyle.includes("bg-amber-100") ||
                          activeTheme.buttonStyle.includes("bg-lime-") ||
                          activeTheme.buttonStyle.includes("bg-amber-200")
    ? "text-gray-900" 
    : "text-white";

  const sampleLinks = ["My Website", "Latest Video", "Shop Now"];

  return (
    <div className="sticky top-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">Live Preview</h3>
      <div className="relative mx-auto" style={{ width: "280px" }}>
        {/* Phone Frame */}
        <div className="absolute inset-0 bg-foreground rounded-[3rem] -z-10 scale-[1.02]" />
        <div className="bg-background rounded-[2.5rem] overflow-hidden border-4 border-foreground">
          {/* Phone Notch */}
          <div className="h-8 bg-foreground flex justify-center items-end pb-1">
            <div className="w-20 h-5 bg-background rounded-b-xl" />
          </div>

          {/* Profile Content */}
          <div className={`min-h-[500px] p-6 ${activeTheme.background}`}>
            {/* Avatar */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-300/50 mb-3 flex items-center justify-center border-2 border-white/20">
                <User className={`w-10 h-10 ${activeTheme.textColor} opacity-70`} />
              </div>
              <h4 className={`font-bold text-lg ${activeTheme.textColor}`}>
                {fullName || "Your Name"}
              </h4>
              <p className={`text-sm opacity-70 ${activeTheme.textColor}`}>
                @{username || "username"}
              </p>
              {bio && (
                <p className={`text-sm text-center mt-2 opacity-80 ${activeTheme.textColor}`}>
                  {bio}
                </p>
              )}
            </div>

            {/* Sample Links */}
            <div className="space-y-3">
              {sampleLinks.map((link) => (
                <div
                  key={link}
                  className={`w-full py-3 px-4 rounded-xl font-medium flex items-center justify-between ${activeTheme.buttonStyle} ${buttonTextColor}`}
                >
                  <span>{link}</span>
                  <ExternalLink className="w-4 h-4 opacity-70" />
                </div>
              ))}
            </div>

            {/* Footer */}
            <p className={`text-xs text-center mt-8 opacity-50 ${activeTheme.textColor}`}>
              Powered by Share The Link
            </p>
          </div>
        </div>
      </div>

      {/* View Profile Link */}
      <div className="text-center mt-4">
        <a
          href={`/${username || "preview"}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline"
        >
          Open full preview →
        </a>
      </div>
    </div>
  );
};
