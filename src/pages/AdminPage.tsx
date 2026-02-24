import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, FileText, Plus, Trash2, Save, Upload, Eye, EyeOff, Video, ImageIcon, Type, BarChart3, Link2, Radio, User, Briefcase, Mail, Phone, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string>;
  display_order: number;
  is_active: boolean;
}

interface SiteContent {
  id: string;
  content_type: string;
  title: string | null;
  body: string | null;
  media_url: string | null;
  metadata: Record<string, unknown>;
  is_active: boolean;
  display_order: number;
}

interface JobApplication {
  id: string;
  job_title: string;
  full_name: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  cover_letter: string | null;
  status: string;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalLinks: number;
  totalStreams: number;
  totalRecordings: number;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "team" | "content" | "applications">("overview");

  // Data
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [content, setContent] = useState<SiteContent[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalLinks: 0, totalStreams: 0, totalRecordings: 0 });

  // Forms
  const [newMember, setNewMember] = useState({ name: "", role: "", bio: "", avatar_url: "" });
  const [newContent, setNewContent] = useState({ content_type: "team_text", title: "", body: "", media_url: "" });

  // Hard-coded admin emails as a fallback
  const ADMIN_EMAILS = ["admin@sharethelink.io"];

  const checkAdmin = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    // Check admin_users table first
    let isAdminUser = false;
    try {
      const { data } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) isAdminUser = true;
    } catch {
      // Table might not exist or query failed, check email fallback
    }

    // Fallback: check if email is in the hard-coded admin list
    if (!isAdminUser && user.email && ADMIN_EMAILS.includes(user.email)) {
      isAdminUser = true;
      // Try to insert them into admin_users table for future
      try {
        await supabase.from("admin_users").insert({ user_id: user.id, role: "super_admin" });
      } catch { /* ignore if already exists */ }
    }

    if (!isAdminUser) {
      toast({ title: "Access denied", description: "You are not authorized to access this page.", variant: "destructive" });
      navigate("/dashboard");
      return;
    }
    setIsAdmin(true);
  }, [navigate, toast]);

  const fetchData = useCallback(async () => {
    // Fetch team members (all, including inactive)
    const { data: membersData } = await (supabase
      .from("team_members" as never)
      .select("*")
      .order("display_order", { ascending: true }) as any);
    if (membersData) setMembers(membersData);

    // Fetch site content
    const { data: contentData } = await (supabase
      .from("site_content" as never)
      .select("*")
      .order("display_order", { ascending: true }) as any);
    if (contentData) setContent(contentData);

    // Fetch job applications
    try {
      const { data: appsData } = await supabase
        .from("job_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (appsData) setApplications(appsData as unknown as JobApplication[]);
    } catch { /* table might not exist */ }

    // Fetch stats
    const [usersRes, linksRes, streamsRes, recordingsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("links").select("id", { count: "exact", head: true }),
      supabase.from("streams").select("id", { count: "exact", head: true }),
      supabase.from("stream_recordings" as never).select("id", { count: "exact", head: true }) as any,
    ]);
    setStats({
      totalUsers: usersRes.count || 0,
      totalLinks: linksRes.count || 0,
      totalStreams: streamsRes.count || 0,
      totalRecordings: recordingsRes.count || 0,
    });
  }, []);

  useEffect(() => {
    const init = async () => {
      await checkAdmin();
      setLoading(false);
    };
    init();
  }, [checkAdmin]);

  useEffect(() => {
    if (isAdmin) fetchData();
  }, [isAdmin, fetchData]);

  const addMember = async () => {
    if (!newMember.name || !newMember.role) {
      toast({ title: "Name and role required", variant: "destructive" });
      return;
    }
    const { error } = await (supabase.from("team_members" as never).insert({
      name: newMember.name,
      role: newMember.role,
      bio: newMember.bio || null,
      avatar_url: newMember.avatar_url || null,
      display_order: members.length,
    } as never) as any);

    if (error) {
      toast({ title: "Failed to add member", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Team member added" });
      setNewMember({ name: "", role: "", bio: "", avatar_url: "" });
      fetchData();
    }
  };

  const deleteMember = async (id: string) => {
    await (supabase.from("team_members" as never).delete().eq("id", id) as any);
    toast({ title: "Member removed" });
    fetchData();
  };

  const toggleMemberActive = async (id: string, active: boolean) => {
    await (supabase.from("team_members" as never).update({ is_active: !active } as never).eq("id", id) as any);
    fetchData();
  };

  const addContent = async () => {
    if (!newContent.title && !newContent.body && !newContent.media_url) {
      toast({ title: "Please add some content", variant: "destructive" });
      return;
    }
    const { error } = await (supabase.from("site_content" as never).insert({
      content_type: newContent.content_type,
      title: newContent.title || null,
      body: newContent.body || null,
      media_url: newContent.media_url || null,
      display_order: content.length,
    } as never) as any);

    if (error) {
      toast({ title: "Failed to add content", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Content added" });
      setNewContent({ content_type: "team_text", title: "", body: "", media_url: "" });
      fetchData();
    }
  };

  const deleteContent = async (id: string) => {
    await (supabase.from("site_content" as never).delete().eq("id", id) as any);
    toast({ title: "Content removed" });
    fetchData();
  };

  const toggleContentActive = async (id: string, active: boolean) => {
    await (supabase.from("site_content" as never).update({ is_active: !active } as never).eq("id", id) as any);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Admin Header */}
      <header className="bg-background border-b border-border sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2 text-destructive">
              <Shield className="w-4 h-4" />
              <span className="font-bold text-sm">Admin Panel</span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          {[
            { id: "overview" as const, label: "Overview", icon: BarChart3 },
            { id: "team" as const, label: "Team Members", icon: Users },
            { id: "content" as const, label: "Site Content", icon: FileText },
            { id: "applications" as const, label: `Applications (${applications.length})`, icon: Briefcase },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-foreground text-background"
                  : "bg-background text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: "Total Users", value: stats.totalUsers, icon: User, color: "text-blue-600 bg-blue-100" },
              { label: "Total Links", value: stats.totalLinks, icon: Link2, color: "text-green-600 bg-green-100" },
              { label: "Total Streams", value: stats.totalStreams, icon: Radio, color: "text-red-600 bg-red-100" },
              { label: "Recordings", value: stats.totalRecordings, icon: Video, color: "text-purple-600 bg-purple-100" },
            ].map((stat) => (
              <div key={stat.label} className="bg-background rounded-xl border border-border p-6">
                <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Team Members Tab */}
        {activeTab === "team" && (
          <div className="space-y-8">
            {/* Add Member Form */}
            <div className="bg-background rounded-xl border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Team Member
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <Input placeholder="Full Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
                <Input placeholder="Role (e.g. CTO, Designer)" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} />
                <Input placeholder="Avatar URL (optional)" value={newMember.avatar_url} onChange={(e) => setNewMember({ ...newMember, avatar_url: e.target.value })} />
              </div>
              <Textarea placeholder="Bio (optional)" value={newMember.bio} onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })} className="mb-4" />
              <Button onClick={addMember}>
                <Save className="w-4 h-4 mr-2" />
                Add Member
              </Button>
            </div>

            {/* Existing Members */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Current Team ({members.length})</h3>
              {members.map((member) => (
                <div key={member.id} className={`bg-background rounded-xl border border-border p-5 flex items-center gap-4 ${!member.is_active ? "opacity-50" : ""}`}>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {member.avatar_url ? (
                      <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-primary">{member.name[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleMemberActive(member.id, member.is_active)}>
                      {member.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteMember(member.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Tab */}
        {activeTab === "content" && (
          <div className="space-y-8">
            {/* Add Content Form */}
            <div className="bg-background rounded-xl border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Add Content to Team Page
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <select
                  value={newContent.content_type}
                  onChange={(e) => setNewContent({ ...newContent, content_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="team_text">Text Block</option>
                  <option value="team_video">Video</option>
                  <option value="team_image">Image</option>
                </select>
                <Input placeholder="Title" value={newContent.title} onChange={(e) => setNewContent({ ...newContent, title: e.target.value })} />
                {(newContent.content_type === "team_video" || newContent.content_type === "team_image") && (
                  <Input placeholder="Media URL" value={newContent.media_url} onChange={(e) => setNewContent({ ...newContent, media_url: e.target.value })} />
                )}
              </div>
              {newContent.content_type === "team_text" && (
                <Textarea placeholder="Content body" value={newContent.body} onChange={(e) => setNewContent({ ...newContent, body: e.target.value })} className="mb-4" />
              )}
              <Button onClick={addContent}>
                <Save className="w-4 h-4 mr-2" />
                Add Content
              </Button>
            </div>

            {/* Existing Content */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Published Content ({content.length})</h3>
              {content.map((item) => (
                <div key={item.id} className={`bg-background rounded-xl border border-border p-5 flex items-start gap-4 ${!item.is_active ? "opacity-50" : ""}`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    item.content_type === "team_video" ? "bg-red-100 text-red-600" :
                    item.content_type === "team_image" ? "bg-blue-100 text-blue-600" :
                    "bg-green-100 text-green-600"
                  }`}>
                    {item.content_type === "team_video" ? <Video className="w-5 h-5" /> :
                     item.content_type === "team_image" ? <ImageIcon className="w-5 h-5" /> :
                     <Type className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{item.title || "Untitled"}</p>
                    <p className="text-sm text-muted-foreground truncate">{item.body || item.media_url || "No content"}</p>
                    <span className="text-xs text-muted-foreground/60 mt-1 inline-block">{item.content_type.replace("team_", "").toUpperCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => toggleContentActive(item.id, item.is_active)}>
                      {item.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteContent(item.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {content.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No content added yet. Use the form above to add videos, images, or text blocks.</p>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground">Job Applications ({applications.length})</h3>
            {applications.length === 0 ? (
              <p className="text-muted-foreground text-center py-12">No applications received yet.</p>
            ) : (
              applications.map((app) => (
                <div key={app.id} className="bg-background rounded-xl border border-border p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-foreground text-lg">{app.full_name}</h4>
                      <p className="text-sm text-primary font-medium">{app.job_title}</p>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      app.status === "new" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                      app.status === "reviewed" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" :
                      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    }`}>
                      {app.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" />
                      <a href={`mailto:${app.email}`} className="hover:text-primary transition-colors">{app.email}</a>
                    </span>
                    {app.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5" />
                        {app.phone}
                      </span>
                    )}
                    {app.linkedin_url && (
                      <a href={app.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                        LinkedIn
                      </a>
                    )}
                    {app.portfolio_url && (
                      <a href={app.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <Globe className="w-3.5 h-3.5" />
                        Portfolio
                      </a>
                    )}
                  </div>
                  {app.cover_letter && (
                    <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
                      {app.cover_letter}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-3">
                    Applied {new Date(app.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
