import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, FileText, Plus, Trash2, Save, Upload, Eye, EyeOff, Video, ImageIcon, Type, BarChart3, Link2, Radio, User, Briefcase, Mail, Phone, Globe, ExternalLink, Camera, Loader2, Search, HeadphonesIcon, Send, CheckCheck, MessageSquare, Settings2, Smartphone, Ban, AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { authFetch } from "@/lib/auth-fetch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Stats {
  totalUsers: number;
  totalLinks: number;
  totalStreams: number;
  totalRecordings: number;
}

interface StreamInfo {
  id: string;
  title: string;
  user_id: string;
  status: string;
  viewer_count: number;
  created_at: string;
  user_name?: string;
}

interface RecordingInfo {
  id: string;
  title: string;
  user_id: string;
  duration: number | null;
  created_at: string;
  user_name?: string;
}

const AdminPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "team" | "content" | "applications" | "support" | "settings">("overview");

  // Data
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [content, setContent] = useState<SiteContent[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalLinks: 0, totalStreams: 0, totalRecordings: 0 });

  // Support
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [ticketMessages, setTicketMessages] = useState<SupportMessage[]>([]);
  const [adminReply, setAdminReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Forms
  const [newMember, setNewMember] = useState({ name: "", role: "", bio: "", avatar_url: "" });
  const [newContent, setNewContent] = useState({ content_type: "team_text", title: "", body: "", media_url: "" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // All users for the overview
  const [allUsers, setAllUsers] = useState<Array<{
    id: string;
    user_id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    email?: string;
    linkCount?: number;
    streamCount?: number;
  }>>([]);
  const [userSearch, setUserSearch] = useState("");

  // Streams and Recordings for overview
  const [allStreams, setAllStreams] = useState<StreamInfo[]>([]);
  const [allRecordings, setAllRecordings] = useState<RecordingInfo[]>([]);
  const [streamSearch, setStreamSearch] = useState("");
  const [recordingSearch, setRecordingSearch] = useState("");

  // User removal dialog
  const [removeUserDialog, setRemoveUserDialog] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: "", userName: "" });
  const [removeReason, setRemoveReason] = useState("tos_violation");
  const [removingUser, setRemovingUser] = useState(false);

  // Stream/Recording delete dialogs
  const [deleteStreamDialog, setDeleteStreamDialog] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" });
  const [deleteRecordingDialog, setDeleteRecordingDialog] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" });

  // App countdown settings
  const [appLaunchDate, setAppLaunchDate] = useState("2026-09-01");
  const [appLaunchTime, setAppLaunchTime] = useState("00:00");
  const [iosEnabled, setIosEnabled] = useState(true);
  const [androidEnabled, setAndroidEnabled] = useState(true);
  const [savingCountdown, setSavingCountdown] = useState(false);

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

    // Fetch all users with their link and stream counts
    const { data: allProfilesData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (allProfilesData) {
      // Get link counts per user
      const { data: allLinksData } = await supabase.from("links").select("user_id");
      const { data: allStreamsData } = await supabase.from("streams").select("user_id");

      const linkCounts: Record<string, number> = {};
      const streamCounts: Record<string, number> = {};

      allLinksData?.forEach((l: { user_id: string }) => {
        linkCounts[l.user_id] = (linkCounts[l.user_id] || 0) + 1;
      });
      allStreamsData?.forEach((s: { user_id: string }) => {
        streamCounts[s.user_id] = (streamCounts[s.user_id] || 0) + 1;
      });

      setAllUsers(allProfilesData.map((p) => ({
        ...p,
        linkCount: linkCounts[p.user_id] || 0,
        streamCount: streamCounts[p.user_id] || 0,
      })));
    }

    // Fetch support tickets
    try {
      const { data: ticketsData } = await (supabase
        .from("support_tickets" as never)
        .select("*")
        .order("updated_at", { ascending: false }) as any);
      if (ticketsData) {
        // Enrich with user info
        const userIds = [...new Set(ticketsData.map((t: any) => t.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, avatar_url").in("user_id", userIds);
        const profileMap: Record<string, any> = {};
        profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });
        setTickets(ticketsData.map((t: any) => ({
          ...t,
          user_name: profileMap[t.user_id]?.full_name || "Unknown",
          user_email: profileMap[t.user_id]?.email || "",
          user_avatar: profileMap[t.user_id]?.avatar_url || null,
        })));
      }
    } catch { /* support tables may not exist yet */ }

    // Fetch all streams with user info
    try {
      const { data: streamsFullData } = await supabase
        .from("streams")
        .select("id, title, user_id, status, viewer_count, created_at")
        .order("created_at", { ascending: false });
      if (streamsFullData) {
        const streamUserIds = [...new Set(streamsFullData.map((s: any) => s.user_id))];
        const { data: streamProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", streamUserIds);
        const spMap: Record<string, string> = {};
        streamProfiles?.forEach((p: any) => { spMap[p.user_id] = p.full_name || "Unknown"; });
        setAllStreams(streamsFullData.map((s: any) => ({ ...s, user_name: spMap[s.user_id] || "Unknown" })));
      }
    } catch { /* streams table may not exist */ }

    // Fetch all recordings with user info
    try {
      const { data: recordingsFullData } = await (supabase
        .from("stream_recordings" as never)
        .select("id, title, user_id, duration, created_at")
        .order("created_at", { ascending: false }) as any);
      if (recordingsFullData) {
        const recUserIds = [...new Set(recordingsFullData.map((r: any) => r.user_id))];
        const { data: recProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", recUserIds);
        const rpMap: Record<string, string> = {};
        recProfiles?.forEach((p: any) => { rpMap[p.user_id] = p.full_name || "Unknown"; });
        setAllRecordings(recordingsFullData.map((r: any) => ({ ...r, user_name: rpMap[r.user_id] || "Unknown" })));
      }
    } catch { /* recordings table may not exist */ }

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

    // Fetch app launch countdown settings
    try {
      const { data: countdownData } = await (supabase
        .from("site_settings" as never)
        .select("value")
        .eq("key", "app_launch_date")
        .single() as any);
      if (countdownData?.value) {
        const val = countdownData.value as any;
        if (val.date) {
          const d = new Date(val.date);
          setAppLaunchDate(d.toISOString().split("T")[0]);
          setAppLaunchTime(d.toISOString().split("T")[1]?.substring(0, 5) || "00:00");
        }
        if (val.ios_enabled !== undefined) setIosEnabled(val.ios_enabled);
        if (val.android_enabled !== undefined) setAndroidEnabled(val.android_enabled);
      }
    } catch { /* site_settings table may not exist yet */ }
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

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `team-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from("team-avatars").upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data: urlData } = supabase.storage.from("team-avatars").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const addMember = async () => {
    if (!newMember.name || !newMember.role) {
      toast({ title: "Name and role required", variant: "destructive" });
      return;
    }

    setUploading(true);
    let avatarUrl = newMember.avatar_url || null;

    // Upload image file if selected
    if (avatarFile) {
      const uploadedUrl = await uploadAvatar(avatarFile);
      if (uploadedUrl) {
        avatarUrl = uploadedUrl;
      } else {
        toast({ title: "Image upload failed", description: "Please try again or use a URL instead.", variant: "destructive" });
        setUploading(false);
        return;
      }
    }

    const { error } = await (supabase.from("team_members" as never).insert({
      name: newMember.name,
      role: newMember.role,
      bio: newMember.bio || null,
      avatar_url: avatarUrl,
      display_order: members.length,
    } as never) as any);

    setUploading(false);

    if (error) {
      toast({ title: "Failed to add member", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Team member added successfully" });
      setNewMember({ name: "", role: "", bio: "", avatar_url: "" });
      setAvatarFile(null);
      setAvatarPreview(null);
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

  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    try {
      const { data } = await (supabase
        .from("support_messages" as never)
        .select("*")
        .eq("ticket_id", ticket.id)
        .order("created_at", { ascending: true }) as any);
      setTicketMessages(data || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch { setTicketMessages([]); }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !adminReply.trim()) return;
    setSendingReply(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await (supabase.from("support_messages" as never).insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_type: "admin",
        message: adminReply.trim(),
      } as never).select().single() as any);
      if (error) throw error;
      setTicketMessages((prev) => [...prev, data]);
      setAdminReply("");
      // Update ticket status to in_progress if open
      if (selectedTicket.status === "open") {
        await (supabase.from("support_tickets" as never).update({ status: "in_progress", updated_at: new Date().toISOString() } as never).eq("id", selectedTicket.id) as any);
        setSelectedTicket({ ...selectedTicket, status: "in_progress" });
        setTickets((prev) => prev.map((t) => t.id === selectedTicket.id ? { ...t, status: "in_progress" } : t));
      }
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err: any) {
      toast({ title: "Failed to send", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setSendingReply(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    await (supabase.from("support_tickets" as never).update({ status, updated_at: new Date().toISOString() } as never).eq("id", ticketId) as any);
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status } : t));
    if (selectedTicket?.id === ticketId) setSelectedTicket((prev) => prev ? { ...prev, status } : null);
    toast({ title: `Ticket ${status}` });
  };

  const handleRemoveUser = async () => {
    if (!removeUserDialog.userId) return;
    setRemovingUser(true);
    try {
      const res = await authFetch("/api/admin-actions?action=remove-user", {
        method: "POST",
        body: JSON.stringify({ targetUserId: removeUserDialog.userId, reason: removeReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove user");
      toast({ title: "User removed", description: `${removeUserDialog.userName} and all their data have been deleted. Reason: ${removeReason.replace(/_/g, " ")}` });
      setRemoveUserDialog({ open: false, userId: "", userName: "" });
      setRemoveReason("tos_violation");
      fetchData();
    } catch (err: any) {
      toast({ title: "Failed to remove user", description: err?.message || "Please try again", variant: "destructive" });
    } finally {
      setRemovingUser(false);
    }
  };

  const handleDeleteStream = async () => {
    if (!deleteStreamDialog.id) return;
    try {
      const res = await authFetch("/api/admin-actions?action=delete-stream", {
        method: "POST",
        body: JSON.stringify({ streamId: deleteStreamDialog.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete stream");
      toast({ title: "Stream deleted", description: `"${deleteStreamDialog.title}" has been removed.` });
      setDeleteStreamDialog({ open: false, id: "", title: "" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Failed to delete stream", description: err?.message, variant: "destructive" });
    }
  };

  const handleDeleteRecording = async () => {
    if (!deleteRecordingDialog.id) return;
    try {
      const res = await authFetch("/api/admin-actions?action=delete-recording", {
        method: "POST",
        body: JSON.stringify({ recordingId: deleteRecordingDialog.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete recording");
      toast({ title: "Recording deleted", description: `"${deleteRecordingDialog.title}" has been removed.` });
      setDeleteRecordingDialog({ open: false, id: "", title: "" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Failed to delete recording", description: err?.message, variant: "destructive" });
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "--";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const streamStatusColor = (status: string) => {
    switch (status) {
      case "live": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "ended": return "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400";
      case "scheduled": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "in_progress": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "resolved": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "closed": return "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const priorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
      case "high": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
      case "normal": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      default: return "bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400";
    }
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
    <div className="min-h-screen bg-muted liquid-glass-muted/30">
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
            { id: "support" as const, label: `Support (${tickets.filter((t) => t.status === "open" || t.status === "in_progress").length})`, icon: HeadphonesIcon },
            { id: "settings" as const, label: "Settings", icon: Settings2 },
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
          <div className="space-y-8">
            {/* Stats Cards */}
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

            {/* All Users Table */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">All Users</h3>
                  <p className="text-sm text-muted-foreground">{allUsers.length} registered users on the platform</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">User</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Username</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Links</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Streams</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Joined</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers
                      .filter((u) => {
                        if (!userSearch) return true;
                        const q = userSearch.toLowerCase();
                        return (
                          (u.full_name?.toLowerCase() || "").includes(q) ||
                          (u.username?.toLowerCase() || "").includes(q) ||
                          (u.bio?.toLowerCase() || "").includes(q)
                        );
                      })
                      .map((user) => (
                        <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                                {user.avatar_url ? (
                                  <img src={user.avatar_url} alt={user.full_name || ""} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-sm font-bold text-primary">
                                    {(user.full_name || "?")[0]?.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">{user.full_name || "No name"}</p>
                                {user.bio && (
                                  <p className="text-xs text-muted-foreground truncate max-w-xs">{user.bio}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            {user.username ? (
                              <a
                                href={`/${user.username}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline font-medium"
                              >
                                @{user.username}
                              </a>
                            ) : (
                              <span className="text-sm text-muted-foreground">--</span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                              <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                              {user.linkCount}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                              <Radio className="w-3.5 h-3.5 text-muted-foreground" />
                              {user.streamCount}
                            </span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-muted-foreground">
                              {new Date(user.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setRemoveUserDialog({ open: true, userId: user.user_id, userName: user.full_name || user.username || "this user" })}
                            >
                              <Ban className="w-3.5 h-3.5 mr-1" />
                              Remove
                            </Button>
                          </td>
                        </tr>
                      ))}
                    {allUsers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Streams Table */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">All Streams</h3>
                  <p className="text-sm text-muted-foreground">{allStreams.length} streams on the platform</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search streams..."
                    value={streamSearch}
                    onChange={(e) => setStreamSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Title</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">User</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Status</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Viewers</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Date</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allStreams
                      .filter((s) => {
                        if (!streamSearch) return true;
                        const q = streamSearch.toLowerCase();
                        return (
                          (s.title?.toLowerCase() || "").includes(q) ||
                          (s.user_name?.toLowerCase() || "").includes(q)
                        );
                      })
                      .map((stream) => (
                        <tr key={stream.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-semibold text-foreground text-sm truncate max-w-xs">{stream.title || "Untitled Stream"}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-muted-foreground">{stream.user_name}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <Badge variant="secondary" className={`text-[10px] ${streamStatusColor(stream.status)}`}>
                              {stream.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-foreground">{stream.viewer_count || 0}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-muted-foreground">
                              {new Date(stream.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteStreamDialog({ open: true, id: stream.id, title: stream.title || "Untitled Stream" })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    {allStreams.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          No streams found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* All Recordings Table */}
            <div className="bg-background rounded-xl border border-border overflow-hidden">
              <div className="p-6 border-b border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">All Recordings</h3>
                  <p className="text-sm text-muted-foreground">{allRecordings.length} recordings on the platform</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search recordings..."
                    value={recordingSearch}
                    onChange={(e) => setRecordingSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Title</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">User</th>
                      <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Duration</th>
                      <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Date</th>
                      <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider py-3 px-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allRecordings
                      .filter((r) => {
                        if (!recordingSearch) return true;
                        const q = recordingSearch.toLowerCase();
                        return (
                          (r.title?.toLowerCase() || "").includes(q) ||
                          (r.user_name?.toLowerCase() || "").includes(q)
                        );
                      })
                      .map((recording) => (
                        <tr key={recording.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-semibold text-foreground text-sm truncate max-w-xs">{recording.title || "Untitled Recording"}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-muted-foreground">{recording.user_name}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="text-sm font-medium text-foreground">{formatDuration(recording.duration)}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-sm text-muted-foreground">
                              {new Date(recording.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteRecordingDialog({ open: true, id: recording.id, title: recording.title || "Untitled Recording" })}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    {allRecordings.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground">
                          No recordings found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Team Members Tab */}
        {activeTab === "team" && (
          <div className="space-y-8">
            {/* Add Member Form */}
            <div className="bg-background rounded-xl border border-border p-6">
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Team Member
              </h3>
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="w-32 h-32 rounded-full border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer overflow-hidden bg-muted/30 transition-colors group relative"
                    onClick={() => avatarInputRef.current?.click()}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                        <Camera className="w-6 h-6" />
                        <span className="text-xs font-medium">Upload Photo</span>
                      </div>
                    )}
                    {avatarPreview && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarSelect}
                    className="hidden"
                  />
                  <span className="text-xs text-muted-foreground">or paste URL below</span>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input placeholder="Full Name *" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
                    <Input placeholder="Role (e.g. CTO, Designer) *" value={newMember.role} onChange={(e) => setNewMember({ ...newMember, role: e.target.value })} />
                  </div>
                  <Input
                    placeholder="Avatar URL (optional - used if no image uploaded)"
                    value={newMember.avatar_url}
                    onChange={(e) => setNewMember({ ...newMember, avatar_url: e.target.value })}
                  />
                  <Textarea
                    placeholder="Bio (optional) - describe this team member's role and background"
                    value={newMember.bio}
                    onChange={(e) => setNewMember({ ...newMember, bio: e.target.value })}
                    rows={3}
                  />
                  <Button onClick={addMember} disabled={uploading} className="w-full md:w-auto">
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Add Member
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Members - styled like the public team page */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Current Team ({members.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((member) => (
                  <div key={member.id} className={`bg-background rounded-2xl border border-border overflow-hidden transition-shadow hover:shadow-lg ${!member.is_active ? "opacity-50" : ""}`}>
                    {/* Avatar area */}
                    <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.name}
                          className="w-28 h-28 rounded-full object-cover border-4 border-background shadow-lg"
                        />
                      ) : (
                        <div className="w-28 h-28 rounded-full bg-primary/10 border-4 border-background shadow-lg flex items-center justify-center">
                          <span className="text-2xl font-bold text-primary">
                            {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </span>
                        </div>
                      )}
                      {/* Status badge */}
                      <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${
                        member.is_active 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}>
                        {member.is_active ? "Active" : "Hidden"}
                      </span>
                    </div>
                    {/* Info */}
                    <div className="p-5 text-center">
                      <h4 className="text-lg font-bold text-foreground mb-1">{member.name}</h4>
                      <p className="text-sm font-medium text-primary mb-2">{member.role}</p>
                      {member.bio && (
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">{member.bio}</p>
                      )}
                      {/* Actions */}
                      <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
                        <Button variant="ghost" size="sm" onClick={() => toggleMemberActive(member.id, member.is_active)} className="text-xs">
                          {member.is_active ? <><Eye className="w-3.5 h-3.5 mr-1" /> Visible</> : <><EyeOff className="w-3.5 h-3.5 mr-1" /> Hidden</>}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive text-xs" onClick={() => deleteMember(member.id)}>
                          <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {members.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No team members added yet. Use the form above to add your team.</p>
              )}
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

        {/* Support Tab */}
        {activeTab === "support" && (
          <div className="flex gap-6 h-[calc(100vh-220px)]">
            {/* Ticket List */}
            <div className="w-96 shrink-0 bg-background rounded-xl border border-border overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Support Tickets ({tickets.length})
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto">
                {tickets.length === 0 ? (
                  <p className="text-muted-foreground text-center py-12 text-sm">No support tickets yet.</p>
                ) : (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      onClick={() => handleSelectTicket(ticket)}
                      className={`w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors ${
                        selectedTicket?.id === ticket.id ? "bg-primary/5 border-l-4 border-l-primary" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-semibold text-foreground text-sm truncate">{ticket.subject}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${statusColor(ticket.status)}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {ticket.user_avatar ? (
                            <img src={ticket.user_avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] font-bold text-primary">{(ticket.user_name || "?")[0]}</span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground truncate">{ticket.user_name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${priorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 bg-background rounded-xl border border-border overflow-hidden flex flex-col">
              {selectedTicket ? (
                <>
                  {/* Ticket Header */}
                  <div className="p-4 border-b border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">{selectedTicket.subject}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">From: {selectedTicket.user_name} ({selectedTicket.user_email})</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusColor(selectedTicket.status)}`}>
                            {selectedTicket.status.replace("_", " ")}
                          </span>
                          <Badge variant="secondary" className="text-[10px]">{selectedTicket.category}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {selectedTicket.status !== "resolved" && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateTicketStatus(selectedTicket.id, "resolved")}>
                            <Check className="w-3 h-3 mr-1" /> Resolve
                          </Button>
                        )}
                        {selectedTicket.status !== "closed" && (
                          <Button size="sm" variant="ghost" onClick={() => handleUpdateTicketStatus(selectedTicket.id, "closed")}>
                            Close
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {ticketMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender_type === "admin" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                          msg.sender_type === "admin"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        }`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                          <div className={`flex items-center gap-1 mt-1 ${msg.sender_type === "admin" ? "justify-end" : ""}`}>
                            <span className="text-[10px] opacity-70">
                              {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {msg.sender_type === "admin" && msg.is_read && (
                              <CheckCheck className="w-3 h-3 opacity-70" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Input */}
                  {selectedTicket.status !== "closed" && (
                    <div className="p-4 border-t border-border">
                      <div className="flex gap-2">
                        <Textarea
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          placeholder="Type your reply..."
                          rows={2}
                          className="flex-1 resize-none"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply();
                            }
                          }}
                        />
                        <Button onClick={handleSendReply} disabled={sendingReply || !adminReply.trim()} className="self-end gradient-button text-primary-foreground">
                          {sendingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <HeadphonesIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">Select a ticket to view</p>
                    <p className="text-sm">Choose a support ticket from the left panel</p>
                  </div>
                </div>
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
        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-8">
            {/* App Launch Countdown */}
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">App Launch Countdown</h2>
                  <p className="text-sm text-muted-foreground">
                    Set the launch date for iOS and Android apps. This countdown is shown when users click the App Store / Google Play buttons in the footer.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Launch Date</label>
                  <Input
                    type="date"
                    value={appLaunchDate}
                    onChange={(e) => setAppLaunchDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-1">Launch Time (UTC)</label>
                  <Input
                    type="time"
                    value={appLaunchTime}
                    onChange={(e) => setAppLaunchTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={iosEnabled}
                    onChange={(e) => setIosEnabled(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">iOS App Store enabled</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={androidEnabled}
                    onChange={(e) => setAndroidEnabled(e.target.checked)}
                    className="rounded border-input"
                  />
                  <span className="text-sm">Google Play enabled</span>
                </label>
              </div>

              {/* Preview */}
              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <p className="text-xs text-muted-foreground mb-1">Launch date preview:</p>
                <p className="font-semibold">
                  {new Date(`${appLaunchDate}T${appLaunchTime}:00Z`).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZoneName: "short",
                  })}
                </p>
              </div>

              <Button
                onClick={async () => {
                  setSavingCountdown(true);
                  try {
                    const dateStr = `${appLaunchDate}T${appLaunchTime}:00Z`;
                    const { error } = await supabase
                      .from("site_settings" as never)
                      .upsert({
                        key: "app_launch_date",
                        value: {
                          date: dateStr,
                          ios_enabled: iosEnabled,
                          android_enabled: androidEnabled,
                        },
                        updated_at: new Date().toISOString(),
                      } as never, { onConflict: "key" } as never) as any;

                    if (error) throw error;
                    toast({ title: "Saved!", description: "App launch countdown updated." });
                  } catch (error) {
                    console.error("Save countdown error:", error);
                    toast({ title: "Error", description: "Failed to save countdown settings.", variant: "destructive" });
                  }
                  setSavingCountdown(false);
                }}
                disabled={savingCountdown}
              >
                {savingCountdown ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Countdown Settings
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Remove User AlertDialog */}
      <AlertDialog open={removeUserDialog.open} onOpenChange={(open) => { if (!open) setRemoveUserDialog({ open: false, userId: "", userName: "" }); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Remove User
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{removeUserDialog.userName}</strong> and all their data including links, streams, recordings, and support tickets. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1.5 block">Reason for removal</label>
            <select
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="tos_violation">Terms of Service Violation</option>
              <option value="privacy_violation">Privacy Policy Violation</option>
              <option value="spam">Spam / Abuse</option>
              <option value="harassment">Harassment</option>
              <option value="copyright">Copyright Infringement</option>
              <option value="fraud">Fraudulent Activity</option>
              <option value="user_request">User Requested Deletion</option>
              <option value="other">Other</option>
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removingUser}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              disabled={removingUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removingUser ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Ban className="w-4 h-4 mr-2" />}
              Remove User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Stream AlertDialog */}
      <AlertDialog open={deleteStreamDialog.open} onOpenChange={(open) => { if (!open) setDeleteStreamDialog({ open: false, id: "", title: "" }); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Stream
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the stream <strong>"{deleteStreamDialog.title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStream}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Stream
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Recording AlertDialog */}
      <AlertDialog open={deleteRecordingDialog.open} onOpenChange={(open) => { if (!open) setDeleteRecordingDialog({ open: false, id: "", title: "" }); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Delete Recording
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the recording <strong>"{deleteRecordingDialog.title}"</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecording}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Recording
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminPage;
