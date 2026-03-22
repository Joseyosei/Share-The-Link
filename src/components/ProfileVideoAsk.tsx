import { useState, useRef, useEffect } from "react";
import { X, Volume2, VolumeX, Play, Pause } from "lucide-react";

interface ProfileVideoAskProps {
  videoUrl: string;
  avatarUrl?: string;
  name?: string;
}

export function ProfileVideoAsk({ videoUrl, avatarUrl, name }: ProfileVideoAskProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [bubbleReady, setBubbleReady] = useState(false);
  const bubbleVideoRef = useRef<HTMLVideoElement>(null);
  const expandedVideoRef = useRef<HTMLVideoElement>(null);

  // Auto-play the bubble video muted
  useEffect(() => {
    const video = bubbleVideoRef.current;
    if (video) {
      video.muted = true;
      video.play().then(() => {
        setBubbleReady(true);
      }).catch(() => {
        // Autoplay blocked — show poster/avatar fallback
        setBubbleReady(false);
      });
    }
  }, []);

  // When expanded, sync playback
  useEffect(() => {
    const video = expandedVideoRef.current;
    if (isExpanded && video) {
      video.muted = isMuted;
      video.play().catch(() => {});
    }
  }, [isExpanded, isMuted]);

  const handleBubbleClick = () => {
    setIsExpanded(true);
    setIsMuted(false);
    // Pause bubble video
    bubbleVideoRef.current?.pause();
  };

  const handleClose = () => {
    setIsExpanded(false);
    setIsMuted(true);
    setIsPlaying(true);
    // Resume bubble video
    const bv = bubbleVideoRef.current;
    if (bv) {
      bv.muted = true;
      bv.currentTime = 0;
      bv.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    const video = expandedVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = expandedVideoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  return (
    <>
      {/* Floating Video Bubble */}
      {!isExpanded && (
        <button
          onClick={handleBubbleClick}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Watch intro video"
        >
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-ping opacity-20" />
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-60 group-hover:opacity-80 transition-opacity" />

          {/* Video circle */}
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-[3px] border-white shadow-2xl">
            <video
              ref={bubbleVideoRef}
              src={videoUrl}
              muted
              playsInline
              loop
              preload="metadata"
              className={`w-full h-full object-cover ${bubbleReady ? "block" : "hidden"}`}
            />
            {/* Fallback avatar if video hasn't loaded */}
            {!bubbleReady && (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <Play className="w-8 h-8 text-white" />
                )}
              </div>
            )}

            {/* Play overlay on hover */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-8 h-8 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Label */}
          <div className="absolute -top-2 -left-2 bg-white text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg whitespace-nowrap">
            Watch intro
          </div>
        </button>
      )}

      {/* Expanded Video Overlay */}
      {isExpanded && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Video Container */}
          <div className="relative w-full max-w-sm animate-in zoom-in-95 fade-in duration-300">
            {/* Rounded video card */}
            <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
                <div className="flex items-center gap-2">
                  {avatarUrl && (
                    <img src={avatarUrl} alt={name} className="w-8 h-8 rounded-full object-cover border border-white/30" />
                  )}
                  <span className="text-white text-sm font-semibold drop-shadow-lg">
                    {name || "Intro"}
                  </span>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label="Close video"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Video */}
              <video
                ref={expandedVideoRef}
                src={videoUrl}
                playsInline
                loop
                className="w-full aspect-[9/16] max-h-[70vh] object-cover"
                onClick={togglePlay}
              />

              {/* Play/Pause overlay (shown briefly) */}
              {!isPlaying && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                  onClick={togglePlay}
                >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              )}

              {/* Bottom controls */}
              <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-t from-black/60 to-transparent">
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-white" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
