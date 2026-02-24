import { useState, useEffect } from "react";
import { Play, Eye, Clock, User, Search, Radio, Filter, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Recording {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  duration: number;
  view_count: number;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface LiveStream {
  id: string;
  title: string;
  description: string | null;
  viewer_count: number;
  started_at: string | null;
  user_id: string;
  room_name: string | null;
  profiles?: {
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

const MediaPage = () => {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "recent" | "popular">(() => "all");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  useEffect(() => {
    fetchContent();

    // Subscribe to real-time updates for live streams
    const channel = supabase
      .channel("public-live-streams")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "streams",
        },
        () => {
          fetchContent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Fetch live streams
      const { data: liveData } = await supabase
        .from("streams")
        .select("id, title, description, viewer_count, started_at, user_id, room_name")
        .eq("status", "live")
        .order("viewer_count", { ascending: false });

      // Fetch public recordings (use 'as any' since type isn't auto-generated)
      const { data: recData } = await (supabase
        .from("stream_recordings" as any)
        .select("*")
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(50) as any);

      const recordingData: Recording[] = (recData || []) as Recording[];

      // Fetch profile data for all user_ids
      const allUserIds = [
        ...(liveData || []).map((s) => s.user_id),
        ...recordingData.map((r) => r.user_id),
      ];
      const uniqueIds = [...new Set(allUserIds)];

      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, username, full_name, avatar_url")
        .in("user_id", uniqueIds);

      const profileMap = new Map(
        (profilesData || []).map((p) => [p.user_id, p])
      );

      setLiveStreams(
        (liveData || []).map((s) => ({
          ...s,
          profiles: profileMap.get(s.user_id) || undefined,
        }))
      );

      setRecordings(
        recordingData.map((r) => ({
          ...r,
          profiles: profileMap.get(r.user_id) || undefined,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const filteredRecordings = recordings.filter((r) => {
    const matchesSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "popular") return matchesSearch;
    return matchesSearch;
  });

  const sortedRecordings = [...filteredRecordings].sort((a, b) => {
    if (filter === "popular") return b.view_count - a.view_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="text-xl font-bold text-primary shrink-0"
          >
            Share The Link
          </button>
          <div className="flex-1 max-w-xl relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search streams and videos..."
              className="pl-10 rounded-full bg-muted border-0"
            />
          </div>
          {isLoggedIn ? (
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard/media")}>
              My Media
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { key: "all", label: "All", icon: Filter },
            { key: "live", label: "Live Now", icon: Radio },
            { key: "recent", label: "Recent", icon: Clock },
            { key: "popular", label: "Trending", icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <Button
              key={key}
              variant={filter === key ? "default" : "secondary"}
              size="sm"
              onClick={() => setFilter(key as typeof filter)}
              className="shrink-0 rounded-full"
            >
              <Icon className="w-3.5 h-3.5 mr-1.5" />
              {label}
            </Button>
          ))}
        </div>

        {/* Live Streams Section */}
        {(filter === "all" || filter === "live") && liveStreams.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Radio className="w-5 h-5 text-destructive" />
              Live Now
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {liveStreams.map((stream) => (
                <Card
                  key={stream.id}
                  className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden"
                  onClick={() => {
                    const username = stream.profiles?.username;
                    if (username) navigate(`/live/${username}`);
                  }}
                >
                  <div className="relative aspect-video bg-gradient-to-br from-destructive/20 to-primary/20 flex items-center justify-center">
                    <Radio className="w-10 h-10 text-destructive animate-pulse" />
                    <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-xs">
                      LIVE
                    </Badge>
                    <Badge variant="secondary" className="absolute bottom-2 right-2 bg-black/70 text-white border-0 text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      {stream.viewer_count}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        {stream.profiles?.avatar_url ? (
                          <img
                            src={stream.profiles.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight">
                          {stream.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stream.profiles?.full_name || stream.profiles?.username || "Anonymous"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {stream.started_at ? formatTimeAgo(stream.started_at) : "Just started"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Recordings Section */}
        {(filter === "all" || filter === "recent" || filter === "popular") && (
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              {filter === "popular" ? "Trending Videos" : "Recent Videos"}
            </h2>

            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-video bg-muted rounded-lg mb-3" />
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedRecordings.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedRecordings.map((recording) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    formatDuration={formatDuration}
                    formatTimeAgo={formatTimeAgo}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No videos yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to stream and share your content!
                </p>
                <Button onClick={() => navigate(isLoggedIn ? "/streaming" : "/signup")}>
                  {isLoggedIn ? "Start Streaming" : "Get Started"}
                </Button>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

interface RecordingCardProps {
  recording: Recording;
  formatDuration: (s: number) => string;
  formatTimeAgo: (d: string) => string;
}

const RecordingCard = ({ recording, formatDuration, formatTimeAgo }: RecordingCardProps) => {
  const [playing, setPlaying] = useState(false);

  const incrementViews = async () => {
    await (supabase
      .from("stream_recordings" as any)
      .update({ view_count: (recording.view_count || 0) + 1 } as any)
      .eq("id", recording.id) as any);
  };

  return (
    <Card className="group cursor-pointer hover:shadow-lg transition-all overflow-hidden border-0 shadow-sm">
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        {playing ? (
          <video
            src={recording.video_url}
            autoPlay
            controls
            className="w-full h-full object-contain"
            onPlay={incrementViews}
          />
        ) : (
          <button
            className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50 hover:from-primary/10 hover:to-primary/5 transition-colors"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${recording.title}`}
          >
            {recording.thumbnail_url ? (
              <img
                src={recording.thumbnail_url}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-foreground ml-1" />
              </div>
            </div>
            {!recording.thumbnail_url && (
              <Play className="w-10 h-10 text-muted-foreground" />
            )}
          </button>
        )}
        {!playing && recording.duration > 0 && (
          <Badge
            variant="secondary"
            className="absolute bottom-2 right-2 bg-black/80 text-white border-0 text-xs"
          >
            {formatDuration(recording.duration)}
          </Badge>
        )}
      </div>
      <CardContent className="p-3">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {recording.profiles?.avatar_url ? (
              <img
                src={recording.profiles.avatar_url}
                alt=""
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <User className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight" onClick={() => setPlaying(true)}>
              {recording.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {recording.profiles?.full_name || recording.profiles?.username || "Anonymous"}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {recording.view_count} views
              </span>
              <span>{formatTimeAgo(recording.created_at)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaPage;
