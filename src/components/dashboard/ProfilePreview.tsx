import { User, ExternalLink } from "lucide-react";

interface Link {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
}

interface ProfilePreviewProps {
  username: string;
  fullName: string;
  bio?: string;
  links: Link[];
}

export const ProfilePreview = ({ username, fullName, bio, links }: ProfilePreviewProps) => {
  const activeLinks = links.filter((link) => link.isActive);

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4">Live Preview</h3>
      
      {/* Phone Frame */}
      <div className="relative w-full max-w-[280px] mx-auto">
        {/* Phone Border */}
        <div className="relative bg-foreground rounded-[3rem] p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-background rounded-[2.5rem] overflow-hidden">
            {/* Notch */}
            <div className="h-8 bg-background flex items-center justify-center">
              <div className="w-20 h-5 bg-foreground rounded-full" />
            </div>

            {/* Content */}
            <div className="min-h-[500px] gradient-bg p-6">
              <div className="text-center pt-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-primary-foreground/20 backdrop-blur-lg mx-auto mb-4 flex items-center justify-center border-2 border-primary-foreground/30">
                  <User className="w-10 h-10 text-primary-foreground" />
                </div>

                {/* Name */}
                <h4 className="text-lg font-bold text-primary-foreground mb-1">
                  {fullName || "Your Name"}
                </h4>
                
                {/* Username */}
                <p className="text-sm text-primary-foreground/70 mb-2">
                  @{username || "username"}
                </p>

                {/* Bio */}
                {bio && (
                  <p className="text-sm text-primary-foreground/80 mb-6">
                    {bio}
                  </p>
                )}

                {/* Links */}
                <div className="space-y-3 mt-6">
                  {activeLinks.length > 0 ? (
                    activeLinks.map((link) => (
                      <div
                        key={link.id}
                        className="bg-primary-foreground rounded-xl p-3 hover:scale-105 transition-transform cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground text-sm">
                            {link.title}
                          </span>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-primary-foreground/50 text-sm py-8">
                      Add links to see them here
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <p className="text-xs text-primary-foreground/40">
                  Powered by Share The Link
                </p>
              </div>
            </div>
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
