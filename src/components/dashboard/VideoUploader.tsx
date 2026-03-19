import { useState, useRef, useCallback } from "react";
import { Upload, X, Play, Clock, Film, AlertCircle, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface VideoUploaderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
}

interface VideoFile {
  file: File;
  preview: string;
  duration: number;
  thumbnail: string | null;
}

const MAX_DURATION_SECONDS = 180; // 3 minutes
const MAX_FILE_SIZE_MB = 500;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

export function VideoUploader({ open, onOpenChange, onUploadComplete }: VideoUploaderProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private" | "unlisted">("public");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetForm = useCallback(() => {
    setVideoFile(null);
    setTitle("");
    setDescription("");
    setVisibility("public");
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleClose = useCallback(() => {
    if (!isUploading) {
      resetForm();
      onOpenChange(false);
    }
  }, [isUploading, resetForm, onOpenChange]);

  const validateFile = async (file: File): Promise<{ valid: boolean; error?: string; duration?: number }> => {
    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: "Invalid file type. Please upload MP4, WebM, or MOV." };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return { valid: false, error: `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.` };
    }

    // Check video duration
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const duration = Math.round(video.duration);
        if (duration > MAX_DURATION_SECONDS) {
          resolve({ 
            valid: false, 
            error: `Video too long. Maximum duration is ${MAX_DURATION_SECONDS / 60} minutes.` 
          });
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

  const generateThumbnail = async (file: File): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;

      video.onloadeddata = () => {
        // Seek to 1 second or 10% of the video, whichever is less
        video.currentTime = Math.min(1, video.duration * 0.1);
      };

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
            URL.revokeObjectURL(video.src);
            resolve(thumbnail);
          } else {
            URL.revokeObjectURL(video.src);
            resolve(null);
          }
        } catch {
          URL.revokeObjectURL(video.src);
          resolve(null);
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(null);
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const processFile = async (file: File) => {
    setError(null);
    
    const validation = await validateFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    // Generate thumbnail
    const thumbnail = await generateThumbnail(file);
    
    // Set a default title from filename
    const defaultTitle = file.name.replace(/\.[^/.]+$/, "").slice(0, 100);
    if (!title) {
      setTitle(defaultTitle);
    }

    setVideoFile({
      file,
      preview: URL.createObjectURL(file),
      duration: validation.duration || 0,
      thumbnail,
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!videoFile || !title.trim()) {
      setError("Please provide a title for your video.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to upload videos.");
      }

      // Build form data
      const formData = new FormData();
      formData.append("file", videoFile.file);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("visibility", visibility);
      formData.append("duration", String(videoFile.duration));

      // Add thumbnail if available (convert base64 to blob)
      if (videoFile.thumbnail) {
        const thumbResponse = await fetch(videoFile.thumbnail);
        const thumbBlob = await thumbResponse.blob();
        formData.append("thumbnail", thumbBlob, "thumbnail.jpg");
      }

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Upload via API
      const response = await fetch("/api/upload-video", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Upload failed");
      }

      setUploadProgress(100);
      
      toast({
        title: "Video uploaded!",
        description: "Your video has been successfully uploaded to your media library.",
      });

      // Clean up and close
      setTimeout(() => {
        resetForm();
        onOpenChange(false);
        onUploadComplete?.();
      }, 500);

    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Upload Video
          </DialogTitle>
          <DialogDescription>
            Upload short videos up to 3 minutes long. Supported formats: MP4, WebM, MOV.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drop Zone or Video Preview */}
          {!videoFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
                isDragging 
                  ? "border-primary bg-primary/5" 
                  : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime,video/x-m4v"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Film className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium">
                    {isDragging ? "Drop your video here" : "Drag & drop your video here"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-muted rounded">Max 3 min</span>
                  <span className="px-2 py-1 bg-muted rounded">Max {MAX_FILE_SIZE_MB}MB</span>
                  <span className="px-2 py-1 bg-muted rounded">MP4, WebM, MOV</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Video Preview */}
              <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                <video
                  ref={videoRef}
                  src={videoFile.preview}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVideoFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Video Info */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(videoFile.duration)}
                </span>
                <span>{formatFileSize(videoFile.file.size)}</span>
                <span className="uppercase">{videoFile.file.type.split("/")[1]}</span>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Metadata Form */}
              {!isUploading && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter a title for your video"
                      maxLength={200}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description (optional)"
                      rows={3}
                      maxLength={2000}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select value={visibility} onValueChange={(v) => setVisibility(v as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <span className="flex items-center gap-2">Public - Anyone can view</span>
                        </SelectItem>
                        <SelectItem value="unlisted">
                          <span className="flex items-center gap-2">Unlisted - Only people with link</span>
                        </SelectItem>
                        <SelectItem value="private">
                          <span className="flex items-center gap-2">Private - Only you</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!videoFile || !title.trim() || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Upload Video
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
