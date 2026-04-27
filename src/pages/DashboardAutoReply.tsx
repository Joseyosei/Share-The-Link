import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Plus, Trash2, Edit2, ToggleLeft, ToggleRight, Save, ArrowLeft, Search, Zap } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface AutoReplyRule {
  id: string;
  platform: "instagram" | "whatsapp" | "tiktok";
  trigger_keyword: string;
  reply_message: string;
  include_link: boolean;
  link_url: string | null;
  is_active: boolean;
  match_type: "exact" | "contains" | "starts_with";
  created_at: string;
}

const PLATFORMS = [
  { key: "instagram" as const, label: "Instagram", icon: InstagramIcon, color: "bg-gradient-to-br from-purple-600 to-pink-500", textColor: "text-purple-600", bgLight: "bg-purple-50 dark:bg-purple-950/20" },
  { key: "whatsapp" as const, label: "WhatsApp", icon: WhatsAppIcon, color: "bg-green-500", textColor: "text-green-600", bgLight: "bg-green-50 dark:bg-green-950/20" },
  { key: "tiktok" as const, label: "TikTok", icon: TikTokIcon, color: "bg-gray-900", textColor: "text-gray-900 dark:text-gray-100", bgLight: "bg-gray-50 dark:bg-gray-900/20" },
];

const MATCH_TYPES = [
  { value: "contains", label: "Contains" },
  { value: "exact", label: "Exact Match" },
  { value: "starts_with", label: "Starts With" },
];

// In-memory storage fallback
let inMemoryRules: AutoReplyRule[] = [];

const DashboardAutoReply = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbAvailable, setDbAvailable] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [activePlatform, setActivePlatform] = useState<"all" | "instagram" | "whatsapp" | "tiktok">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formPlatform, setFormPlatform] = useState<"instagram" | "whatsapp" | "tiktok">("instagram");
  const [formKeyword, setFormKeyword] = useState("");
  const [formReply, setFormReply] = useState("");
  const [formIncludeLink, setFormIncludeLink] = useState(false);
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formMatchType, setFormMatchType] = useState<"exact" | "contains" | "starts_with">("contains");
  const [formActive, setFormActive] = useState(true);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("auto_reply_rules" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setDbAvailable(false);
        setRules(inMemoryRules);
        return;
      }

      setDbAvailable(true);
      setRules((data as AutoReplyRule[]) || []);
    } catch {
      setDbAvailable(false);
      setRules(inMemoryRules);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const resetForm = () => {
    setFormPlatform("instagram");
    setFormKeyword("");
    setFormReply("");
    setFormIncludeLink(false);
    setFormLinkUrl("");
    setFormMatchType("contains");
    setFormActive(true);
    setEditingRule(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setFormPlatform(rule.platform);
    setFormKeyword(rule.trigger_keyword);
    setFormReply(rule.reply_message);
    setFormIncludeLink(rule.include_link);
    setFormLinkUrl(rule.link_url || "");
    setFormMatchType(rule.match_type);
    setFormActive(rule.is_active);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formKeyword.trim() || !formReply.trim()) {
      toast({ title: "Missing fields", description: "Keyword and reply message are required.", variant: "destructive" });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const ruleData = {
        user_id: user.id,
        platform: formPlatform,
        trigger_keyword: formKeyword.trim().toLowerCase(),
        reply_message: formReply.trim(),
        include_link: formIncludeLink,
        link_url: formIncludeLink ? formLinkUrl.trim() || null : null,
        is_active: formActive,
        match_type: formMatchType,
      };

      if (editingRule) {
        if (dbAvailable) {
          await supabase
            .from("auto_reply_rules" as any)
            .update(ruleData as any)
            .eq("id", editingRule.id);
        } else {
          const idx = inMemoryRules.findIndex(r => r.id === editingRule.id);
          if (idx >= 0) inMemoryRules[idx] = { ...inMemoryRules[idx], ...ruleData };
        }
        toast({ title: "Rule updated", description: "Auto-reply rule has been updated." });
      } else {
        if (dbAvailable) {
          const { error } = await supabase
            .from("auto_reply_rules" as any)
            .insert(ruleData as any);
          if (error) {
            inMemoryRules.push({ ...ruleData, id: crypto.randomUUID(), created_at: new Date().toISOString() } as AutoReplyRule);
          }
        } else {
          inMemoryRules.push({ ...ruleData, id: crypto.randomUUID(), created_at: new Date().toISOString() } as AutoReplyRule);
        }
        toast({ title: "Rule created", description: "Auto-reply rule has been created." });
      }

      setShowModal(false);
      resetForm();
      fetchRules();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to save rule.", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    try {
      if (dbAvailable) {
        await supabase
          .from("auto_reply_rules" as any)
          .update({ is_active: !currentState } as any)
          .eq("id", id);
      } else {
        const idx = inMemoryRules.findIndex(r => r.id === id);
        if (idx >= 0) inMemoryRules[idx] = { ...inMemoryRules[idx], is_active: !currentState };
      }
      fetchRules();
    } catch {
      toast({ title: "Error", description: "Failed to toggle rule.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (dbAvailable) {
        await supabase
          .from("auto_reply_rules" as any)
          .delete()
          .eq("id", id);
      } else {
        inMemoryRules = inMemoryRules.filter(r => r.id !== id);
      }
      fetchRules();
      toast({ title: "Deleted", description: "Auto-reply rule removed." });
    } catch {
      toast({ title: "Error", description: "Failed to delete rule.", variant: "destructive" });
    }
  };

  const filteredRules = rules.filter(r => {
    const matchesPlatform = activePlatform === "all" || r.platform === activePlatform;
    const matchesSearch = !searchQuery || r.trigger_keyword.includes(searchQuery.toLowerCase()) || r.reply_message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const getPlatformData = (key: string) => PLATFORMS.find(p => p.key === key);
  const activeCount = rules.filter(r => r.is_active).length;

  return (
    <div className="min-h-screen bg-muted liquid-glass-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-3 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8 overflow-x-hidden">
        <div className="max-w-5xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="icon" asChild className="flex-shrink-0">
                <Link to="/dashboard">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
              </Button>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                  Auto-Reply
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Automatically reply to comments & messages with your links
                </p>
              </div>
            </div>
            <Button onClick={openCreateModal} className="gradient-button text-primary-foreground hover:opacity-90 flex-shrink-0 self-start sm:self-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Rule
            </Button>
          </div>

          {/* How It Works */}
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="py-4 px-4 sm:px-6">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm mb-1">How Auto-Reply Works</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    When someone comments a keyword on your post or sends you a DM with a trigger word,
                    Share The Link automatically sends them a reply with your custom message and link.
                    Perfect for "comment LINK to get the recipe" style engagement.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-2xl font-bold">{rules.length}</p>
                <p className="text-xs text-muted-foreground">Total Rules</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{rules.filter(r => r.platform === "instagram").length}</p>
                <p className="text-xs text-muted-foreground">Instagram</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{rules.filter(r => r.platform === "whatsapp").length}</p>
                <p className="text-xs text-muted-foreground">WhatsApp</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="flex gap-1.5 overflow-x-auto">
              {[{ key: "all", label: "All" }, ...PLATFORMS.map(p => ({ key: p.key, label: p.label }))].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActivePlatform(tab.key as any)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                    activePlatform === tab.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search keywords..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Rules List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-card rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredRules.length > 0 ? (
            <div className="space-y-3">
              {filteredRules.map(rule => {
                const platform = getPlatformData(rule.platform);
                const Icon = platform?.icon || MessageSquare;
                return (
                  <Card key={rule.id} className={`transition-all ${!rule.is_active ? "opacity-60" : ""}`}>
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl ${platform?.color || "bg-muted"} text-white flex items-center justify-center shrink-0`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge variant="outline" className="text-xs">
                              {rule.match_type === "contains" ? "Contains" : rule.match_type === "exact" ? "Exact" : "Starts with"}
                            </Badge>
                            <code className="text-sm font-mono font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {rule.trigger_keyword}
                            </code>
                          </div>
                          <p className="text-sm text-foreground line-clamp-2 mb-1">{rule.reply_message}</p>
                          {rule.include_link && rule.link_url && (
                            <p className="text-xs text-muted-foreground truncate">
                              Includes: {rule.link_url}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => handleToggle(rule.id, rule.is_active)}
                          />
                          <button onClick={() => openEditModal(rule)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(rule.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No auto-reply rules yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first auto-reply rule to automatically respond to comments and DMs with your links.
                </p>
                <Button onClick={openCreateModal} className="gradient-button text-primary-foreground">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Rule
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Example Templates */}
          {rules.length === 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3">Popular Templates</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { keyword: "link", reply: "Here's the link you requested! Check it out:", platform: "instagram" as const },
                  { keyword: "recipe", reply: "Hey! Here's the full recipe with all the details:", platform: "instagram" as const },
                  { keyword: "price", reply: "Thanks for asking! Here are our current prices:", platform: "whatsapp" as const },
                  { keyword: "info", reply: "Hi! Here's all the info you need:", platform: "whatsapp" as const },
                  { keyword: "collab", reply: "Thanks for reaching out! Here's our collaboration page:", platform: "tiktok" as const },
                  { keyword: "tutorial", reply: "Here's the full tutorial! Hope it helps:", platform: "tiktok" as const },
                ].map((template, i) => {
                  const platform = getPlatformData(template.platform);
                  const Icon = platform?.icon || MessageSquare;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setFormPlatform(template.platform);
                        setFormKeyword(template.keyword);
                        setFormReply(template.reply);
                        setFormMatchType("contains");
                        setFormActive(true);
                        setFormIncludeLink(true);
                        setEditingRule(null);
                        setShowModal(true);
                      }}
                      className="text-left p-3 rounded-xl border border-border bg-card hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full ${platform?.color} text-white flex items-center justify-center`}>
                          <Icon className="w-3 h-3" />
                        </div>
                        <code className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{template.keyword}</code>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{template.reply}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {editingRule ? "Edit Rule" : "New Auto-Reply Rule"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Platform */}
            <div>
              <label className="text-sm font-medium">Platform</label>
              <div className="flex gap-2 mt-2">
                {PLATFORMS.map(p => {
                  const Icon = p.icon;
                  return (
                    <button
                      key={p.key}
                      onClick={() => setFormPlatform(p.key)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        formPlatform === p.key
                          ? `${p.color} text-white`
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trigger Keyword */}
            <div>
              <label className="text-sm font-medium">Trigger Keyword</label>
              <Input
                value={formKeyword}
                onChange={e => setFormKeyword(e.target.value)}
                placeholder='e.g., "link", "recipe", "price"'
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                When someone comments or messages this word, they'll get an auto-reply.
              </p>
            </div>

            {/* Match Type */}
            <div>
              <label className="text-sm font-medium">Match Type</label>
              <div className="flex gap-2 mt-2">
                {MATCH_TYPES.map(mt => (
                  <button
                    key={mt.value}
                    onClick={() => setFormMatchType(mt.value as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formMatchType === mt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {mt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Message */}
            <div>
              <label className="text-sm font-medium">Reply Message</label>
              <Textarea
                value={formReply}
                onChange={e => setFormReply(e.target.value)}
                placeholder="Hey! Here's the link you asked for..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Include Link */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Include a Link</label>
                <p className="text-xs text-muted-foreground">Attach a URL to the reply</p>
              </div>
              <Switch checked={formIncludeLink} onCheckedChange={setFormIncludeLink} />
            </div>

            {formIncludeLink && (
              <Input
                value={formLinkUrl}
                onChange={e => setFormLinkUrl(e.target.value)}
                placeholder="https://sharethelink.app/yourname"
              />
            )}

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Active</label>
              <Switch checked={formActive} onCheckedChange={setFormActive} />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} className="flex-1 gradient-button text-white">
                <Save className="w-4 h-4 mr-2" />
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardAutoReply;
