import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateStreamContent, validateChatMessage } from "@/lib/content-moderation";

// Heartbeat interval (30 seconds) to detect stale streams
const HEARTBEAT_INTERVAL = 30000;

export interface Stream {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: "offline" | "live" | "ended";
  room_name: string | null;
  room_url: string | null;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  viewer_count: number;
  peak_viewers: number;
  total_tips: number;
  thumbnail_url: string | null;
  is_recording: boolean;
  recording_url: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  stream_id: string;
  user_id: string | null;
  username: string;
  message: string;
  message_type: "message" | "tip" | "system";
  is_highlighted: boolean;
  created_at: string;
}

export const useStreaming = () => {
  const { toast } = useToast();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [currentStream, setCurrentStream] = useState<Stream | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLive, setIsLive] = useState(false);
  
  // Heartbeat ref to keep stream alive
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user's streams
  const fetchMyStreams = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("streams")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStreams((data || []) as Stream[]);
    } catch (error) {
      console.error("Error fetching streams:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Start heartbeat to keep stream marked as active
  const startHeartbeat = useCallback((streamId: string) => {
    // Clear any existing heartbeat
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Update stream updated_at every 30 seconds
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        const { error } = await supabase
          .from("streams")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", streamId)
          .eq("status", "live");

        if (error) {
          console.error("Heartbeat update failed:", error);
        }
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    }, HEARTBEAT_INTERVAL);
  }, []);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  // Create a new stream (direct DB insert, no edge function needed)
  const createStream = async (title: string, description?: string, scheduledAt?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Content moderation
      const modErr = validateStreamContent(title, description);
      if (modErr) throw new Error(modErr);

      const roomName = `stream-${user.id}-${Date.now()}`;
      const insertData: Record<string, unknown> = {
        user_id: user.id,
        title,
        description: description || null,
        room_name: roomName,
        status: "offline",
      };
      if (scheduledAt) {
        insertData.scheduled_at = scheduledAt;
      }

      const { data, error } = await supabase
        .from("streams")
        .insert([insertData as any])
        .select()
        .single();

      if (error) throw error;

      const stream = data as Stream;
      setCurrentStream(stream);
      
      toast({
        title: "Stream created!",
        description: "Your stream room is ready. Click Go Live to start.",
      });

      return { stream, roomUrl: "", ownerToken: "" };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create stream";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Go live (direct DB update)
  const goLive = async (streamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("streams")
        .update({ 
          status: "live", 
          started_at: now,
          updated_at: now,
        })
        .eq("id", streamId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentStream(data as Stream);
      setIsLive(true);
      
      // Start heartbeat to keep stream marked as active
      startHeartbeat(streamId);

      toast({
        title: "You're live!",
        description: "Share your profile link with viewers.",
      });

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to go live";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // End stream (direct DB update)
  // Note: Recording is now handled by useStreamRecording hook to avoid duplicates
  const endStream = async (streamId: string, skipRecording = false) => {
    try {
      // Stop heartbeat
      stopHeartbeat();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const endedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from("streams")
        .update({ status: "ended", ended_at: endedAt })
        .eq("id", streamId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentStream(null);
      setIsLive(false);

      toast({
        title: "Stream ended",
        description: skipRecording 
          ? "Your stream has ended."
          : "Your stream has been saved and recorded.",
      });

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to end stream";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Update viewer count
  const updateViewerCount = async (streamId: string, count: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current peak
      const { data: stream } = await supabase
        .from("streams")
        .select("peak_viewers")
        .eq("id", streamId)
        .single();

      const currentPeak = stream?.peak_viewers || 0;
      const newPeak = Math.max(currentPeak, count);

      await supabase
        .from("streams")
        .update({ 
          viewer_count: count,
          peak_viewers: newPeak,
        })
        .eq("id", streamId)
        .eq("user_id", user.id);
    } catch (error) {
      console.error("Error updating viewer count:", error);
    }
  };

  // Send chat message
  const sendChatMessage = async (streamId: string, message: string, username: string) => {
    try {
      const chatModErr = validateChatMessage(message);
      if (chatModErr) throw new Error(chatModErr);

      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("stream_chat").insert({
        stream_id: streamId,
        user_id: user?.id || null,
        username,
        message,
        message_type: "message",
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  };

  // Send tip (record directly in DB)
  const sendTip = async (streamId: string, amount: number, tipperName: string, tipMessage?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const creatorAmount = amount * 0.9;
      const platformFee = amount * 0.1;

      // Insert tip record
      const { error: tipError } = await supabase.from("stream_tips").insert({
        stream_id: streamId,
        tipper_id: user?.id || null,
        tipper_name: tipperName,
        amount,
        creator_amount: creatorAmount,
        platform_fee: platformFee,
        message: tipMessage || null,
      });

      if (tipError) throw tipError;

      // Update stream total tips
      await supabase
        .from("streams")
        .update({ total_tips: currentStream ? (currentStream.total_tips || 0) + amount : amount })
        .eq("id", streamId);

      // Also add a chat message about the tip
      await supabase.from("stream_chat").insert({
        stream_id: streamId,
        user_id: user?.id || null,
        username: tipperName,
        message: `Tipped $${amount}${tipMessage ? ` - "${tipMessage}"` : ""}`,
        message_type: "tip",
        is_highlighted: true,
      });

      toast({
        title: "Tip sent!",
        description: `You tipped $${amount}. Thank you for supporting the creator!`,
      });

      return { success: true };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Failed to process tip";
      toast({
        title: "Error",
        description: errMsg,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Subscribe to chat messages
  useEffect(() => {
    if (!currentStream?.id) return;

    const channel = supabase
      .channel(`chat-${currentStream.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stream_chat",
          filter: `stream_id=eq.${currentStream.id}`,
        },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentStream?.id]);

  // Fetch existing chat messages
  const fetchChatMessages = useCallback(async (streamId: string) => {
    const { data, error } = await supabase
      .from("stream_chat")
      .select("*")
      .eq("stream_id", streamId)
      .order("created_at", { ascending: true })
      .limit(100);

    if (!error && data) {
      setChatMessages(data as ChatMessage[]);
    }
  }, []);

  // Cleanup heartbeat on unmount
  useEffect(() => {
    return () => {
      stopHeartbeat();
    };
  }, [stopHeartbeat]);

  return {
    streams,
    currentStream,
    chatMessages,
    loading,
    isLive,
    fetchMyStreams,
    createStream,
    goLive,
    endStream,
    updateViewerCount,
    sendChatMessage,
    sendTip,
    fetchChatMessages,
    setCurrentStream,
  };
};
