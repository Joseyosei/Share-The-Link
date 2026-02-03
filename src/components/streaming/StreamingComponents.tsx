import { useState, useEffect } from "react";
import { Video, Loader2, X, Radio, Users, DollarSign, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useStreaming } from "@/hooks/useStreaming";

interface GoLiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStreamCreated: (streamData: { roomUrl: string; ownerToken: string; stream: { id: string } }) => void;
}

export const GoLiveModal = ({ isOpen, onClose, onStreamCreated }: GoLiveModalProps) => {
  const { createStream, loading } = useStreaming();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const data = await createStream(title, description);
      onStreamCreated(data);
      onClose();
      setTitle("");
      setDescription("");
    } catch (error) {
      // Error handled in hook
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
  roomUrl: string;
  ownerToken?: string;
  isOwner: boolean;
  streamId: string;
  onEnd?: () => void;
}

export const StreamPlayer = ({ roomUrl, ownerToken, isOwner, streamId, onEnd }: StreamPlayerProps) => {
  const { goLive, endStream, isLive } = useStreaming();
  const [loading, setLoading] = useState(false);

  const handleGoLive = async () => {
    setLoading(true);
    try {
      await goLive(streamId);
    } finally {
      setLoading(false);
    }
  };

  const handleEndStream = async () => {
    setLoading(true);
    try {
      await endStream(streamId);
      onEnd?.();
    } finally {
      setLoading(false);
    }
  };

  const iframeUrl = ownerToken ? `${roomUrl}?t=${ownerToken}` : roomUrl;

  return (
    <div className="relative bg-black rounded-2xl overflow-hidden">
      {isLive && (
        <Badge className="absolute top-4 left-4 z-10 bg-destructive text-destructive-foreground animate-pulse">
          🔴 LIVE
        </Badge>
      )}
      
      <iframe
        src={iframeUrl}
        allow="camera; microphone; fullscreen; speaker; display-capture"
        className="w-full aspect-video"
        title="Live Stream"
      />

      {isOwner && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {!isLive ? (
            <Button
              onClick={handleGoLive}
              disabled={loading}
              className="bg-destructive hover:bg-destructive/90"
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

interface StreamChatProps {
  streamId: string;
  username: string;
}

export const StreamChat = ({ streamId, username }: StreamChatProps) => {
  const { chatMessages, sendChatMessage, fetchChatMessages } = useStreaming();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch messages on mount
  useEffect(() => {
    fetchChatMessages(streamId);
  }, [streamId, fetchChatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await sendChatMessage(streamId, message, username);
      setMessage("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border h-96 flex flex-col">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-primary" />
        <span className="font-semibold text-sm">Live Chat</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${msg.message_type === "tip" ? "bg-accent/20 p-2 rounded-lg" : ""}`}
          >
            <span className="font-semibold text-primary">{msg.username}: </span>
            <span className="text-foreground">{msg.message}</span>
          </div>
        ))}
        {chatMessages.length === 0 && (
          <p className="text-muted-foreground text-center text-sm py-8">
            No messages yet. Start the conversation!
          </p>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
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

export const TipJar = ({ streamId, tipperName }: TipJarProps) => {
  const { sendTip } = useStreaming();
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const tipAmounts = [5, 10, 25, 50, 100];

  const handleTip = async (tipAmount: number) => {
    setLoading(true);
    try {
      await sendTip(streamId, tipAmount, tipperName, message);
      setMessage("");
      setAmount("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-accent" />
        <h3 className="font-semibold">Support the Creator</h3>
        <Badge variant="secondary" className="text-xs">90% goes to creator</Badge>
      </div>

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
