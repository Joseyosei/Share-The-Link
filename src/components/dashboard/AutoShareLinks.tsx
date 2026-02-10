import { useState, useEffect, useCallback } from "react";
import { Share2, Clock, Twitter, Facebook, Linkedin, MessageCircle, Mail, Link2, Trash2, Send, Plus, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  // Form state
  const [selectedLink, setSelectedLink] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const fetchShares = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // auto_share_links table not yet created — skip fetch
    setShares([]);
  }, []);

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

  // Check for scheduled shares that need to fire (client-side timer)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      shares.forEach(async (share) => {
        if (share.status === "pending" && new Date(share.scheduled_at).getTime() <= now) {
          // Open the share URL in a new window
          window.open(share.share_url, "_blank", "width=600,height=400");
          // Mark as posted
          // auto_share_links table not yet created
          fetchShares();
        }
      });
    }, 10000); // check every 10 seconds
    return () => clearInterval(interval);
  }, [shares, fetchShares]);

  const handleSchedule = async () => {
    if (!selectedLink || selectedPlatforms.length === 0 || !scheduledAt) {
      toast({ title: "Missing fields", description: "Select a link, platform(s), and schedule time.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const link = links.find((l) => l.id === selectedLink);
      if (!link) throw new Error("Link not found");

      const inserts = selectedPlatforms.map((platform) => ({
        user_id: user.id,
        link_id: selectedLink,
        platform,
        message: message || link.title,
        share_url: getShareUrl(platform, link.url, message || link.title),
        scheduled_at: new Date(scheduledAt).toISOString(),
        status: "pending",
      }));

      const { error } = await supabase.from("auto_share_links").insert(inserts);
      if (error) throw error;

      toast({ title: "Shares scheduled!", description: `${inserts.length} share(s) scheduled.` });
      setShowModal(false);
      resetForm();
      fetchShares();
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Failed to schedule.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleShareNow = (platform: string, url: string, msg: string) => {
    window.open(getShareUrl(platform, url, msg), "_blank", "width=600,height=400");
  };

  const handleCancel = async (id: string) => {
    await supabase.from("auto_share_links").update({ status: "cancelled" }).eq("id", id);
    fetchShares();
    toast({ title: "Cancelled", description: "Scheduled share cancelled." });
  };

  const resetForm = () => {
    setSelectedLink("");
    setSelectedPlatforms([]);
    setMessage("");
    setScheduledAt("");
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
            Schedule your links to be shared on social media automatically
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Share
        </Button>
      </div>

      {/* Quick Share Buttons for all links */}
      {links.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium">Quick Share</CardTitle>
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
            <p className="text-sm text-muted-foreground">Add links first, then schedule them to be shared on social media.</p>
          </CardContent>
        </Card>
      )}

      {/* Schedule Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Schedule Auto-Share
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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

            {/* Schedule Time */}
            <div>
              <label className="text-sm font-medium">Schedule Time</label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSchedule} disabled={loading} className="flex-1">
                <Clock className="w-4 h-4 mr-2" />
                {loading ? "Scheduling..." : "Schedule"}
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
    pending: "bg-yellow-100 text-yellow-800",
    posted: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    cancelled: "bg-muted text-muted-foreground",
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Time remaining
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
      <Badge className={`text-xs ${statusColors[share.status] || ""}`}>
        {share.status}
      </Badge>
      {share.status === "pending" && onCancel && (
        <Button variant="ghost" size="sm" onClick={() => onCancel(share.id)}>
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
      )}
    </div>
  );
}
