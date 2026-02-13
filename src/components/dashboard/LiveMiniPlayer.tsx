import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Maximize2, Minimize2, Radio, Volume2, VolumeX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LiveStream {
  id: string;
  title: string;
  username: string;
  viewerCount?: number;
}

// Global state to persist across navigation
let globalActiveStream: LiveStream | null = null;
let globalListeners: Array<(stream: LiveStream | null) => void> = [];

export const setActiveStream = (stream: LiveStream | null) => {
  globalActiveStream = stream;
  globalListeners.forEach((fn) => fn(stream));
};

export const getActiveStream = () => globalActiveStream;

const useActiveStream = () => {
  const [stream, setStream] = useState<LiveStream | null>(globalActiveStream);
  useEffect(() => {
    const listener = (s: LiveStream | null) => setStream(s);
    globalListeners.push(listener);
    return () => {
      globalListeners = globalListeners.filter((l) => l !== listener);
    };
  }, []);
  return stream;
};

export const LiveMiniPlayer = () => {
  const navigate = useNavigate();
  const activeStream = useActiveStream();
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (!activeStream) return null;

  const handleClose = () => {
    setActiveStream(null);
  };

  const handleExpand = () => {
    navigate(`/live/${activeStream.username}`);
    setActiveStream(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const style = position.x || position.y
    ? { left: position.x, top: position.y, right: "auto", bottom: "auto" }
    : {};

  return (
    <div
      className={`fixed z-50 transition-all duration-300 shadow-2xl rounded-xl overflow-hidden border border-border/50 ${
        isMinimized ? "w-72" : "w-80"
      }`}
      style={{
        right: position.x || position.y ? "auto" : "1.5rem",
        bottom: position.x || position.y ? "auto" : "1.5rem",
        ...style,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Video area */}
      {!isMinimized && (
        <div className="relative bg-black aspect-video cursor-move">
          {/* Placeholder for live stream video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Radio className="w-8 h-8 text-red-500 animate-pulse mx-auto mb-1" />
              <p className="text-white/60 text-xs">Live Stream</p>
            </div>
          </div>

          {/* LIVE badge */}
          <div className="absolute top-2 left-2">
            <Badge className="bg-red-600 text-white border-0 text-[10px] px-1.5 py-0.5 gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </Badge>
          </div>

          {/* Controls overlay */}
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-1 rounded-md bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleExpand}
              className="p-1 rounded-md bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Expand"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 rounded-md bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Info bar */}
      <div className="bg-card px-3 py-2 flex items-center gap-2">
        <Radio className="w-4 h-4 text-red-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate">
            {activeStream.title}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">
            {activeStream.username}
            {activeStream.viewerCount !== undefined && ` - ${activeStream.viewerCount} watching`}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge className="bg-red-600 text-white border-0 text-[9px] px-1.5 py-0">
            LIVE
          </Badge>
          {isMinimized ? (
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              aria-label="Show video"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
              aria-label="Minimize"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
