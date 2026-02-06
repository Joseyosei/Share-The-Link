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

  // Create a new stream (direct DB insert, no edge function needed)
  const createStream = async (title: string, description?: string, scheduledAt?: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

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

      console.log("[v0] Creating stream with data:", insertData);

      const { data, error } = await supabase
        .from("streams")
        .insert(insertData)
        .select()
        .single();

      console.log("[v0] Stream insert result:", { data, error });
      if (error) throw error;

      const stream = data as Stream;
      setCurrentStream(stream);
      console.log("[v0] Stream created successfully:", stream.id);
      
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

      const { data, error } = await supabase
        .from("streams")
        .update({ status: "live", started_at: new Date().toISOString() })
        .eq("id", streamId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentStream(data as Stream);
      setIsLive(true);

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
  const endStream = async (streamId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("streams")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", streamId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setCurrentStream(null);
      setIsLive(false);

      toast({
        title: "Stream ended",
        description: "Your stream has been saved.",
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
      const { error: updateError } = await supabase.rpc("increment_stream_tips", {
        p_stream_id: streamId,
        p_amount: amount,
      });

      // If the RPC doesn't exist yet, just update directly
      if (updateError) {
        await supabase
          .from("streams")
          .update({ total_tips: currentStream ? (currentStream.total_tips || 0) + amount : amount })
          .eq("id", streamId);
      }

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
