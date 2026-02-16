import { useState, useEffect } from "react";
import { Play, Eye, Clock, Trash2, Globe, Upload, Radio, ExternalLink, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";

interface Recording {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  duration: number;
  view_count: number;
  visibility: string;
  created_at: string;
  stream_id: string;
}

const DashboardMedia = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveStreamCount, setLiveStreamCount] = useState(0);

  useEffect(() => {
    fetchMyMedia();
  }, []);

  const fetchMyMedia = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's recordings
      const { data: recData } = await (supabase
        .from("stream_recordings" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as any);

      setRecordings((recData || []) as Recording[]);

      // Check if user has any live streams
      const { data: liveData } = await supabase
        .from("streams")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "live");

      setLiveStreamCount((liveData || []).length);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (id: string, currentVisibility: string) => {
    const newVisibility = currentVisibility === "public" ? "private" : "public";
    const { error } = await (supabase
      .from("stream_recordings" as any)
      .update({ visibility: newVisibility })
      .eq("id", id) as any);

    if (error) {
      toast({ title: "Error", description: "Failed to update visibility.", variant: "destructive" });
      return;
    }

    fetchMyMedia();
    toast({ title: "Updated", description: `Recording is now ${newVisibility}.` });
  };

  const deleteRecording = async (id: string) => {
    const { error } = await (supabase
      .from("stream_recordings" as any)
      .delete()
      .eq("id", id) as any);

    if (error) {
      toast({ title: "Error", description: "Failed to delete recording.", variant: "destructive" });
      return;
    }

    fetchMyMedia();
    toast({ title: "Deleted", description: "Recording removed." });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const totalViews = recordings.reduce((sum, r) => sum + (r.view_count || 0), 0);
  const publicCount = recordings.filter((r) => r.visibility === "public").length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6 max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-6 h-6 text-primary" />
                My Media
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage your stream recordings and media content
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/media")}>
                <Globe className="w-4 h-4 mr-2" />
                Browse Public Media
              </Button>
              <Button size="sm" onClick={() => navigate("/streaming")}>
                <Radio className="w-4 h-4 mr-2" />
                Go Live
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{recordings.length}</p>
                  <p className="text-xs text-muted-foreground">Recordings</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{publicCount}</p>
                  <p className="text-xs text-muted-foreground">Public</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalViews}</p>
                  <p className="text-xs text-muted-foreground">Total Views</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{liveStreamCount}</p>
                  <p className="text-xs text-muted-foreground">Live Now</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recordings List */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recordings.length > 0 ? (
            <div className="space-y-3">
              {recordings.map((rec) => (
                <Card key={rec.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Thumbnail */}
                      <div className="w-32 h-20 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                        {rec.thumbnail_url ? (
                          <img src={rec.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Play className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{rec.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {rec.view_count} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(rec.duration)}
                          </span>
                          <span>{formatDate(rec.created_at)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={`cursor-pointer text-xs ${
                            rec.visibility === "public"
                              ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                          onClick={() => toggleVisibility(rec.id, rec.visibility)}
                        >
                          {rec.visibility === "public" ? "Public" : "Private"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRecording(rec.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold text-lg mb-2">No recordings yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start a live stream to create your first recording, or browse what others have shared.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => navigate("/streaming")}>
                    <Radio className="w-4 h-4 mr-2" />
                    Start Streaming
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/media")}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Browse Media
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardMedia;
