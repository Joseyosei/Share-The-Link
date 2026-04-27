/**
 * useStreamRecording Hook
 * Records the local MediaStream using MediaRecorder and uploads to Vercel Blob via API.
 * This is the single source of truth for recording uploads - useStreaming no longer creates recordings.
 */
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Max recording size before we stop (500MB)
const MAX_RECORDING_SIZE = 500 * 1024 * 1024;

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
        videoBitsPerSecond: 2500000, // 2.5 Mbps
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
        setIsRecording(false);
        resolve(null);
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

  const uploadRecording = useCallback(
    async (
      blob: Blob, 
      userId: string, 
      streamId: string, 
      title: string, 
      description?: string,
      thumbnailDataUrl?: string
    ): Promise<string | null> => {
      setIsUploading(true);
      
      try {
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        // Calculate actual duration from recording time
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        
        // Determine file extension based on MIME type
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        
        // Create form data for upload
        const formData = new FormData();
        formData.append("file", blob, `recording-${streamId}.${ext}`);
        formData.append("title", title);
        formData.append("description", description || "");
        formData.append("visibility", "public");
        formData.append("duration", String(duration));
        formData.append("stream_id", streamId);
        
        // Add thumbnail if provided
        if (thumbnailDataUrl) {
          try {
            const thumbResponse = await fetch(thumbnailDataUrl);
            const thumbBlob = await thumbResponse.blob();
            formData.append("thumbnail", thumbBlob, "thumbnail.jpg");
          } catch (err) {
            console.warn("Failed to process thumbnail:", err);
          }
        }

        // Upload via API route (uses Vercel Blob)
        const response = await fetch("/api/upload-video", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Upload failed");
        }

        const result = await response.json();
        
        // Also update the stream record with the recording URL
        await supabase
          .from("streams")
          .update({ 
            recording_url: result.video?.video_url || null,
          })
          .eq("id", streamId);

        toast({ 
          title: "Recording saved!", 
          description: "Your stream has been saved to your media library." 
        });
        
        return result.video?.video_url || null;
      } catch (err) {
        console.error("Upload failed:", err);
        toast({ 
          title: "Upload failed", 
          description: err instanceof Error ? err.message : "Could not save recording.", 
          variant: "destructive" 
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
