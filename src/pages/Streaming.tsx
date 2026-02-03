import { useState, useEffect } from "react";
import { Radio, Video, Calendar, Users, DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { GoLiveModal, StreamPlayer, StreamChat, TipJar, StreamStats } from "@/components/streaming/StreamingComponents";
import { useStreaming, Stream } from "@/hooks/useStreaming";
import { useUserProfile } from "@/hooks/useUserProfile";

const Streaming = () => {
  const { profile } = useUserProfile();
  const { streams, fetchMyStreams, loading, currentStream, setCurrentStream } = useStreaming();
  const [showGoLiveModal, setShowGoLiveModal] = useState(false);
  const [activeStreamData, setActiveStreamData] = useState<{
    roomUrl: string;
    ownerToken: string;
  } | null>(null);

  useEffect(() => {
    fetchMyStreams();
  }, [fetchMyStreams]);

  const handleStreamCreated = (data: { roomUrl: string; ownerToken: string; stream: { id: string } }) => {
    setActiveStreamData({
      roomUrl: data.roomUrl,
      ownerToken: data.ownerToken,
    });
    // Find and set the current stream
    const stream = streams.find(s => s.id === data.stream.id);
    if (stream) {
      setCurrentStream(stream);
    }
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
          {activeStreamData && currentStream && (
            <div className="mb-8 space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-destructive animate-pulse">🔴 LIVE</Badge>
                <h2 className="text-xl font-bold">{currentStream.title}</h2>
              </div>
              
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <StreamPlayer
                    roomUrl={activeStreamData.roomUrl}
                    ownerToken={activeStreamData.ownerToken}
                    isOwner={true}
                    streamId={currentStream.id}
                    onEnd={() => {
                      setActiveStreamData(null);
                      fetchMyStreams();
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
                  {pastStreams.map((stream) => (
                    <StreamCard key={stream.id} stream={stream} />
                  ))}
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
          </div>
        </div>
      </main>

      <GoLiveModal
        isOpen={showGoLiveModal}
        onClose={() => setShowGoLiveModal(false)}
        onStreamCreated={handleStreamCreated}
      />
    </div>
  );
};

const StreamCard = ({ stream }: { stream: Stream }) => {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
              <Video className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold">{stream.title}</h3>
              <p className="text-sm text-muted-foreground">
                {stream.started_at ? formatDate(stream.started_at) : formatDate(stream.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Streaming;
