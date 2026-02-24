import { useState, useEffect } from "react";
import { Users, Linkedin, Twitter, Globe } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { supabase } from "@/integrations/supabase/client";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string>;
  display_order: number;
}

interface SiteContent {
  id: string;
  content_type: string;
  title: string | null;
  body: string | null;
  media_url: string | null;
  display_order: number;
}

const TeamPage = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [content, setContent] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);

  const FALLBACK_FOUNDER: TeamMember = {
    id: "founder",
    name: "Joseph Osei-Bonsu",
    role: "Founder & CEO",
    bio: "Visionary entrepreneur and founder of Share The Link. Building the ultimate link-in-bio platform for creators, entrepreneurs, and organizations worldwide.",
    avatar_url: "/images/joseph-osei-bonsu.jpg",
    social_links: {},
    display_order: 0,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, contentRes] = await Promise.all([
          supabase
            .from("team_members")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true }),
          supabase
            .from("site_content")
            .select("*")
            .eq("is_active", true)
            .in("content_type", ["team_video", "team_image", "team_text"])
            .order("display_order", { ascending: true }),
        ]);

        const membersData = (membersRes.data as TeamMember[] | null) || [];
        const contentData = (contentRes.data as SiteContent[] | null) || [];

        // Use fallback if no members from DB
        setMembers(membersData.length > 0 ? membersData : [FALLBACK_FOUNDER]);
        setContent(contentData);
      } catch {
        // Fallback to hardcoded founder
        setMembers([FALLBACK_FOUNDER]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const teamVideos = content.filter((c) => c.content_type === "team_video");
  const teamImages = content.filter((c) => c.content_type === "team_image");
  const teamTexts = content.filter((c) => c.content_type === "team_text");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-20">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              Our Team
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
              Meet the people behind Share The Link
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We are building the ultimate platform for creators and entrepreneurs to share everything they create with one beautiful link.
            </p>
          </div>

          {/* Admin-added text blocks */}
          {teamTexts.length > 0 && (
            <div className="max-w-3xl mx-auto mb-16 space-y-6">
              {teamTexts.map((text) => (
                <div key={text.id} className="bg-card rounded-2xl p-8 border border-border">
                  {text.title && <h3 className="text-xl font-bold text-foreground mb-3">{text.title}</h3>}
                  {text.body && <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{text.body}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Team Members */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Avatar area */}
                  <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-background shadow-lg"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-primary/10 border-4 border-background shadow-lg flex items-center justify-center">
                        <span className="text-3xl font-bold text-primary">
                          {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-6 text-center">
                    <h3 className="text-xl font-bold text-foreground mb-1">{member.name}</h3>
                    <p className="text-sm font-medium text-primary mb-3">{member.role}</p>
                    {member.bio && (
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{member.bio}</p>
                    )}

                    {/* Social links */}
                    {member.social_links && Object.keys(member.social_links).length > 0 && (
                      <div className="flex items-center justify-center gap-2">
                        {member.social_links.twitter && (
                          <a href={member.social_links.twitter} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="Twitter">
                            <Twitter className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {member.social_links.linkedin && (
                          <a href={member.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="LinkedIn">
                            <Linkedin className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {member.social_links.website && (
                          <a href={member.social_links.website} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" aria-label="Website">
                            <Globe className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Admin-uploaded media */}
          {teamVideos.length > 0 && (
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Videos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {teamVideos.map((video) => (
                  <div key={video.id} className="rounded-2xl overflow-hidden border border-border bg-card">
                    {video.media_url && (
                      <video controls className="w-full aspect-video" preload="metadata">
                        <source src={video.media_url} type="video/mp4" />
                      </video>
                    )}
                    {video.title && <p className="p-4 font-semibold text-foreground">{video.title}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {teamImages.length > 0 && (
            <div className="max-w-4xl mx-auto mb-16">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {teamImages.map((img) => (
                  <div key={img.id} className="rounded-xl overflow-hidden border border-border">
                    {img.media_url && (
                      <img src={img.media_url} alt={img.title || "Team"} className="w-full aspect-square object-cover" />
                    )}
                    {img.title && <p className="p-3 text-sm font-medium text-foreground text-center">{img.title}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TeamPage;
