import { useState, useEffect, useCallback, useRef } from "react";
import { Share2, Clock, Twitter, Facebook, Linkedin, MessageCircle, Mail, Link2, Trash2, Send, Plus, CalendarClock, ExternalLink, Bell, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Direct Supabase REST API helper to bypass PostgREST schema cache issues
const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  return { url, key };
};

const directQuery = async (method: string, path: string, body?: unknown, accessToken?: string) => {
  const { url, key } = getSupabaseConfig();
  const headers: Record<string, string> = {
    "apikey": key,
    "Authorization": `Bearer ${accessToken || key}`,
    "Content-Type": "application/json",
    "Prefer": method === "POST" ? "return=representation" : "return=minimal",
  };
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Request failed: ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : null;
};

interface ScheduledShare {
  id: string;
  platform: string;
  message: string | null;
  share_url: string;
  scheduled_at: string;
  posted_at: string | null;
  status: string;
  created_at: string;
}

interface LinkItem {
  id: string;
  title: string;
  url: string;
}

const PLATFORMS = [
  { key: "twitter", label: "Twitter / X", icon: Twitter, color: "bg-sky-500" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "bg-blue-600" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-500" },
  { key: "email", label: "Email", icon: Mail, color: "bg-orange-500" },
] as const;

function getShareUrl(platform: string, url: string, message: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedMsg = encodeURIComponent(message);
  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedMsg}&url=${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMsg}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedMsg}%20${encodedUrl}`;
    case "email":
      return `mailto:?subject=${encodedMsg}&body=${encodedMsg}%20${encodedUrl}`;
    default:
      return url;
  }
}

export function AutoShareLinks() {
  const { toast } = useToast();
  const [shares, setShares] = useState<ScheduledShare[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareMode, setShareMode] = useState<"now" | "schedule">("now");
  const firedShareIds = useRef<Set<string>>(new Set());

  // Form state
  const [selectedLink, setSelectedLink] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const getAccessToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || "";
  }, []);

  const fetchShares = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const token = await getAccessToken();
      const data = await directQuery(
        "GET",
        `auto_share_links?user_id=eq.${user.id}&order=scheduled_at.asc`,
        undefined,
        token
      );
      setShares(data || []);
    } catch (err) {
      console.error("Error fetching shares:", err);
      setShares([]);
    }
  }, [getAccessToken]);

  const fetchLinks = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("links")
      .select("id, title, url")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    setLinks(data || []);
  }, []);

  useEffect(() => {
    fetchShares();
    fetchLinks();
  }, [fetchShares, fetchLinks]);

  // Check for scheduled shares that are ready -- show reminder toast and auto-open
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      for (const share of shares) {
        if (share.status === "pending" && new Date(share.scheduled_at).getTime() <= now && !firedShareIds.current.has(share.id)) {
          firedShareIds.current.add(share.id);
          const platformLabel = PLATFORMS.find(p => p.key === share.platform)?.label || share.platform;
          toast({
            title: `Time to share on ${platformLabel}!`,
            description: share.message || "Your scheduled share is ready.",
          });
          // Open the share URL
          window.open(share.share_url, "_blank", "width=600,height=400");
          // Mark as posted via direct REST
          try {
            const token = await getAccessToken();
            await directQuery(
              "PATCH",
              `auto_share_links?id=eq.${share.id}`,
              { status: "posted", posted_at: new Date().toISOString() },
              token
            );
            fetchShares();
          } catch (err) {
            console.error("Error marking share posted:", err);
          }
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [shares, fetchShares, getAccessToken, toast]);

  // Request browser notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleShareNow = (platform: string, url: string, msg: string) => {
    window.open(getShareUrl(platform, url, msg), "_blank", "width=600,height=400");
    toast({ title: "Share opened!", description: `Sharing on ${platform}` });
  };

  const handleScheduleOrShareNow = async () => {
    if (!selectedLink || selectedPlatforms.length === 0) {
      toast({ title: "Missing fields", description: "Select a link and at least one platform.", variant: "destructive" });
      return;
    }

    const link = links.find((l) => l.id === selectedLink);
    if (!link) return;

    if (shareMode === "now") {
      // Instant share -- open all selected platforms immediately
      selectedPlatforms.forEach((platform) => {
        const shareUrl = getShareUrl(platform, link.url, message || link.title);
        window.open(shareUrl, "_blank", "width=600,height=400");
      });
      toast({ title: "Links shared!", description: `Opened ${selectedPlatforms.length} platform(s).` });
      setShowModal(false);
      resetForm();
      return;
    }

    // Schedule mode
    if (!scheduledAt) {
      toast({ title: "Missing time", description: "Select a schedule time.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      const token = await getAccessToken();

      for (const platform of selectedPlatforms) {
        const row = {
          user_id: user.id,
          link_id: selectedLink,
          platform,
          message: message || link.title,
          share_url: getShareUrl(platform, link.url, message || link.title),
          scheduled_at: new Date(scheduledAt).toISOString(),
          status: "pending",
        };
        await directQuery("POST", "auto_share_links", row, token);
      }

      toast({ title: "Shares scheduled!", description: `${selectedPlatforms.length} share(s) scheduled.` });
      setShowModal(false);
      resetForm();
      fetchShares();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Failed to schedule.";
      toast({ title: "Error", description: errMsg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const token = await getAccessToken();
      await directQuery("PATCH", `auto_share_links?id=eq.${id}`, { status: "cancelled" }, token);
      fetchShares();
      toast({ title: "Cancelled", description: "Scheduled share cancelled." });
    } catch {
      toast({ title: "Error", description: "Failed to cancel.", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setSelectedLink("");
    setSelectedPlatforms([]);
    setMessage("");
    setScheduledAt("");
    setShareMode("now");
  };

  const togglePlatform = (key: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const pendingShares = shares.filter((s) => s.status === "pending");
  const pastShares = shares.filter((s) => s.status !== "pending");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Auto-Share Links
          </h2>
          <p className="text-sm text-muted-foreground">
            Share your links instantly or schedule them for later
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Share Link
        </Button>
      </div>

      {/* Quick Share Buttons for all links */}
      {links.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              Quick Share
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {links.slice(0, 5).map((link) => (
              <div key={link.id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{link.title}</span>
                </div>
                <div className="flex gap-1">
                  {PLATFORMS.map(({ key, icon: Icon, color }) => (
                    <button
                      key={key}
                      onClick={() => handleShareNow(key, link.url, link.title)}
                      className={`w-7 h-7 rounded-full ${color} text-white flex items-center justify-center hover:opacity-80 transition-opacity`}
                      title={`Share on ${key}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pending Shares */}
      {pendingShares.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />
            Upcoming ({pendingShares.length})
          </h3>
          <div className="space-y-2">
            {pendingShares.map((share) => (
              <ScheduledShareCard key={share.id} share={share} onCancel={handleCancel} />
            ))}
          </div>
        </div>
      )}

      {/* Past Shares */}
      {pastShares.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Past Shares</h3>
          <div className="space-y-2">
            {pastShares.slice(0, 10).map((share) => (
              <ScheduledShareCard key={share.id} share={share} />
            ))}
          </div>
        </div>
      )}

      {shares.length === 0 && links.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Share2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-1">No links to share</h3>
            <p className="text-sm text-muted-foreground">Add links first, then share them on social media.</p>
          </CardContent>
        </Card>
      )}

      {/* Share Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              Share Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setShareMode("now")}
                className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  shareMode === "now" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                Share Now
              </button>
              <button
                onClick={() => setShareMode("schedule")}
                className={`flex-1 py-2.5 px-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                  shareMode === "schedule" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                Schedule
              </button>
            </div>

            {/* Select Link */}
            <div>
              <label className="text-sm font-medium">Select Link</label>
              <select
                value={selectedLink}
                onChange={(e) => setSelectedLink(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Choose a link...</option>
                {links.map((link) => (
                  <option key={link.id} value={link.id}>
                    {link.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Platforms */}
            <div>
              <label className="text-sm font-medium">Platforms</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PLATFORMS.map(({ key, label, icon: Icon, color }) => (
                  <button
                    key={key}
                    onClick={() => togglePlatform(key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      selectedPlatforms.includes(key)
                        ? `${color} text-white`
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium">Message (optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Check out my new link!"
                className="mt-1"
                rows={2}
              />
            </div>

            {/* Schedule Time -- only for schedule mode */}
            {shareMode === "schedule" && (
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                  Schedule Time
                </label>
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You will get a reminder when it is time to share (browser tab must be open).
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { setShowModal(false); resetForm(); }} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleScheduleOrShareNow} disabled={loading} className="flex-1 gradient-button text-white">
                {shareMode === "now" ? (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Share Now
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    {loading ? "Scheduling..." : "Schedule"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScheduledShareCard({ share, onCancel }: { share: ScheduledShare; onCancel?: (id: string) => void }) {
  const platform = PLATFORMS.find((p) => p.key === share.platform);
  const Icon = platform?.icon || Link2;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    posted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    cancelled: "bg-muted text-muted-foreground",
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const timeLeft = new Date(share.scheduled_at).getTime() - Date.now();
  const showCountdown = share.status === "pending" && timeLeft > 0;
  const minsLeft = Math.max(0, Math.floor(timeLeft / 60000));
  const hoursLeft = Math.floor(minsLeft / 60);

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <div className={`w-8 h-8 rounded-full ${platform?.color || "bg-muted"} text-white flex items-center justify-center shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{share.message || "Share"}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatDate(share.scheduled_at)}</span>
          {showCountdown && (
            <span className="text-primary font-medium">
              {hoursLeft > 0 ? `${hoursLeft}h ${minsLeft % 60}m` : `${minsLeft}m`} left
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge className={`text-xs ${statusColors[share.status] || ""}`}>
          {share.status === "posted" && <CheckCircle className="w-3 h-3 mr-1" />}
          {share.status}
        </Badge>
        {share.status === "pending" && onCancel && (
          <Button variant="ghost" size="sm" onClick={() => onCancel(share.id)}>
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}
