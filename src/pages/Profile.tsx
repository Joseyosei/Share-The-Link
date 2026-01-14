import { useParams } from "react-router-dom";
import { User, Share2, Instagram, Twitter, Youtube, ExternalLink, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Mock data - in production this would come from an API
const mockProfiles: Record<string, {
  username: string;
  fullName: string;
  bio: string;
  views: number;
  links: { id: string; title: string; url: string; type: string; clicks: number }[];
  socials: { platform: string; url: string }[];
}> = {
  johndoe: {
    username: "johndoe",
    fullName: "John Doe",
    bio: "Entrepreneur & Creator | Building cool stuff 🚀",
    views: 1234,
    links: [
      { id: "1", title: "My Portfolio", url: "https://portfolio.com", type: "standard", clicks: 234 },
      { id: "2", title: "Buy My Course - 50% OFF", url: "https://course.com", type: "product", clicks: 156 },
      { id: "3", title: "Watch My Latest Video", url: "https://youtube.com", type: "video", clicks: 89 },
      { id: "4", title: "Free Newsletter", url: "https://newsletter.com", type: "standard", clicks: 67 },
    ],
    socials: [
      { platform: "instagram", url: "https://instagram.com" },
      { platform: "twitter", url: "https://twitter.com" },
      { platform: "youtube", url: "https://youtube.com" },
    ],
  },
};

const socialIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
};

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const profile = username ? mockProfiles[username] : null;

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Share this link with your audience.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleLinkClick = (linkId: string, url: string) => {
    // In production, this would track the click
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!profile) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center text-primary-foreground">
          <h1 className="text-4xl font-bold mb-4">Profile not found</h1>
          <p className="text-primary-foreground/70 mb-6">
            This username doesn't exist yet.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-primary-foreground text-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Claim this username
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg py-12 px-4">
      {/* Share Button */}
      <button
        onClick={handleShare}
        className="fixed top-4 right-4 p-3 rounded-full bg-primary-foreground/10 backdrop-blur-lg text-primary-foreground hover:bg-primary-foreground/20 transition-colors z-10"
        aria-label="Share profile"
      >
        <Share2 className="w-5 h-5" />
      </button>

      <div className="max-w-lg mx-auto">
        {/* Profile Card */}
        <div className="text-center mb-8 animate-fade-in">
          {/* Avatar */}
          <div className="w-28 h-28 rounded-full bg-primary-foreground/20 backdrop-blur-lg mx-auto mb-4 flex items-center justify-center border-4 border-primary-foreground/30 shadow-xl">
            <User className="w-14 h-14 text-primary-foreground" />
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-primary-foreground mb-1">
            {profile.fullName}
          </h1>

          {/* Username */}
          <p className="text-primary-foreground/70 mb-3">@{profile.username}</p>

          {/* Bio */}
          <p className="text-primary-foreground/90 max-w-sm mx-auto mb-6">
            {profile.bio}
          </p>

          {/* Social Icons */}
          {profile.socials.length > 0 && (
            <div className="flex items-center justify-center gap-4 mb-8">
              {profile.socials.map((social) => {
                const Icon = socialIcons[social.platform];
                return (
                  <a
                    key={social.platform}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-primary-foreground/10 backdrop-blur-lg flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 hover:scale-110 transition-all"
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4">
          {profile.links.map((link, index) => (
            <button
              key={link.id}
              onClick={() => handleLinkClick(link.id, link.url)}
              className={`w-full text-left rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in ${
                link.type === "product"
                  ? "bg-primary-foreground border-2 border-accent"
                  : link.type === "video"
                  ? "bg-primary-foreground border-2 border-destructive/50"
                  : "bg-primary-foreground"
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <span className="font-semibold text-foreground block">
                    {link.title}
                  </span>
                  {link.type === "product" && (
                    <span className="text-xs text-accent font-medium">
                      🛒 Product
                    </span>
                  )}
                  {link.type === "video" && (
                    <span className="text-xs text-destructive font-medium">
                      ▶️ Video
                    </span>
                  )}
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        {/* View Counter */}
        <div className="flex items-center justify-center gap-2 mt-12 text-primary-foreground/50">
          <Eye className="w-4 h-4" />
          <span className="text-sm">{profile.views.toLocaleString()} views</span>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <a
            href="/"
            className="text-sm text-primary-foreground/40 hover:text-primary-foreground/60 transition-colors"
          >
            Powered by Share The Link
          </a>
        </div>
      </div>
    </div>
  );
};

export default Profile;
