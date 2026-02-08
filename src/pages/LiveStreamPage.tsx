/**
 * LiveStreamPage
 *
 * Public viewer page for watching a live stream via WebRTC P2P.
 * Route: /live/:username
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ViewerPlayer, StreamChat, TipJar, StreamStats } from "@/components/streaming/StreamingComponents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Radio, User, ArrowLeft } from "lucide-react";

interface LiveStreamData {
  id: string;
  title: string;
  description: string | null;
  room_name: string;
  viewer_count: number;
  total_tips: number;
  started_at: string;
  user_id: string;
}

interface StreamerProfile {
  username: string;
  full_name: string;
  avatar_url: string | null;
}

const LiveStreamPage = () => {
  const { username } = useParams<{ username: string }>();
  const [stream, setStream] = useState<LiveStreamData | null>(null);
  const [streamer, setStreamer] = useState<StreamerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerName, setViewerName] = useState("Anonymous");

  // Fetch active stream for this user
  useEffect(() => {
    const fetchStream = async () => {
      if (!username) return;

      try {
        // Get profile by username
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("user_id, username, full_name, avatar_url")
          .eq("username", username)
          .single();

        if (profileError || !profile) {
          setError("User not found");
          setLoading(false);
          return;
        }

        setStreamer(profile as StreamerProfile);

        // Get active live stream
        const { data: liveStream, error: streamError } = await supabase
          .from("streams")
          .select("*")
          .eq("user_id", profile.user_id)
          .eq("status", "live")
          .order("started_at", { ascending: false })
          .limit(1)
          .single();

        if (streamError || !liveStream) {
          setError("not_live");
          setLoading(false);
          return;
        }

        setStream(liveStream as unknown as LiveStreamData);

        // Try to get current user's name
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: viewerProfile } = await supabase
            .from("profiles")
            .select("username, full_name")
            .eq("user_id", user.id)
            .single();
          if (viewerProfile) {
            setViewerName(viewerProfile.full_name || viewerProfile.username || "Anonymous");
          }
        }
      } catch (err) {
        console.error("Error fetching stream:", err);
        setError("Failed to load stream");
      } finally {
        setLoading(false);
      }
    };

    fetchStream();
  }, [username]);

  // Subscribe to stream status changes
  useEffect(() => {
    if (!stream?.id) return;

    const channel = supabase
      .channel(`stream-status-${stream.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "streams",
          filter: `id=eq.${stream.id}`,
        },
        (payload) => {
          const updated = payload.new as Record<string, unknown>;
          if (updated.status === "ended") {
            setError("stream_ended");
            setStream(null);
          } else {
            setStream((prev) =>
              prev
                ? {
                    ...prev,
                    viewer_count: (updated.viewer_count as number) || prev.viewer_count,
                    total_tips: (updated.total_tips as number) || prev.total_tips,
                  }
                : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [stream?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error === "not_live") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Radio className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">
              {streamer?.full_name || username} is not live
            </h2>
            <p className="text-muted-foreground">
              Check back later or visit their profile for more content.
            </p>
            <Button asChild variant="outline">
              <Link to={`/${username}`}>
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error === "stream_ended") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <Radio className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">Stream has ended</h2>
            <p className="text-muted-foreground">
              Thanks for watching! Visit {streamer?.full_name || username}&apos;s profile.
            </p>
            <Button asChild variant="outline">
              <Link to={`/${username}`}>
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <h2 className="text-xl font-bold">Something went wrong</h2>
            <p className="text-muted-foreground">{error || "Stream not found"}</p>
            <Button asChild variant="outline">
              <Link to="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to={`/${username}`}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Profile
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              {streamer?.avatar_url ? (
                <img
                  src={streamer.avatar_url}
                  alt={streamer.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
              <div>
                <p className="font-semibold text-sm leading-tight">
                  {streamer?.full_name || username}
                </p>
                <Badge variant="destructive" className="text-[10px] h-4 animate-pulse">
                  LIVE
                </Badge>
              </div>
            </div>
          </div>
          <StreamStats
            viewerCount={stream.viewer_count}
            totalTips={stream.total_tips}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video */}
          <div className="lg:col-span-2 space-y-4">
            <ViewerPlayer
              roomName={stream.room_name}
              streamTitle={stream.title}
            />
            <div>
              <h1 className="text-xl font-bold">{stream.title}</h1>
              {stream.description && (
                <p className="text-muted-foreground mt-1">{stream.description}</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <StreamChat streamId={stream.id} username={viewerName} />
            <TipJar streamId={stream.id} tipperName={viewerName} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiveStreamPage;
