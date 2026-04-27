import { useState, useEffect } from "react";
import { Globe, Plus, Trash2, CheckCircle, Clock, AlertTriangle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DomainRecord {
  id: string;
  domain: string;
  status: string;
  verification_token: string | null;
  verified_at: string | null;
  created_at: string;
}

const DashboardDomains = () => {
  const { toast } = useToast();
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchDomains();
  }, []);

  const fetchDomains = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("custom_domains")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDomains((data || []) as DomainRecord[]);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
    if (!domain || !domain.includes(".")) {
      toast({ title: "Invalid domain", variant: "destructive" });
      return;
    }

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const token = `stl-verify-${Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")}`;

      const { data, error } = await supabase
        .from("custom_domains")
        .insert({
          user_id: user.id,
          domain,
          verification_token: token,
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          toast({ title: "Domain already registered", variant: "destructive" });
        } else {
          throw error;
        }
      } else {
        setDomains((prev) => [data as DomainRecord, ...prev]);
        setNewDomain("");
        setShowForm(false);
        toast({ title: "Domain added!", description: "Follow the DNS instructions to verify it." });
      }
    } catch {
      toast({ title: "Error", description: "Failed to add domain", variant: "destructive" });
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("custom_domains").delete().eq("id", id);
    if (!error) {
      setDomains((prev) => prev.filter((d) => d.id !== id));
      toast({ title: "Domain removed" });
    }
  };

  const statusIcon = (status: string) => {
    if (status === "active") return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === "failed") return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="min-h-screen bg-muted liquid-glass-muted overflow-x-hidden">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-3">
                <Globe className="w-7 h-7 text-primary" />
                Custom Domains
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Use your own domain for your profile page (e.g., links.yourbrand.com).
              </p>
            </div>
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Domain
            </Button>
          </div>

          {/* Add form */}
          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-base">Add a Custom Domain</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-1">Domain</label>
                  <input
                    type="text"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="links.yourbrand.com"
                    className="w-full px-3 py-2 rounded-xl border-2 border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd} disabled={adding}>
                    {adding ? "Adding..." : "Add Domain"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Domain List */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => <div key={i} className="h-28 bg-background rounded-xl animate-pulse" />)}
            </div>
          ) : domains.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                  No custom domains. Add one to brand your profile with your own domain.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => (
                <Card key={domain.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        {statusIcon(domain.status)}
                        <h3 className="font-semibold text-sm">{domain.domain}</h3>
                        <Badge variant={domain.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {domain.status}
                        </Badge>
                      </div>
                      <button
                        onClick={() => handleDelete(domain.id)}
                        className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {domain.status !== "active" && domain.verification_token && (
                      <div className="bg-muted rounded-xl p-4 space-y-3">
                        <p className="text-xs font-medium text-foreground">DNS Configuration Required</p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between bg-background rounded-lg p-3">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Type</p>
                              <p className="text-xs font-mono font-medium">CNAME</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Name</p>
                              <p className="text-xs font-mono font-medium">{domain.domain.split(".")[0]}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-muted-foreground">Value</p>
                              <p className="text-xs font-mono font-medium">cname.sharethelink.app</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-background rounded-lg p-3">
                            <div>
                              <p className="text-[10px] text-muted-foreground">Type</p>
                              <p className="text-xs font-mono font-medium">TXT</p>
                            </div>
                            <div className="flex-1 mx-4">
                              <p className="text-[10px] text-muted-foreground">Value</p>
                              <p className="text-xs font-mono font-medium truncate">{domain.verification_token}</p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(domain.verification_token || "");
                                toast({ title: "Copied!" });
                              }}
                              className="p-1.5 rounded hover:bg-muted"
                            >
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Add these DNS records at your domain provider. Verification may take up to 24 hours.
                        </p>
                      </div>
                    )}
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

export default DashboardDomains;
