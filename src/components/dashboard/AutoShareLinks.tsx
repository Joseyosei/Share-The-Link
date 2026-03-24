import { useState, useEffect, useCallback, useRef } from "react";
import { Share2, Clock, Facebook, Linkedin, Mail, Link2, Trash2, Plus, CalendarClock, ExternalLink, Bell, CheckCircle, Send } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import { YouTubeIcon } from "@/components/icons/YouTubeIcon";
import { TikTokIcon } from "@/components/icons/TikTokIcon";
import { TwitchIcon } from "@/components/icons/TwitchIcon";
import { DiscordIcon } from "@/components/icons/DiscordIcon";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { TelegramIcon } from "@/components/icons/TelegramIcon";
import { RedditIcon } from "@/components/icons/RedditIcon";
import { PinterestIcon } from "@/components/icons/PinterestIcon";
import { SnapchatIcon } from "@/components/icons/SnapchatIcon";
import { ThreadsIcon } from "@/components/icons/ThreadsIcon";
import { MastodonIcon } from "@/components/icons/MastodonIcon";
import { TumblrIcon } from "@/components/icons/TumblrIcon";
import { LineIcon } from "@/components/icons/LineIcon";
import { ViberIcon } from "@/components/icons/ViberIcon";
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
  { key: "twitter", label: "X (Twitter)", icon: XIcon, color: "bg-black" },
  { key: "facebook", label: "Facebook", icon: Facebook, color: "bg-blue-600" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, color: "bg-blue-700" },
  { key: "whatsapp", label: "WhatsApp", icon: WhatsAppIcon, color: "bg-green-500" },
  { key: "instagram", label: "Instagram", icon: InstagramIcon, color: "bg-gradient-to-br from-purple-600 to-pink-500" },
  { key: "youtube", label: "YouTube", icon: YouTubeIcon, color: "bg-red-600" },
  { key: "tiktok", label: "TikTok", icon: TikTokIcon, color: "bg-gray-900" },
  { key: "twitch", label: "Twitch", icon: TwitchIcon, color: "bg-purple-600" },
  { key: "discord", label: "Discord", icon: DiscordIcon, color: "bg-indigo-600" },
  { key: "telegram", label: "Telegram", icon: TelegramIcon, color: "bg-sky-600" },
  { key: "reddit", label: "Reddit", icon: RedditIcon, color: "bg-orange-600" },
  { key: "pinterest", label: "Pinterest", icon: PinterestIcon, color: "bg-red-700" },
  { key: "snapchat", label: "Snapchat", icon: SnapchatIcon, color: "bg-yellow-400" },
  { key: "threads", label: "Threads", icon: ThreadsIcon, color: "bg-black" },
  { key: "mastodon", label: "Mastodon", icon: MastodonIcon, color: "bg-indigo-500" },
  { key: "tumblr", label: "Tumblr", icon: TumblrIcon, color: "bg-blue-900" },
  { key: "line", label: "LINE", icon: LineIcon, color: "bg-green-600" },
  { key: "viber", label: "Viber", icon: ViberIcon, color: "bg-violet-600" },
  { key: "email", label: "Email", icon: Mail, color: "bg-orange-500" },
] as const;

function getShareUrl(platform: string, url: string, message: string): string {
  const encodedUrl = encodeURIComponent(url);
  const encodedMsg = encodeURIComponent(message);
  const fullText = encodeURIComponent(`${message} ${url}`);
  switch (platform) {
    case "twitter":
      return `https://twitter.com/intent/tweet?text=${encodedMsg}&url=${encodedUrl}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMsg}`;
    case "linkedin":
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedMsg}%20${encodedUrl}`;
    case "instagram":
      // Instagram doesn't have a direct share URL -- open the app/website
      return `https://www.instagram.com/`;
    case "youtube":
      return `https://www.youtube.com/`;
    case "tiktok":
      return `https://www.tiktok.com/`;
    case "twitch":
      return `https://www.twitch.tv/`;
    case "discord":
      return `https://discord.com/channels/@me`;
    case "telegram":
      return `https://t.me/share/url?url=${encodedUrl}&text=${encodedMsg}`;
    case "reddit":
      return `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedMsg}`;
    case "pinterest":
      return `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedMsg}`;
    case "snapchat":
      return `https://www.snapchat.com/`;
    case "threads":
      return `https://www.threads.net/intent/post?text=${fullText}`;
    case "mastodon":
      return `https://mastodon.social/share?text=${fullText}`;
    case "tumblr":
      return `https://www.tumblr.com/widgets/share/tool?posttype=link&canonicalUrl=${encodedUrl}&caption=${encodedMsg}`;
    case "line":
      return `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`;
    case "viber":
      return `viber://forward?text=${fullText}`;
    case "email":
      return `mailto:?subject=${encodedMsg}&body=${fullText}`;
    default:
      return url;
  }
}

// In-memory fallback for scheduled shares when DB table is unavailable
let inMemoryShares: ScheduledShare[] = [];

export function AutoShareLinks() {
  const { toast } = useToast();
  const [shares, setShares] = useState<ScheduledShare[]>([]);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareMode, setShareMode] = useState<"now" | "schedule">("now");
  const [dbAvailable, setDbAvailable] = useState(true);
  const firedShareIds = useRef<Set<string>>(new Set());
  const [readyShares, setReadyShares] = useState<ScheduledShare[]>([]);

  // Form state
  const [selectedLink, setSelectedLink] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const fetchShares = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Try Supabase first
      const { data, error } = await supabase
        .from("auto_share_links" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("scheduled_at", { ascending: true });

      if (error) {
        // PGRST205 means PostgREST schema cache doesn't see the table
        // Fall back to in-memory storage

        setDbAvailable(false);
        setShares(inMemoryShares.filter(s => s.id));
        return;
      }

      setDbAvailable(true);
      setShares((data as ScheduledShare[]) || []);
    } catch (err) {
      console.error("Error fetching shares:", err);
      setDbAvailable(false);
      setShares(inMemoryShares);
    }
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

  // Check for scheduled shares that are ready -- show notification banner
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const allShares = dbAvailable ? shares : inMemoryShares;
      const dueShares = allShares.filter(
        (s) => s.status === "pending" && new Date(s.scheduled_at).getTime() <= now && !firedShareIds.current.has(s.id)
      );

      if (dueShares.length === 0) return;

      // Mark all as fired so we don't re-trigger
      dueShares.forEach((s) => firedShareIds.current.add(s.id));

      // Show banner with a user-clickable action (avoids popup blocker)
      setReadyShares((prev) => [...prev, ...dueShares]);

      const platformNames = dueShares.map(
        (s) => PLATFORMS.find((p) => p.key === s.platform)?.label || s.platform
      );

      toast({
        title: `Ready to share on ${platformNames.length} platform(s)!`,
        description: "Click the share buttons below to open each platform.",
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [shares, dbAvailable, toast]);

  // Handle opening a single ready share (user-triggered, avoids popup blocker)
  const handleOpenReadyShare = (share: ScheduledShare) => {
    window.open(share.share_url, "_blank", "width=600,height=400");

    // Mark as posted
    if (dbAvailable) {
      supabase
        .from("auto_share_links" as any)
        .update({ status: "posted", posted_at: new Date().toISOString() } as any)
        .eq("id", share.id)
        .then(() => fetchShares());
    } else {
      const idx = inMemoryShares.findIndex((s) => s.id === share.id);
      if (idx >= 0) {
        inMemoryShares[idx] = { ...inMemoryShares[idx], status: "posted", posted_at: new Date().toISOString() };
      }
      fetchShares();
    }

    setReadyShares((prev) => prev.filter((s) => s.id !== share.id));
  };

  // Open ALL ready shares (user-triggered click cascade)
  const handleOpenAllReadyShares = () => {
    readyShares.forEach((share, i) => {
      setTimeout(() => {
        window.open(share.share_url, "_blank", "width=600,height=400");
      }, i * 500);

      // Mark as posted
      if (dbAvailable) {
        supabase
          .from("auto_share_links" as any)
          .update({ status: "posted", posted_at: new Date().toISOString() } as any)
          .eq("id", share.id)
          .then(() => {});
      } else {
        const idx = inMemoryShares.findIndex((s) => s.id === share.id);
        if (idx >= 0) {
          inMemoryShares[idx] = { ...inMemoryShares[idx], status: "posted", posted_at: new Date().toISOString() };
        }
      }
    });

    toast({ title: "All shares opened!", description: `Opened ${readyShares.length} platform(s).` });
    setReadyShares([]);
    setTimeout(() => fetchShares(), 2000);
  };

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

      for (const platform of selectedPlatforms) {
        const shareUrl = getShareUrl(platform, link.url, message || link.title);
        const row = {
          user_id: user.id,
          link_id: selectedLink,
          platform,
          message: message || link.title,
          share_url: shareUrl,
          scheduled_at: new Date(scheduledAt).toISOString(),
          status: "pending",
        };

        if (dbAvailable) {
          const { error } = await supabase
            .from("auto_share_links" as any)
            .insert(row as any);
          if (error) {
            // Fallback to in-memory if insert fails

            inMemoryShares.push({
              ...row,
              id: crypto.randomUUID(),
              posted_at: null,
              created_at: new Date().toISOString(),
            });
          }
        } else {
          inMemoryShares.push({
            ...row,
            id: crypto.randomUUID(),
            posted_at: null,
            created_at: new Date().toISOString(),
          });
        }
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
      if (dbAvailable) {
        await supabase
          .from("auto_share_links" as any)
          .update({ status: "cancelled" } as any)
          .eq("id", id);
      } else {
        const idx = inMemoryShares.findIndex(s => s.id === id);
        if (idx >= 0) inMemoryShares[idx] = { ...inMemoryShares[idx], status: "cancelled" };
      }
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

      {/* Ready-to-Share Banner */}
      {readyShares.length > 0 && (
        <Card className="border-green-500/40 bg-green-500/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-500 animate-bounce" />
                <span className="font-semibold text-sm text-green-700 dark:text-green-400">
                  {readyShares.length} scheduled share(s) ready!
                </span>
              </div>
              <Button
                size="sm"
                onClick={handleOpenAllReadyShares}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Open All Platforms
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {readyShares.map((share) => {
                const platform = PLATFORMS.find((p) => p.key === share.platform);
                const Icon = platform?.icon || Link2;
                return (
                  <button
                    key={share.id}
                    onClick={() => handleOpenReadyShare(share)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white transition-all hover:scale-105 ${platform?.color || "bg-muted"}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {platform?.label || share.platform}
                    <ExternalLink className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Share Buttons */}
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

            {/* Schedule Time */}
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
                  You will get a reminder when it is time to share (keep browser tab open).
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
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="secondary" className={`text-xs ${statusColors[share.status] || ""}`}>
          {share.status}
        </Badge>
        {share.status === "pending" && onCancel && (
          <button onClick={() => onCancel(share.id)} className="text-muted-foreground hover:text-destructive transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
