import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Mail, Shield, Eye, Pencil, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { authFetch } from "@/lib/auth-fetch";

interface TeamMember {
  id: string;
  member_email: string;
  member_id: string | null;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
}

const ROLES = [
  { value: "admin", label: "Admin", description: "Full access to all settings", icon: Shield },
  { value: "editor", label: "Editor", description: "Can edit links and content", icon: Pencil },
  { value: "viewer", label: "Viewer", description: "View-only access to dashboard", icon: Eye },
];

const DashboardTeam = () => {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("owner_id", user.id)
        .order("invited_at", { ascending: false });

      if (error) throw error;
      setMembers((data || []) as TeamMember[]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast({ title: "Invalid email", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("team_members")
        .insert({
          owner_id: user.id,
          member_email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          toast({ title: "Already invited", description: "This person is already on your team", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        setMembers((prev) => [data as TeamMember, ...prev]);

        // Send invite email in background
        try {
          await authFetch("/api/send-team-invite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              memberEmail: inviteEmail.trim().toLowerCase(),
              role: inviteRole,
              ownerName: profile?.full_name || "A creator",
            }),
          });
        } catch {
          // Email send failure is non-blocking; invite is already saved
          console.warn("Team invite email failed to send");
        }

        setInviteEmail("");
        setShowInvite(false);
        toast({ title: "Invite sent!", description: `${inviteEmail} has been invited as ${inviteRole}` });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send invite", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (!error) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Member removed" });
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    const { error } = await supabase.from("team_members").update({ role: newRole }).eq("id", id);
    if (!error) {
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role: newRole } : m)));
      toast({ title: "Role updated" });
    }
  };

  const statusColor = (status: string) => {
    if (status === "accepted") return "bg-green-100 text-green-700";
    if (status === "declined") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-screen bg-muted overflow-x-hidden">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <Users className="w-7 h-7 text-primary" />
                Team
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Invite team members to help manage your profile and content.
              </p>
            </div>
            <Button onClick={() => setShowInvite(!showInvite)} className="gap-2">
              <Plus className="w-4 h-4" />
              Invite Member
            </Button>
          </div>

          {/* Invite Form */}
          {showInvite && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base">Invite a Team Member</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Email address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@example.com"
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Role</label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {ROLES.map((role) => (
                      <button
                        key={role.value}
                        onClick={() => setInviteRole(role.value)}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                          inviteRole === role.value
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <role.icon className="w-4 h-4 mb-1 text-primary" />
                        <p className="text-sm font-medium">{role.label}</p>
                        <p className="text-[10px] text-muted-foreground">{role.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleInvite} disabled={sending}>
                    {sending ? "Sending..." : "Send Invite"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Members List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="h-20 bg-background rounded-xl animate-pulse" />)}
            </div>
          ) : members.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No team members yet. Invite someone to collaborate on your profile.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{member.member_email}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge className={`${statusColor(member.status)} text-[10px] border-0`}>
                              {member.status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              Invited {new Date(member.invited_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg border border-border bg-background"
                        >
                          {ROLES.map((r) => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemove(member.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardTeam;
