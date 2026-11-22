/**
 * useStreamRecording Hook
 * Records the local MediaStream using MediaRecorder and uploads it directly to Vercel Blob.
 * This is the single source of truth for recording uploads - useStreaming no longer creates recordings.
 */
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { upload } from "@vercel/blob/client";

// Max recording size before we stop (1.5GB, about 2 hours at the bitrate below).
// The file is uploaded with multipart client uploads, so size is no longer
// limited by the serverless body limit, only by browser memory.
const MAX_RECORDING_SIZE = 1.5 * 1024 * 1024 * 1024;

export function useStreamRecording() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingSize, setRecordingSize] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const totalSizeRef = useRef<number>(0);

  const startRecording = useCallback((stream: MediaStream) => {
    chunksRef.current = [];
    totalSizeRef.current = 0;
    setRecordingSize(0);
    
    // Prefer VP9 for better quality, fallback to VP8 or default
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "video/mp4";

    try {
      const recorder = new MediaRecorder(stream, { 
        mimeType, 
        videoBitsPerSecond: 1500000, // 1.5 Mbps: good 720p replays, ~11 MB/min
        audioBitsPerSecond: 128000, // 128 kbps
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          totalSizeRef.current += e.data.size;
          setRecordingSize(totalSizeRef.current);
          
          // Auto-stop if recording gets too large
          if (totalSizeRef.current >= MAX_RECORDING_SIZE) {
            console.warn("Recording size limit reached, stopping...");
            recorder.stop();
          }
        }
      };
      
      recorder.onerror = (event) => {
        console.error("MediaRecorder error:", event);
        setIsRecording(false);
      };
      
      recorder.start(1000); // chunk every second for smoother progress updates
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
      
      return true;
    } catch (err) {
      console.error("Failed to start recording:", err);
      toast({
        title: "Recording failed",
        description: "Could not start recording. Your browser may not support this feature.",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        // The recorder may have auto-stopped at the size cap: keep what we have.
        setIsRecording(false);
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: recorder?.mimeType || "video/webm" });
          chunksRef.current = [];
          resolve(blob);
        } else {
          resolve(null);
        }
        return;
      }
      
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "video/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];
        setIsRecording(false);
        resolve(blob);
      };
      
      recorder.stop();
    });
  }, []);

  /**
   * Upload the finished recording and register it on the Media page.
   *
   * The file goes straight from the browser to Vercel Blob (multipart, resumable
   * parts) using a short-lived token from /api/upload-video?action=client-upload. It never passes
   * through a serverless function, so the 4.5 MB function body limit that used to
   * reject every stream recording no longer applies. A small JSON "finalize" call
   * then writes the stream_recordings row and kicks off the post-stream AI agent.
   */
  const uploadRecording = useCallback(
    async (
      blob: Blob,
      userId: string,
      streamId: string,
      title: string,
      description?: string,
      thumbnailDataUrl?: string,
      onProgress?: (percentage: number) => void
    ): Promise<string | null> => {
      setIsUploading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");
        const authHeaders = { Authorization: `Bearer ${session.access_token}` };

        const duration = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
        // MediaRecorder reports e.g. "video/webm;codecs=vp9,opus" - strip codec params
        const contentType = (blob.type || "video/webm").split(";")[0].trim();
        const ext = contentType.includes("mp4") ? "mp4" : "webm";

        const video = await upload(`recordings/${userId}/${streamId}.${ext}`, blob, {
          access: "public",
          handleUploadUrl: "/api/upload-video?action=client-upload",
          headers: authHeaders,
          clientPayload: JSON.stringify({ streamId, kind: "video" }),
          contentType,
          multipart: blob.size > 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => onProgress?.(Math.min(99, Math.round(percentage))),
        });

        let thumbnailUrl: string | null = null;
        if (thumbnailDataUrl) {
          try {
            const thumbBlob = await (await fetch(thumbnailDataUrl)).blob();
            const thumb = await upload(`recordings/${userId}/${streamId}-thumb.jpg`, thumbBlob, {
              access: "public",
              handleUploadUrl: "/api/upload-video?action=client-upload",
              headers: authHeaders,
              clientPayload: JSON.stringify({ streamId, kind: "thumbnail" }),
              contentType: "image/jpeg",
            });
            thumbnailUrl = thumb.url;
          } catch (err) {
            console.warn("Thumbnail upload failed:", err);
          }
        }

        const res = await fetch("/api/upload-video?action=finalize", {
          method: "POST",
          headers: { ...authHeaders, "Content-Type": "application/json" },
          body: JSON.stringify({
            stream_id: streamId,
            video_url: video.url,
            thumbnail_url: thumbnailUrl,
            title,
            description: description || "",
            duration,
            size_bytes: blob.size,
          }),
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || "Could not save the recording");
        }
        onProgress?.(100);

        toast({
          title: "Replay saved",
          description: "Your stream is on your Media page. AI is writing the title, description and social posts.",
        });

        return video.url;
      } catch (err) {
        console.error("Upload failed:", err);
        toast({
          title: "Upload failed",
          description: err instanceof Error ? err.message : "Could not save recording.",
          variant: "destructive",
        });
        return null;
      } finally {
        setIsUploading(false);
        setRecordingSize(0);
      }
    },
    [toast]
  );

  // Generate a thumbnail from the video stream
  const generateThumbnail = useCallback((stream: MediaStream): Promise<string | null> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        
        video.onloadeddata = () => {
          // Wait a moment for the video to render
          setTimeout(() => {
            try {
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth || 640;
              canvas.height = video.videoHeight || 360;
              const ctx = canvas.getContext("2d");
              
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
                video.srcObject = null;
                resolve(dataUrl);
              } else {
                video.srcObject = null;
                resolve(null);
              }
            } catch (err) {
              console.warn("Thumbnail generation failed:", err);
              video.srcObject = null;
              resolve(null);
            }
          }, 500);
        };
        
        video.onerror = () => {
          video.srcObject = null;
          resolve(null);
        };
        
        video.play().catch(() => {
          video.srcObject = null;
          resolve(null);
        });
      } catch (err) {
        console.warn("Thumbnail setup failed:", err);
        resolve(null);
      }
    });
  }, []);

  // Format recording size for display
  const formatRecordingSize = useCallback((bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  return { 
    isRecording, 
    isUploading, 
    recordingSize,
    formatRecordingSize,
    startRecording, 
    stopRecording, 
    uploadRecording,
    generateThumbnail,
  };
}
