import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

  // Create a new stream
  const createStream = async (title: string, description?: string, scheduledAt?: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("create-stream", {
        body: { title, description, scheduledAt },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setCurrentStream(data.stream as Stream);
      
      toast({
        title: "Stream created!",
        description: "Your stream room is ready.",
      });

      return data;
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

  // Go live
  const goLive = async (streamId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("update-stream-status", {
        body: { streamId, status: "live" },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setCurrentStream(data.stream as Stream);
      setIsLive(true);

      toast({
        title: "You're live! 🔴",
        description: "Share your profile link with viewers.",
      });

      return data.stream;
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

  // End stream
  const endStream = async (streamId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("update-stream-status", {
        body: { streamId, status: "ended" },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setCurrentStream(null);
      setIsLive(false);

      toast({
        title: "Stream ended",
        description: "Your stream has been saved.",
      });

      return data.stream;
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

  // Send chat message
  const sendChatMessage = async (streamId: string, message: string, username: string) => {
    try {
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

  // Send tip
  const sendTip = async (streamId: string, amount: number, tipperName: string, message?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("stream-tip", {
        body: { streamId, amount, tipperName, message },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Redirect to Stripe checkout
      if (data.url) {
        window.open(data.url, "_blank");
      }

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process tip";
      toast({
        title: "Error",
        description: message,
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
    sendChatMessage,
    sendTip,
    fetchChatMessages,
    setCurrentStream,
  };
};
