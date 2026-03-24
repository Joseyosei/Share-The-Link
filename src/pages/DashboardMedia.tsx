import { useState, useEffect } from "react";
import { Play, Eye, Clock, Trash2, Globe, Upload, Radio, ExternalLink, Video, Lock, Link2, Film, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import { VideoUploader } from "@/components/dashboard/VideoUploader";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

interface UserVideo {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  video_url: string;
  duration: number;
  view_count: number;
  visibility: string;
  created_at: string;
  file_size: number | null;
  mime_type: string | null;
  status: string;
}

type MediaItem = (Recording | UserVideo) & { type: "recording" | "upload" };

const DashboardMedia = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [userVideos, setUserVideos] = useState<UserVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveStreamCount, setLiveStreamCount] = useState(0);
  const [showUploader, setShowUploader] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "recordings" | "uploads">("all");
  const [playingVideo, setPlayingVideo] = useState<MediaItem | null>(null);

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

      // Fetch user's uploaded videos
      const { data: videoData } = await (supabase
        .from("user_videos" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }) as any);

      setUserVideos((videoData || []) as UserVideo[]);

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

  const toggleVisibility = async (id: string, currentVisibility: string, type: "recording" | "upload") => {
    const newVisibility = currentVisibility === "public" ? "private" : "public";
    const table = type === "recording" ? "stream_recordings" : "user_videos";
    
    const { error } = await (supabase
      .from(table as any)
      .update({ visibility: newVisibility })
      .eq("id", id) as any);

    if (error) {
      toast({ title: "Error", description: "Failed to update visibility.", variant: "destructive" });
      return;
    }

    fetchMyMedia();
    toast({ title: "Updated", description: `Video is now ${newVisibility}.` });
  };

  const deleteMedia = async (id: string, type: "recording" | "upload") => {
    const table = type === "recording" ? "stream_recordings" : "user_videos";
    
    const { error } = await (supabase
      .from(table as any)
      .delete()
      .eq("id", id) as any);

    if (error) {
      toast({ title: "Error", description: "Failed to delete video.", variant: "destructive" });
      return;
    }

    fetchMyMedia();
    toast({ title: "Deleted", description: "Video removed from your library." });
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

  // Combine and filter media items
  const getAllMedia = (): MediaItem[] => {
    const allRecordings: MediaItem[] = recordings.map(r => ({ ...r, type: "recording" as const }));
    const allUploads: MediaItem[] = userVideos.map(v => ({ ...v, type: "upload" as const }));
    return [...allRecordings, ...allUploads].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const getFilteredMedia = (): MediaItem[] => {
    const all = getAllMedia();
    if (activeTab === "recordings") return all.filter(m => m.type === "recording");
    if (activeTab === "uploads") return all.filter(m => m.type === "upload");
    return all;
  };

  const filteredMedia = getFilteredMedia();
  const totalViews = getAllMedia().reduce((sum, r) => sum + (r.view_count || 0), 0);
  const publicCount = getAllMedia().filter((r) => r.visibility === "public").length;

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public": return <Globe className="w-3 h-3" />;
      case "private": return <Lock className="w-3 h-3" />;
      case "unlisted": return <Link2 className="w-3 h-3" />;
      default: return <Globe className="w-3 h-3" />;
    }
  };

  const getVisibilityStyle = (visibility: string) => {
    switch (visibility) {
      case "public": return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "private": return "bg-muted text-muted-foreground hover:bg-muted/80";
      case "unlisted": return "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20";
      default: return "bg-muted text-muted-foreground hover:bg-muted/80";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 pt-16 lg:pt-0 overflow-x-hidden">
        <div className="p-3 sm:p-6 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Video className="w-6 h-6 text-primary" />
                My Media
              </h1>
              <p className="text-muted-foreground text-sm">
                Manage your stream recordings and uploaded videos
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/media")}>
                <Globe className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Browse </span>Media
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/streaming")}>
                <Radio className="w-4 h-4 mr-1 sm:mr-2" />
                Go Live
              </Button>
              <Button size="sm" onClick={() => setShowUploader(true)}>
                <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                Upload<span className="hidden sm:inline"> Video</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Video className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{getAllMedia().length}</p>
                  <p className="text-xs text-muted-foreground">Total Videos</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Film className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userVideos.length}</p>
                  <p className="text-xs text-muted-foreground">Uploads</p>
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

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
            <TabsList>
              <TabsTrigger value="all">All Media ({getAllMedia().length})</TabsTrigger>
              <TabsTrigger value="recordings">Recordings ({recordings.length})</TabsTrigger>
              <TabsTrigger value="uploads">Uploads ({userVideos.length})</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Media List */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredMedia.length > 0 ? (
            <div className="space-y-3">
              {filteredMedia.map((item) => (
                <Card key={`${item.type}-${item.id}`} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      {/* Thumbnail */}
                      <div
                        className="w-24 h-16 sm:w-32 sm:h-20 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center cursor-pointer relative group"
                        onClick={() => setPlayingVideo(item)}
                      >
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Play className="w-8 h-8 text-muted-foreground" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-8 h-8 text-white" fill="white" />
                        </div>
                        {/* Duration badge */}
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                          {formatDuration(item.duration)}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{item.title}</h3>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {item.type === "recording" ? "Recording" : "Upload"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {item.view_count} views
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(item.duration)}
                          </span>
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={`cursor-pointer text-xs flex items-center gap-1 ${getVisibilityStyle(item.visibility)}`}
                          onClick={() => toggleVisibility(item.id, item.visibility, item.type)}
                        >
                          {getVisibilityIcon(item.visibility)}
                          {item.visibility.charAt(0).toUpperCase() + item.visibility.slice(1)}
                        </Badge>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Video</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{item.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => deleteMedia(item.id, item.type)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                <h3 className="font-semibold text-lg mb-2">
                  {activeTab === "all" && "No media yet"}
                  {activeTab === "recordings" && "No recordings yet"}
                  {activeTab === "uploads" && "No uploads yet"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === "all" && "Start a live stream or upload a video to build your media library."}
                  {activeTab === "recordings" && "Go live and enable recording to save your streams."}
                  {activeTab === "uploads" && "Upload your first video to get started."}
                </p>
                <div className="flex gap-3 justify-center">
                  {(activeTab === "all" || activeTab === "uploads") && (
                    <Button onClick={() => setShowUploader(true)}>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Video
                    </Button>
                  )}
                  {(activeTab === "all" || activeTab === "recordings") && (
                    <Button variant="outline" onClick={() => navigate("/streaming")}>
                      <Radio className="w-4 h-4 mr-2" />
                      Start Streaming
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Video Uploader Modal */}
      <VideoUploader
        open={showUploader}
        onOpenChange={setShowUploader}
        onUploadComplete={fetchMyMedia}
      />

      {/* Video Player Modal */}
      <Dialog open={!!playingVideo} onOpenChange={(open) => !open && setPlayingVideo(null)}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="truncate pr-8">{playingVideo?.title}</DialogTitle>
          </DialogHeader>
          {playingVideo && (
            <div className="aspect-video bg-black">
              <video
                src={playingVideo.video_url}
                className="w-full h-full"
                controls
                autoPlay
                playsInline
              />
            </div>
          )}
          {playingVideo?.description && (
            <div className="p-4 pt-2 text-sm text-muted-foreground">
              {playingVideo.description}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardMedia;
