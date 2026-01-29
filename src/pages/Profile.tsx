import { useParams, Link } from "react-router-dom";
import { User, Share2, ExternalLink, Eye, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
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
      } catch (err) {
        console.error('Unexpected error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

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
          <div className="w-28 h-28 rounded-full bg-primary-foreground/20 backdrop-blur-lg mx-auto mb-4 flex items-center justify-center border-4 border-primary-foreground/30 shadow-xl overflow-hidden">
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-14 h-14 text-primary-foreground" />
            )}
          </div>

          {/* Name */}
          <h1 className="text-2xl font-bold text-primary-foreground mb-1">
            {profile?.full_name || username}
          </h1>

          {/* Username */}
          <p className="text-primary-foreground/70 mb-3">@{username}</p>

          {/* Bio */}
          {profile?.bio && (
            <p className="text-primary-foreground/90 max-w-sm mx-auto mb-6">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Links */}
        <div className="space-y-4">
          {links.length > 0 ? (
            links.map((link, index) => (
              <button
                key={link.id}
                onClick={() => handleLinkClick(link.id, link.url)}
                className="w-full text-left rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl animate-fade-in bg-primary-foreground"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="font-semibold text-foreground block">
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
                  <ExternalLink className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))
          ) : (
            <div className="text-center text-primary-foreground/50 py-8">
              No links yet
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <Link
            to="/"
            className="text-sm text-primary-foreground/40 hover:text-primary-foreground/60 transition-colors"
          >
            Powered by Share The Link
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Profile;
