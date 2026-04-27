import { useState, useEffect } from "react";
import { Radio, Search, Users, Clock, Play, Calendar, Video, Eye, TrendingUp, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const CATEGORIES = ["All", "Gaming", "Music", "Chat", "Education", "Creative", "Business", "Other"] as const;

interface StreamWithProfile {
  id: string;
  title: string;
  description: string | null;
  status: "live" | "ended" | "offline";
  viewer_count: number;
  peak_viewers: number;
  total_tips: number;
  thumbnail_url: string | null;
  room_name: string | null;
  started_at: string | null;
  ended_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  category?: string;
  username: string;
  full_name: string;
  avatar_url: string | null;
}

const Discover = () => {
  const [streams, setStreams] = useState<StreamWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from("streams")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const userIds = [...new Set((data || []).map((s: any) => s.user_id))];
      let profiles: Record<string, { username: string; full_name: string; avatar_url: string | null }> = {};

      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, avatar_url")
          .in("user_id", userIds);

        (profilesData || []).forEach((p: any) => {
          profiles[p.user_id] = p;
        });
      }

      const enriched: StreamWithProfile[] = (data || []).map((s: any) => ({
        ...s,
        username: profiles[s.user_id]?.username || "unknown",
        full_name: profiles[s.user_id]?.full_name || "Unknown Creator",
        avatar_url: profiles[s.user_id]?.avatar_url || null,
      }));

      setStreams(enriched);
    } catch (err) {
      console.error("Fetch streams error:", err);
    } finally {
      setLoading(false);
    }
  };

  const liveStreams = streams.filter((s) => s.status === "live");
  const scheduledStreams = streams.filter((s) => s.status === "offline" && s.scheduled_at);
  const replayStreams = streams.filter((s) => s.status === "ended");

  const filterBySearch = (list: StreamWithProfile[]) =>
    list.filter(
      (s) =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.full_name.toLowerCase().includes(search.toLowerCase()) ||
        s.username.toLowerCase().includes(search.toLowerCase())
    );

  const formatDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return "";
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 1000;
    const m = Math.floor(diff / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    return `${m}m`;
  };

  const formatTimeAgo = (date: string) => {
    const diff = (Date.now() - new Date(date).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const StreamCard = ({ stream, isLive }: { stream: StreamWithProfile; isLive?: boolean }) => (
    <Link to={isLive ? `/live/${stream.username}` : "#"} className="block group">
      <Card className={`overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${isLive ? "ring-2 ring-red-500/30 shadow-red-500/10 shadow-lg" : ""}`}>
        {/* Thumbnail */}
        <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
          {stream.thumbnail_url ? (
            <img src={stream.thumbnail_url} alt={stream.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {isLive ? (
                <Radio className="w-12 h-12 text-red-400 animate-pulse" />
              ) : (
                <Video className="w-12 h-12 text-gray-600" />
              )}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5">
            {isLive && (
              <Badge className="bg-red-600 text-white border-0 text-[10px] px-2 animate-pulse">
                LIVE
              </Badge>
            )}
            {stream.status === "ended" && (
              <Badge variant="secondary" className="bg-black/60 text-white border-0 text-[10px] px-2">
                <Play className="w-2.5 h-2.5 mr-0.5" />
                Replay
              </Badge>
            )}
          </div>

          {/* Viewer count / Duration */}
          <div className="absolute bottom-2 right-2">
            {isLive ? (
              <Badge variant="secondary" className="bg-black/70 text-white border-0 text-[10px]">
                <Eye className="w-3 h-3 mr-1" />
                {stream.viewer_count}
              </Badge>
            ) : stream.started_at && stream.ended_at ? (
              <Badge variant="secondary" className="bg-black/70 text-white border-0 text-[10px]">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(stream.started_at, stream.ended_at)}
              </Badge>
            ) : null}
          </div>
        </div>

        <CardContent className="p-3">
          <div className="flex gap-3">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
              {stream.avatar_url ? (
                <img src={stream.avatar_url} alt={stream.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-primary">
                  {stream.full_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate leading-tight">{stream.title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{stream.full_name}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                {isLive ? (
                  <span className="flex items-center gap-0.5">
                    <Users className="w-3 h-3" />
                    {stream.viewer_count} watching
                  </span>
                ) : (
                  <>
                    <span>{stream.peak_viewers} peak viewers</span>
                    <span>-</span>
                    <span>{formatTimeAgo(stream.ended_at || stream.created_at)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  const ScheduledCard = ({ stream }: { stream: StreamWithProfile }) => {
    const scheduledDate = stream.scheduled_at ? new Date(stream.scheduled_at) : null;
    return (
      <Card className="overflow-hidden border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{stream.title}</h3>
              <p className="text-xs text-muted-foreground">{stream.full_name}</p>
              {scheduledDate && (
                <p className="text-xs text-primary mt-1">
                  {scheduledDate.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
            <Badge variant="outline" className="shrink-0 text-[10px]">Upcoming</Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-muted liquid-glass-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 px-4 sm:px-6 lg:px-8 pb-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-primary" />
              Discover Streams
            </h1>
            <p className="text-muted-foreground text-sm">
              Browse live streams, replays, and upcoming broadcasts from creators
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search streams, creators..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="shrink-0 text-xs"
              >
                {cat}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-10">
              {/* Live Now */}
              {filterBySearch(liveStreams).length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="text-lg font-bold text-foreground">Live Now</h2>
                    <Badge variant="secondary" className="text-[10px]">{liveStreams.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filterBySearch(liveStreams).map((s) => (
                      <StreamCard key={s.id} stream={s} isLive />
                    ))}
                  </div>
                </section>
              )}

              {/* Upcoming */}
              {filterBySearch(scheduledStreams).length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-bold text-foreground">Upcoming</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filterBySearch(scheduledStreams).map((s) => (
                      <ScheduledCard key={s.id} stream={s} />
                    ))}
                  </div>
                </section>
              )}

              {/* Recent Replays */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Play className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-lg font-bold text-foreground">Recent Replays</h2>
                </div>
                {filterBySearch(replayStreams).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filterBySearch(replayStreams).map((s) => (
                      <StreamCard key={s.id} stream={s} />
                    ))}
                  </div>
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                      <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-semibold mb-1">No replays yet</h3>
                      <p className="text-muted-foreground text-sm">
                        Past streams will appear here for replay
                      </p>
                    </CardContent>
                  </Card>
                )}
              </section>

              {/* Empty state when nothing at all */}
              {liveStreams.length === 0 && scheduledStreams.length === 0 && replayStreams.length === 0 && (
                <div className="text-center py-20">
                  <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h2 className="text-xl font-bold mb-2">No streams yet</h2>
                  <p className="text-muted-foreground mb-6">
                    Be the first to go live and share with your audience!
                  </p>
                  <Link to="/dashboard/streaming">
                    <Button className="bg-destructive hover:bg-destructive/90">
                      <Radio className="w-4 h-4 mr-2" />
                      Start Streaming
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Discover;
