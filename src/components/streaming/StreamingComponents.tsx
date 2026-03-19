import { useState, useEffect, useRef, useCallback } from "react";
import { Video, Loader2, X, Radio, Users, DollarSign, MessageCircle, Camera, Monitor, Save, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useStreaming } from "@/hooks/useStreaming";
import { useBroadcaster, useViewer } from "@/hooks/useWebRTC";
import { useStreamRecording } from "@/hooks/useStreamRecording";
import { supabase } from "@/integrations/supabase/client";

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStreamCreated: (streamData: { roomUrl: string; ownerToken: string; stream: { id: string } }) => void;
  createStreamFn?: (title: string, description?: string) => Promise<{ stream: { id: string }; roomUrl: string; ownerToken: string }>;
  isLoading?: boolean;
}

export const GoLiveModal = ({ isOpen, onClose, onStreamCreated, createStreamFn, isLoading }: GoLiveModalProps) => {
  const fallback = useStreaming();
  const createStream = createStreamFn || fallback.createStream;
  const loading = isLoading ?? fallback.loading;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setError("");

    try {
      const data = await createStream(title, description);
      onStreamCreated(data);
      onClose();
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setError(err?.message || "Failed to create stream. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-destructive" />
            Go Live
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">Stream Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's your stream about?"
              className="mt-1"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers what to expect..."
              className="mt-1"
              rows={3}
            />
          </div>
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">{error}</div>
          )}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="flex-1 bg-destructive hover:bg-destructive/90"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Radio className="w-4 h-4 mr-2" />
              )}
              Start Stream
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface StreamPlayerProps {
  roomUrl?: string;
  ownerToken?: string;
  isOwner: boolean;
  streamId: string;
  roomName?: string;
  onEnd?: () => void;
  onViewerCountChange?: (count: number) => void;
}

export const StreamPlayer = ({ isOwner, streamId, roomName, onEnd, onViewerCountChange }: StreamPlayerProps) => {
  const { goLive, endStream, isLive } = useStreaming();
  const broadcaster = useBroadcaster(roomName || `stream-${streamId}`);
  const recorder = useStreamRecording();
  const [loading, setLoading] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamTitleRef = useRef("");

  // Fetch stream title for recording label
  useEffect(() => {
    if (!streamId) return;
    supabase
      .from("streams" as any)
      .select("title")
      .eq("id", streamId)
      .single()
      .then(({ data }) => {
        if (data?.title) streamTitleRef.current = data.title;
      });
  }, [streamId]);

  const toggleMic = useCallback(() => {
    if (broadcaster.localStream) {
      const audioTracks = broadcaster.localStream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
      setMicEnabled(audioTracks[0]?.enabled ?? false);
    }
  }, [broadcaster.localStream]);

  // Attach local stream to video element
  useEffect(() => {
    if (videoRef.current && broadcaster.localStream) {
      videoRef.current.srcObject = broadcaster.localStream;
    }
  }, [broadcaster.localStream]);

  // Notify parent of viewer count changes
  useEffect(() => {
    onViewerCountChange?.(broadcaster.viewerCount);
  }, [broadcaster.viewerCount, onViewerCountChange]);

  const handleGoLive = async () => {
    setLoading(true);
    try {
      let stream = broadcaster.localStream;
      if (!stream) {
        stream = await broadcaster.startCamera();
      }
      broadcaster.startBroadcasting();
      await goLive(streamId);
      // Start recording the stream
      if (stream) {
        recorder.startRecording(stream);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEndStream = async () => {
    setLoading(true);
    try {
      // Stop recording and upload
      const blob = await recorder.stopRecording();
      const { data: { user } } = await supabase.auth.getUser();

      broadcaster.stopBroadcasting();
      await endStream(streamId);

      // Upload the recording in the background
      if (blob && user) {
        recorder.uploadRecording(blob, user.id, streamId, streamTitleRef.current || "Stream Recording");
      }

      onEnd?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden">
      {isLive && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
          <Badge className="bg-destructive text-destructive-foreground animate-pulse">
            LIVE
          </Badge>
          <Badge variant="secondary" className="bg-black/50 text-white border-0">
            <Users className="w-3 h-3 mr-1" />
            {broadcaster.viewerCount}
          </Badge>
          {recorder.isRecording && (
            <Badge variant="secondary" className="bg-red-600/80 text-white border-0">
              <Save className="w-3 h-3 mr-1" />
              REC
            </Badge>
          )}
        </div>
      )}
      {recorder.isUploading && (
        <div className="absolute top-4 right-4 z-10">
          <Badge variant="secondary" className="bg-blue-600/80 text-white border-0">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Saving...
          </Badge>
        </div>
      )}

      {/* Video preview */}
      <div className="w-full aspect-video bg-black flex items-center justify-center">
        {broadcaster.localStream ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center text-white/60 space-y-4">
            <Video className="w-16 h-16 mx-auto opacity-40" />
            <p className="text-sm">Choose a source to preview your stream</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => broadcaster.startCamera()}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
              <Button
                onClick={() => broadcaster.startScreenShare()}
                variant="outline"
                size="sm"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
              >
                <Monitor className="w-4 h-4 mr-2" />
                Screen
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls overlay */}
      {isOwner && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {broadcaster.localStream && !isLive && (
            <>
              <Button
                onClick={() => broadcaster.startCamera()}
                variant="secondary"
                size="sm"
                className={broadcaster.mediaSource === "camera" ? "ring-2 ring-white" : ""}
              >
                <Camera className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => broadcaster.startScreenShare()}
                variant="secondary"
                size="sm"
                className={broadcaster.mediaSource === "screen" ? "ring-2 ring-white" : ""}
              >
                <Monitor className="w-4 h-4" />
              </Button>
            </>
          )}
          {/* Mic toggle */}
          {broadcaster.localStream && (
            <Button
              onClick={toggleMic}
              variant="secondary"
              size="sm"
              className={!micEnabled ? "bg-red-600/80 text-white hover:bg-red-600" : ""}
              title={micEnabled ? "Mute microphone" : "Unmute microphone"}
            >
              {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </Button>
          )}
          {!isLive ? (
            <Button
              onClick={handleGoLive}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4 mr-2" />}
              Go Live
            </Button>
          ) : (
            <Button
              onClick={handleEndStream}
              disabled={loading}
              variant="destructive"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4 mr-2" />}
              End Stream
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Viewer Player - Receives and displays a WebRTC stream
 */
interface ViewerPlayerProps {
  roomName: string;
  streamTitle?: string;
}

export const ViewerPlayer = ({ roomName, streamTitle }: ViewerPlayerProps) => {
  const viewer = useViewer(roomName);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasConnected, setHasConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Auto-connect on mount
  useEffect(() => {
    if (!hasConnected && roomName) {
      viewer.connect();
      setHasConnected(true);
    }
    return () => {
      viewer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomName]);

  // Attach remote stream to video
  useEffect(() => {
    if (videoRef.current && viewer.remoteStream) {
      videoRef.current.srcObject = viewer.remoteStream;
    }
  }, [viewer.remoteStream]);

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <Badge className="bg-destructive text-destructive-foreground animate-pulse">
          LIVE
        </Badge>
        {streamTitle && (
          <span className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
            {streamTitle}
          </span>
        )}
      </div>

      <div className="w-full aspect-video bg-black flex items-center justify-center relative group">
        {viewer.remoteStream ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted={isMuted}
              className="w-full h-full object-cover"
            />
            {/* Volume controls - visible on hover */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-full px-3 py-2">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (videoRef.current) videoRef.current.muted = !isMuted;
                }}
                className="text-white hover:text-primary transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  setIsMuted(v === 0);
                  if (videoRef.current) {
                    videoRef.current.volume = v;
                    videoRef.current.muted = v === 0;
                  }
                }}
                className="w-20 h-1 accent-primary cursor-pointer"
              />
            </div>
          </>
        
        ) : (
          <div className="text-center text-white/60 space-y-3">
            {viewer.isConnecting ? (
              <>
                <Loader2 className="w-10 h-10 mx-auto animate-spin" />
                <p className="text-sm">Connecting to stream...</p>
              </>
            ) : viewer.connectionState === "failed" ? (
              <>
                <Video className="w-12 h-12 mx-auto opacity-40" />
                <p className="text-sm">Connection failed. The stream may have ended.</p>
                <Button
                  onClick={() => {
                    viewer.disconnect();
                    setTimeout(() => viewer.connect(), 500);
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                >
                  Retry
                </Button>
              </>
            ) : (
              <>
                <Loader2 className="w-10 h-10 mx-auto animate-spin" />
                <p className="text-sm">Waiting for broadcaster...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface StreamChatProps {
  streamId: string;
  username: string;
}

interface ChatMsg {
  id: string;
  stream_id: string;
  user_id: string | null;
  username: string;
  message: string;
  message_type: "message" | "tip" | "system" | "sticker";
  is_highlighted: boolean;
  created_at: string;
}

const EMOJI_OPTIONS = ["👍", "❤️", "🔥", "😂", "🎉", "👏", "💯", "🙌", "😍", "🚀", "💪", "✨"];

const STICKER_OPTIONS = [
  { emoji: "🔥", label: "Fire", animation: "animate-bounce" },
  { emoji: "❤️", label: "Love", animation: "animate-pulse" },
  { emoji: "👏", label: "Clap", animation: "animate-bounce" },
  { emoji: "😂", label: "LOL", animation: "animate-bounce" },
  { emoji: "🎉", label: "Party", animation: "animate-spin" },
  { emoji: "🚀", label: "Rocket", animation: "animate-bounce" },
];

export const StreamChat = ({ streamId, username }: StreamChatProps) => {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch initial messages AND subscribe to realtime
  useEffect(() => {
    if (!streamId) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("stream_chat")
        .select("*")
        .eq("stream_id", streamId)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data) setMessages(data as ChatMsg[]);
    };
    fetchMessages();

    // Subscribe to new messages in realtime
    const channel = supabase
      .channel(`chat-realtime-${streamId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "stream_chat",
          filter: `stream_id=eq.${streamId}`,
        },
        (payload) => {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === (payload.new as ChatMsg).id)) return prev;
            return [...prev, payload.new as ChatMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [streamId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("stream_chat").insert({
        stream_id: streamId,
        user_id: user?.id || null,
        username,
        message: message.trim(),
        message_type: "message",
      });
      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage((prev) => prev + emoji);
    setShowEmojis(false);
  };

  const handleStickerSend = async (sticker: string) => {
    setSending(true);
    setShowStickers(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("stream_chat").insert({
        stream_id: streamId,
        user_id: user?.id || null,
        username,
        message: sticker,
        message_type: "sticker",
      });
    } catch (err) {
      console.error("Failed to send sticker:", err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = (msg: ChatMsg) => {
    if (msg.message_type === "sticker") {
      return (
        <div key={msg.id} className="flex items-center gap-2 py-1">
          <span className="font-semibold text-primary text-sm">{msg.username}</span>
          <span className="text-3xl animate-bounce">{msg.message}</span>
        </div>
      );
    }
    if (msg.message_type === "tip") {
      return (
        <div key={msg.id} className="bg-amber-500/15 border border-amber-500/30 p-2 rounded-lg text-sm">
          <span className="font-bold text-amber-600">{msg.username} : </span>
          <span className="text-foreground">{msg.message}</span>
        </div>
      );
    }
    return (
      <div key={msg.id} className="text-sm">
        <span className="font-semibold text-primary">{msg.username} : </span>
        <span className="text-foreground">{msg.message}</span>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border h-96 flex flex-col">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Live Chat</span>
        <span className="ml-auto text-xs text-muted-foreground">{messages.length} messages</span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map(renderMessage)}
        {messages.length === 0 && (
          <p className="text-muted-foreground text-center text-sm py-8">
            No messages yet. Start the conversation!
          </p>
        )}
      </div>

      {/* Sticker panel */}
      {showStickers && (
        <div className="px-3 py-2 border-t border-border bg-muted/50">
          <div className="flex gap-2 flex-wrap">
            {STICKER_OPTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleStickerSend(s.emoji)}
                className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-accent/20 transition-colors"
                title={s.label}
              >
                <span className={`text-2xl ${s.animation}`}>{s.emoji}</span>
                <span className="text-[10px] text-muted-foreground">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Emoji picker */}
      {showEmojis && (
        <div className="px-3 py-2 border-t border-border bg-muted/50">
          <div className="flex gap-1 flex-wrap">
            {EMOJI_OPTIONS.map((e) => (
              <button
                key={e}
                onClick={() => handleEmojiClick(e)}
                className="text-xl p-1.5 rounded hover:bg-accent/20 transition-colors"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2 items-center">
        <button
          type="button"
          onClick={() => { setShowStickers(!showStickers); setShowEmojis(false); }}
          className="text-lg p-1 rounded hover:bg-accent/20 transition-colors shrink-0"
          title="Stickers"
        >
          {'🎭'}
        </button>
        <button
          type="button"
          onClick={() => { setShowEmojis(!showEmojis); setShowStickers(false); }}
          className="text-lg p-1 rounded hover:bg-accent/20 transition-colors shrink-0"
          title="Emoji"
        >
          {'😊'}
        </button>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Send a message..."
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={sending || !message.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
};

interface TipJarProps {
  streamId: string;
  tipperName: string;
}

import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { authFetch } from "@/lib/auth-fetch";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ""
);

// Inner form that uses Stripe hooks (must be inside <Elements>)
const TipPaymentForm = ({
  amount,
  streamId,
  tipperName,
  tipMessage,
  onSuccess,
  onCancel,
}: {
  amount: number;
  streamId: string;
  tipperName: string;
  tipMessage: string;
  onSuccess: () => void;
  onCancel: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError("");

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment failed");
      setPaying(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Payment failed");
      setPaying(false);
    } else if (result.paymentIntent?.status === "succeeded") {
      // Record tip in Supabase
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("stream_tips").insert({
        stream_id: streamId,
        tipper_id: user?.id || null,
        tipper_name: tipperName,
        amount,
        message: tipMessage || null,
        stripe_payment_id: result.paymentIntent.id,
      });
      // Also post a tip message to chat
      await supabase.from("stream_chat").insert({
        stream_id: streamId,
        user_id: user?.id || null,
        username: tipperName,
        message: `Tipped $${amount}${tipMessage ? ` - ${tipMessage}` : ""}`,
        message_type: "tip",
        is_highlighted: true,
      });
      // Update stream total tips
      await supabase.rpc("increment_stream_tips", {
        p_stream_id: streamId,
        p_amount: amount,
      });
      onSuccess();
    }
    setPaying(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="text-center py-2 bg-muted rounded-lg">
        <span className="text-lg font-bold">${amount.toFixed(2)}</span>
        <span className="text-sm text-muted-foreground ml-1">tip</span>
      </div>
      <PaymentElement options={{ layout: "tabs" }} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={paying || !stripe} className="flex-1 gradient-button">
          {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : `Pay $${amount.toFixed(2)}`}
        </Button>
      </div>
    </form>
  );
};

export const TipJar = ({ streamId, tipperName }: TipJarProps) => {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [tipSuccess, setTipSuccess] = useState(false);

  const tipAmounts = [5, 10, 25, 50, 100];

  const handleTip = async (tipAmount: number) => {
    if (tipAmount < 1) return;
    setLoading(true);
    setTipSuccess(false);
    try {
      const resp = await authFetch("/api/check-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-tip",
          amount: tipAmount,
          streamId,
          tipperName,
          tipMessage: message,
        }),
      });
      const data = await resp.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setSelectedAmount(tipAmount);
      } else {
        console.error("Failed to create tip:", data.error);
      }
    } catch (err) {
      console.error("Tip error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Show payment form if we have a clientSecret
  if (clientSecret) {
    return (
      <div className="bg-card rounded-2xl border border-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="w-5 h-5 text-accent" />
          <h3 className="font-semibold">Complete Payment</h3>
        </div>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                borderRadius: "8px",
              },
            },
          }}
        >
          <TipPaymentForm
            amount={selectedAmount}
            streamId={streamId}
            tipperName={tipperName}
            tipMessage={message}
            onSuccess={() => {
              setClientSecret(null);
              setTipSuccess(true);
              setMessage("");
              setAmount("");
              setTimeout(() => setTipSuccess(false), 5000);
            }}
            onCancel={() => setClientSecret(null)}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-accent" />
        <h3 className="font-semibold">Support the Creator</h3>
        <Badge variant="secondary" className="text-xs">90% goes to creator</Badge>
      </div>

      {tipSuccess && (
        <div className="bg-green-500/15 border border-green-500/30 text-green-700 text-sm p-3 rounded-lg mb-4 text-center">
          Tip sent successfully! Thank you for your support.
        </div>
      )}

      <div className="grid grid-cols-5 gap-2 mb-4">
        {tipAmounts.map((tip) => (
          <Button
            key={tip}
            variant="outline"
            size="sm"
            onClick={() => handleTip(tip)}
            disabled={loading}
            className="hover:bg-accent hover:text-accent-foreground"
          >
            ${tip}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Custom amount"
          min="1"
          className="flex-1"
        />
        <Button
          onClick={() => amount && handleTip(parseFloat(amount))}
          disabled={loading || !amount}
          className="gradient-button"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tip"}
        </Button>
      </div>

      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Add a message (optional)"
        className="mt-3"
        rows={2}
      />
    </div>
  );
};

interface StreamStatsProps {
  viewerCount: number;
  totalTips: number;
}

export const StreamStats = ({ viewerCount, totalTips }: StreamStatsProps) => {
  return (
    <div className="flex gap-4">
      <div className="flex items-center gap-2 text-sm">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{viewerCount}</span>
        <span className="text-muted-foreground">watching</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <DollarSign className="w-4 h-4 text-accent" />
        <span className="font-medium">${totalTips.toFixed(2)}</span>
        <span className="text-muted-foreground">tips</span>
      </div>
    </div>
  );
};
