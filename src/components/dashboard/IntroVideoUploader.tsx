import { useState, useRef, useCallback } from "react";
import { Video, Upload, X, Play, Trash2, AlertCircle, Loader2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface IntroVideoUploaderProps {
  currentVideoUrl: string;
  userId: string;
  onVideoChange: (url: string) => void;
}

const MAX_DURATION_SECONDS = 60; // 60 seconds for intro video
const MAX_FILE_SIZE_MB = 100;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

export function IntroVideoUploader({ currentVideoUrl, userId, onVideoChange }: IntroVideoUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const validateFile = async (file: File): Promise<{ valid: boolean; error?: string; duration?: number }> => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: "Invalid file type. Please upload MP4, WebM, or MOV." };
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` };
    }
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration);
        if (duration > MAX_DURATION_SECONDS) {
          resolve({ valid: false, error: `Video too long. Maximum duration is ${MAX_DURATION_SECONDS} seconds for intro videos.` });
        } else {
          resolve({ valid: true, duration });
        }
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve({ valid: false, error: "Could not read video file." });
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUpload = async (file: File) => {
    setError(null);
    const validation = await validateFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to upload videos.");
      }

      // Upload to Supabase Storage
      const fileName = `intro-video-${userId}-${Date.now()}.${file.name.split(".").pop()}`;
      const storagePath = `intro-videos/${userId}/${fileName}`;

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) { clearInterval(progressInterval); return prev; }
          return prev + Math.random() * 15;
        });
      }, 300);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: true,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        // If "videos" bucket doesn't exist, try a general upload approach
        // Store as a data URL for now (for smaller files) or use the API
        const formData = new FormData();
        formData.append("file", file);
        formData.append("title", "Intro Video");
        formData.append("description", "Profile intro video");
        formData.append("visibility", "public");
        formData.append("duration", String(validation.duration || 0));

        const response = await fetch("/api/upload-video", {
          method: "POST",
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Upload failed");

        setUploadProgress(100);
        const videoUrl = result.video?.video_url || result.video_url || result.url || "";
        onVideoChange(videoUrl);

        toast({
          title: "Intro video uploaded!",
          description: "Your intro video will appear as a floating bubble on your profile.",
        });
        return;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("videos")
        .getPublicUrl(storagePath);

      setUploadProgress(100);
      const publicUrl = urlData.publicUrl;
      onVideoChange(publicUrl);

      toast({
        title: "Intro video uploaded!",
        description: "Your intro video will appear as a floating bubble on your profile.",
      });
    } catch (err) {
      console.error("Intro video upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleUpload(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleUpload(file);
  };

  const handleRemoveVideo = async () => {
    onVideoChange("");
    setPreviewUrl(null);
    setError(null);
    toast({
      title: "Intro video removed",
      description: "The floating video bubble will no longer appear on your profile.",
    });
  };

  const displayUrl = previewUrl || currentVideoUrl;

  return (
    <div className="pt-4 border-t border-border">
      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
        <Video className="w-4 h-4 text-primary" />
        Intro Video
      </h3>
      <p className="text-xs text-muted-foreground mb-3">
        Add a short video intro (max 60s) that appears as a floating bubble on your profile — like VideoAsk.
      </p>

      {error && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded-lg text-xs mb-3">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {displayUrl ? (
        <div className="space-y-3">
          {/* Preview */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-primary/30 shadow-lg mx-auto">
            <video
              src={displayUrl}
              muted
              playsInline
              loop
              autoPlay
              className="w-full h-full object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Actions */}
          {!isUploading && (
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs"
              >
                <Upload className="w-3.5 h-3.5 mr-1.5" />
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemoveVideo}
                className="text-xs text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Film className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">
              {isDragging ? "Drop your video here" : "Upload intro video"}
            </p>
            <p className="text-xs text-muted-foreground">
              Max 60 seconds | MP4, WebM, MOV | Up to {MAX_FILE_SIZE_MB}MB
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
