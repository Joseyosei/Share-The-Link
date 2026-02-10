/**
 * useStreamRecording Hook
 * Records the local MediaStream using MediaRecorder and uploads to Supabase Storage.
 */
import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useStreamRecording() {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback((stream: MediaStream) => {
    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

    try {
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start(1000); // chunk every second
      mediaRecorderRef.current = recorder;
      startTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, []);

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setIsRecording(false);
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        chunksRef.current = [];
        setIsRecording(false);
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  const uploadRecording = useCallback(
    async (blob: Blob, userId: string, streamId: string, title: string, description?: string) => {
      setIsUploading(true);
      try {
        const ext = blob.type.includes("mp4") ? "mp4" : "webm";
        const fileName = `${userId}/${streamId}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("stream-recordings")
          .upload(fileName, blob, { contentType: blob.type, upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("stream-recordings")
          .getPublicUrl(fileName);

        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);

        const { error: dbError } = await supabase.from("stream_recordings").insert({
          stream_id: streamId,
          user_id: userId,
          title,
          description: description || null,
          video_url: urlData.publicUrl,
          duration,
          visibility: "public",
        });

        if (dbError) throw dbError;

        toast({ title: "Recording saved!", description: "Your stream has been saved to your library." });
        return urlData.publicUrl;
      } catch (err) {
        console.error("Upload failed:", err);
        toast({ title: "Upload failed", description: "Could not save recording.", variant: "destructive" });
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [toast]
  );

  return { isRecording, isUploading, startRecording, stopRecording, uploadRecording };
}
