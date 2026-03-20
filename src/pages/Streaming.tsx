import { useState, useEffect } from "react";
import { Radio, Video, Calendar, Users, DollarSign, Plus, Copy, ExternalLink, Play, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { GoLiveModal, StreamPlayer, StreamChat, TipJar, StreamStats } from "@/components/streaming/StreamingComponents";
import { useStreaming, Stream } from "@/hooks/useStreaming";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface StreamRecording {
  id: string;
  stream_id: string | null;
  video_url: string;
  title: string;
  description: string | null;
  duration: number;
  view_count: number;
  created_at: string;
}

const Streaming = () => {
  const { profile } = useUserProfile();
  const { toast } = useToast();
  const { streams, fetchMyStreams, loading, currentStream, setCurrentStream, createStream } = useStreaming();
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [recordings, setRecordings] = useState<StreamRecording[]>([]);
  const [selectedRecording, setSelectedRecording] = useState<StreamRecording | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchMyStreams();
    fetchRecordings();
  }, [fetchMyStreams]);

  const fetchRecordings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await (supabase.from("stream_recordings" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }) as any);
    if (error) console.error("[v0] Recordings fetch error:", error);
    if (data) setRecordings(data as StreamRecording[]);
  };

  const handleStreamCreated = () => {
    setIsStreamActive(true);
  };

  const getRecordingForStream = (streamId: string) => {
    return recordings.find(r => r.stream_id === streamId);
  };

  const handleDeleteRecording = async (recordingId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (deletingId) return;
    setDeletingId(recordingId);
    try {
      const { error } = await (supabase.from("stream_recordings" as any)
        .delete()
        .eq("id", recordingId) as any);
      if (error) throw error;
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
      if (selectedRecording?.id === recordingId) setSelectedRecording(null);
      toast({ title: "Recording deleted" });
    } catch (err) {
      console.error("Delete recording error:", err);
      toast({ title: "Error", description: "Failed to delete recording", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteStream = async (streamId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (deletingId) return;
    setDeletingId(streamId);
    try {
      // Delete related recordings first
      await (supabase.from("stream_recordings" as any)
        .delete()
        .eq("stream_id", streamId) as any);
      // Delete chat, tips, viewers
      await (supabase.from("stream_chat" as any).delete().eq("stream_id", streamId) as any);
      await (supabase.from("stream_tips" as any).delete().eq("stream_id", streamId) as any);
      await (supabase.from("stream_viewers" as any).delete().eq("stream_id", streamId) as any);
      // Delete the stream
      const { error } = await (supabase.from("streams" as any)
        .delete()
        .eq("id", streamId) as any);
      if (error) throw error;
      setRecordings(prev => prev.filter(r => r.stream_id !== streamId));
      fetchMyStreams();
      toast({ title: "Stream deleted" });
    } catch (err) {
      console.error("Delete stream error:", err);
      toast({ title: "Error", description: "Failed to delete stream", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const liveStreams = streams.filter(s => s.status === "live");
  const pastStreams = streams.filter(s => s.status === "ended");
  const scheduledStreams = streams.filter(s => s.status === "offline" && s.scheduled_at);

  const username = profile?.username || "streamer";

  return (
    <div className="min-h-screen bg-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 p-8 pt-20 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-1 flex items-center gap-2">
                <Radio className="w-8 h-8 text-destructive" />
                Live Streaming
              </h1>
              <p className="text-muted-foreground">
                Stream directly to your audience and earn tips
              </p>
            </div>
            <Button
              onClick={() => setShowGoLiveModal(true)}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Radio className="w-4 h-4 mr-2" />
              Go Live
            </Button>
          </div>

          {/* Active Stream */}
          {isStreamActive && currentStream && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-destructive animate-pulse">LIVE</Badge>
                  <h2 className="text-xl font-bold">{currentStream.title}</h2>
                </div>
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2">
                  <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                    {window.location.origin}/live/{username}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/live/${username}`);
                    }}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(`/live/${username}`, "_blank")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <StreamPlayer
                    isOwner={true}
                    streamId={currentStream.id}
                    roomName={currentStream.room_name || undefined}
                    onEnd={() => {
                      setIsStreamActive(false);
                      fetchMyStreams();
                      // Refresh recordings after stream ends (delay for upload)
                      setTimeout(fetchRecordings, 5000);
                    }}
                  />
                  <div className="mt-4">
                    <StreamStats
                      viewerCount={currentStream.viewer_count}
                      totalTips={currentStream.total_tips}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <StreamChat streamId={currentStream.id} username={username} />
                  <TipJar streamId={currentStream.id} tipperName={username} />
                </div>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          <div className="grid sm:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streams.length}</p>
                  <p className="text-sm text-muted-foreground">Total Streams</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {streams.reduce((acc, s) => acc + (s.peak_viewers || 0), 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Peak Viewers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    ${streams.reduce((acc, s) => acc + (s.total_tips || 0), 0).toFixed(0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Tips</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{scheduledStreams.length}</p>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Streams List */}
          <div className="space-y-6">
            {/* Live Now */}
            {liveStreams.length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Badge className="bg-destructive">LIVE</Badge>
                  Currently Live
                </h2>
                <div className="grid gap-4">
                  {liveStreams.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} />
                  ))}
                </div>
              </div>
            )}

            {/* Past Streams */}
            <div>
              <h2 className="text-lg font-bold mb-4">Past Streams</h2>
              {pastStreams.length > 0 ? (
                <div className="grid gap-4">
                  {pastStreams.map((stream) => {
                    const recording = getRecordingForStream(stream.id);
                    return (
                      <StreamCard
                        key={stream.id}
                        stream={stream}
                        recording={recording}
                        onWatch={(rec) => setSelectedRecording(rec)}
                        onDelete={(id, e) => handleDeleteStream(id, e)}
                        deleting={deletingId === stream.id}
                      />
                    );
                  })}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-12 text-center">
                    <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">No streams yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start your first stream and connect with your audience
                    </p>
                    <Button onClick={() => setShowGoLiveModal(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Start Streaming
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Standalone Recordings (not linked to a stream) */}
            {recordings.filter(r => !r.stream_id || !pastStreams.find(s => s.id === r.stream_id)).length > 0 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Saved Recordings</h2>
                <div className="grid gap-4">
                  {recordings
                    .filter(r => !r.stream_id || !pastStreams.find(s => s.id === r.stream_id))
                    .map((rec) => (
                      <Card
                        key={rec.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedRecording(rec)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Play className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">{rec.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(rec.created_at).toLocaleDateString("en-US", {
                                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                                  })}
                                  {rec.duration > 0 && ` -- ${formatDuration(rec.duration)}`}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" className="gap-2">
                                <Play className="w-4 h-4" />
                                Watch
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingId === rec.id}
                                onClick={(e) => handleDeleteRecording(rec.id, e)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <GoLiveModal
        isOpen={showGoLiveModal}
        onClose={() => setShowGoLiveModal(false)}
        onStreamCreated={handleStreamCreated}
        createStreamFn={createStream}
        isLoading={loading}
      />

      {/* Video Replay Modal */}
      <Dialog open={!!selectedRecording} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-white flex items-center justify-between">
              <span>{selectedRecording?.title || "Stream Replay"}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="w-full aspect-video bg-black">
            {selectedRecording?.video_url ? (
              <video
                src={selectedRecording.video_url}
                controls
                autoPlay
                className="w-full h-full"
                playsInline
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/60">
                <div className="text-center">
                  <Video className="w-16 h-16 mx-auto mb-4 opacity-40" />
                  <p>No recording available for this stream</p>
                  <p className="text-sm mt-1 text-white/40">
                    Future streams will be automatically recorded
                  </p>
                </div>
              </div>
            )}
          </div>
          {selectedRecording && (
            <div className="p-4 bg-card flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {new Date(selectedRecording.created_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </span>
              <div className="flex items-center gap-4">
                {selectedRecording.duration > 0 && (
                  <span>Duration: {formatDuration(selectedRecording.duration)}</span>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === selectedRecording.id}
                  onClick={() => handleDeleteRecording(selectedRecording.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

interface StreamCardProps {
  stream: Stream;
  recording?: StreamRecording;
  onWatch?: (rec: StreamRecording) => void;
  onDelete?: (streamId: string, e?: React.MouseEvent) => void;
  deleting?: boolean;
}

const StreamCard = ({ stream, recording, onWatch, onDelete, deleting }: StreamCardProps) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className={recording ? "cursor-pointer hover:shadow-md transition-shadow" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                recording ? "bg-primary/10" : "bg-muted"
              }`}
              onClick={() => recording && onWatch?.(recording)}
            >
              {recording ? (
                <Play className="w-6 h-6 text-primary" />
              ) : (
                <Video className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">{stream.title}</h3>
              <p className="text-sm text-muted-foreground">
                {stream.started_at ? formatDate(stream.started_at) : formatDate(stream.created_at)}
                {recording && recording.duration > 0 && (
                  <span className="ml-2 text-primary">
                    -- {formatDuration(recording.duration)}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <p className="font-bold">{stream.peak_viewers || 0}</p>
              <p className="text-muted-foreground">viewers</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-accent">${(stream.total_tips || 0).toFixed(0)}</p>
              <p className="text-muted-foreground">tips</p>
            </div>
            {stream.status === "live" && (
              <Badge className="bg-destructive">LIVE</Badge>
            )}
            {recording && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onWatch?.(recording);
                }}
              >
                <Play className="w-4 h-4" />
                Watch
              </Button>
            )}
            {!recording && stream.status === "ended" && (
              <Badge variant="secondary" className="text-xs">No recording</Badge>
            )}
            {stream.status === "ended" && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={deleting}
                onClick={(e) => onDelete(stream.id, e)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Streaming;
