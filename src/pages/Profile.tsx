import { useParams, Link } from "react-router-dom";
import { User, Share2, ExternalLink, Loader2, Twitter, Instagram, Youtube, Github, Globe, Linkedin, Music, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { themes } from "@/pages/DashboardAppearance";

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

interface ProfileData {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  social_links?: SocialLinks;
}

interface LinkData {
  id: string;
  title: string;
  url: string;
  link_type: string;
  link_position: number;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [themeId, setThemeId] = useState<string>("air");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Fetch profile using RPC function
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_public_profile', { lookup_username: username });

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!profileData || profileData.length === 0) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile(profileData[0] as ProfileData);

        // Fetch links using RPC function
        const { data: linksData, error: linksError } = await supabase
          .rpc('get_public_links', { lookup_username: username });

        if (linksError) {
          console.error('Links fetch error:', linksError);
        } else {
          setLinks((linksData || []) as LinkData[]);
        }

        // Fetch appearance settings for this user
        const { data: profileRecord } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("username", username)
          .single();

        if (profileRecord) {
          const { data: appearanceData } = await supabase
            .from("appearance_settings")
            .select("theme")
            .eq("user_id", profileRecord.user_id)
            .single();

          if (appearanceData?.theme) {
            setThemeId(appearanceData.theme);
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // Get theme data
  const currentTheme = themes.find((t) => t.id === themeId) || themes[0];

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

  const handleLinkClick = async (linkId: string, url: string) => {
    // Track the click
    try {
      await supabase.rpc('increment_link_click' as never, { link_id: linkId } as never);
    } catch (err) {
      // Silently fail - don't block the user
      console.error('Click tracking failed:', err);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center text-primary-foreground">
          <h1 className="text-4xl font-bold mb-4">Profile not found</h1>
          <p className="text-primary-foreground/70 mb-6">
            This username doesn't exist yet.
          </p>
          <Link
            to="/signup"
            className="inline-block px-6 py-3 bg-primary-foreground text-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Claim this username
          </Link>
        </div>
      </div>
    );
  }

  // Auto-detect social links from regular links if social_links isn't populated
  const detectedSocials: SocialLinks = { ...(profile?.social_links || {}) };
  const hasSocialsFromProfile = profile?.social_links && Object.values(profile.social_links).some(Boolean);
  if (!hasSocialsFromProfile && links.length > 0) {
    for (const link of links) {
      const url = link.url?.toLowerCase() || "";
      if (url.includes("twitter.com") || url.includes("x.com")) detectedSocials.twitter = link.url;
      if (url.includes("instagram.com")) detectedSocials.instagram = link.url;
      if (url.includes("youtube.com")) detectedSocials.youtube = link.url;
      if (url.includes("github.com")) detectedSocials.github = link.url;
      if (url.includes("linkedin.com")) detectedSocials.linkedin = link.url;
    }
  }
  const hasAnySocials = Object.values(detectedSocials).some(Boolean);

  return (
    <div className={`min-h-screen ${currentTheme.background} py-12 px-4`}>
      {/* Top-left logo */}
      <Link
        to="/"
        className={`fixed top-4 left-4 z-10 opacity-60 hover:opacity-100 transition-opacity`}
      >
        <Logo textClassName={`${currentTheme.textColor} text-sm`} />
      </Link>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className={`fixed top-4 right-4 p-3 rounded-full backdrop-blur-lg hover:opacity-80 transition-colors z-10 ${currentTheme.textColor} bg-white/10`}
        aria-label="Share profile"
      >
        <Share2 className="w-5 h-5" />
      </button>

      <div className="max-w-lg mx-auto">
        {/* Profile Card */}
        <div className="text-center mb-8 animate-fade-in">
          {/* Avatar */}
          <div className={`w-28 h-28 rounded-full backdrop-blur-lg mx-auto mb-4 flex items-center justify-center border-4 shadow-xl overflow-hidden bg-white/20 border-white/30`}>
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className={`w-14 h-14 ${currentTheme.textColor}`} />
            )}
          </div>

          {/* Name */}
          <h1 className={`text-2xl font-bold ${currentTheme.textColor} mb-1`}>
            {profile?.full_name || username}
          </h1>

          {/* Username */}
          <p className={`${currentTheme.textColor} opacity-70 mb-3`}>@{username}</p>

          {/* Bio */}
          {profile?.bio && (
            <p className={`${currentTheme.textColor} opacity-90 max-w-sm mx-auto mb-4`}>
              {profile.bio}
            </p>
          )}

          {/* Social Media Icons */}
          {hasAnySocials && (
            <div className="flex items-center justify-center gap-3 mb-6">
              {detectedSocials.twitter && (
                <a href={detectedSocials.twitter.startsWith("http") ? detectedSocials.twitter : `https://twitter.com/${detectedSocials.twitter}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-sky-500 text-white shadow-md" aria-label="Twitter">
                  <Twitter className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.instagram && (
                <a href={detectedSocials.instagram.startsWith("http") ? detectedSocials.instagram : `https://instagram.com/${detectedSocials.instagram}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-md" aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.youtube && (
                <a href={detectedSocials.youtube.startsWith("http") ? detectedSocials.youtube : `https://youtube.com/${detectedSocials.youtube}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-red-600 text-white shadow-md" aria-label="YouTube">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.github && (
                <a href={detectedSocials.github.startsWith("http") ? detectedSocials.github : `https://github.com/${detectedSocials.github}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-gray-800 text-white shadow-md" aria-label="GitHub">
                  <Github className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.linkedin && (
                <a href={detectedSocials.linkedin.startsWith("http") ? detectedSocials.linkedin : `https://linkedin.com/in/${detectedSocials.linkedin}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-blue-700 text-white shadow-md" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.website && (
                <a href={detectedSocials.website.startsWith("http") ? detectedSocials.website : `https://${detectedSocials.website}`} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-white/20 backdrop-blur-sm shadow-md ${currentTheme.textColor}`} aria-label="Website">
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4">
          {links.length > 0 ? (
            links.map((link, index) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url)}
                className={`w-full text-left rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in ${currentTheme.buttonStyle}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className={`font-semibold block ${currentTheme.buttonStyle.includes("bg-white") || currentTheme.buttonStyle.includes("bg-amber-100") || currentTheme.buttonStyle.includes("bg-lime-") || currentTheme.buttonStyle.includes("bg-amber-200") ? "text-gray-900" : "text-white"}`}>
                      {link.title}
                    </span>
                    {link.link_type === "product" && (
                      <span className="text-xs text-accent font-medium">
                        🛒 Product
                      </span>
                    )}
                    {link.link_type === "video" && (
                      <span className="text-xs text-destructive font-medium">
                        ▶️ Video
                      </span>
                    )}
                  </div>
                  <ExternalLink className={`w-5 h-5 opacity-70 ${currentTheme.buttonStyle.includes("bg-white") || currentTheme.buttonStyle.includes("bg-amber-100") || currentTheme.buttonStyle.includes("bg-lime-") || currentTheme.buttonStyle.includes("bg-amber-200") ? "text-gray-900" : "text-white"}`} />
                </div>
              </button>
            ))
          ) : (
            <div className={`text-center ${currentTheme.textColor} opacity-50 py-8`}>
              No links yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className={`text-sm ${currentTheme.textColor} opacity-40 hover:opacity-60 transition-colors`}
          >
            Powered by Share The Link
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
