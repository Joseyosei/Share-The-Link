import { useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, ChevronRight } from "lucide-react";

const DEMO_VIDEOS = [
  {
    id: "overview",
    label: "Platform Overview",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Share%20The%20Link%20Demo%201%20%281%29%20%281%29-lA9NJxEbzNvQIwIn7l3GmmiB6J6gkm.mp4",
  },
  {
    id: "walkthrough",
    label: "Full Walkthrough",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Share%20The%20Link%20Demo%202-QJoUjGksb8dLFsTJMCp4tsLhHeZeCs.mp4",
  },
];

export function ProductDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeVideo, setActiveVideo] = useState(0);
  const [showOverlay, setShowOverlay] = useState(true);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setShowOverlay(false);
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(pct);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const switchVideo = (index: number) => {
    setActiveVideo(index);
    setIsPlaying(false);
    setShowOverlay(true);
    setProgress(0);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.load();
      }
    }, 50);
  };

  return (
    <section className="py-20 bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            See It In Action
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            Watch how it works
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            See how Share The Link helps creators and entrepreneurs build, share, and grow their audience.
          </p>
        </div>

        {/* Video Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {DEMO_VIDEOS.map((video, i) => (
            <button
              key={video.id}
              onClick={() => switchVideo(i)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                activeVideo === i
                  ? "bg-foreground text-background shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {video.label}
              {activeVideo === i && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>

        {/* Video Player */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl overflow-hidden border border-border/60 shadow-2xl shadow-black/20 bg-black relative group">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 mx-4">
                <div className="bg-gray-800 rounded-md px-3 py-1 text-xs text-gray-400 text-center max-w-xs mx-auto">
                  sharethelink.com
                </div>
              </div>
            </div>

            {/* Video */}
            <div className="relative aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => { setIsPlaying(false); setShowOverlay(true); }}
                playsInline
                preload="metadata"
              >
                <source src={DEMO_VIDEOS[activeVideo].src} type="video/mp4" />
              </video>

              {/* Play overlay */}
              {showOverlay && (
                <div
                  className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer transition-opacity"
                  onClick={togglePlay}
                >
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center hover:bg-white/30 transition-all hover:scale-110">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              )}

              {/* Controls - show on hover */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {/* Progress bar */}
                <div
                  className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer"
                  onClick={handleProgressClick}
                >
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="text-white hover:text-white/80 transition-colors" aria-label={isPlaying ? "Pause" : "Play"}>
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button onClick={toggleMute} className="text-white hover:text-white/80 transition-colors" aria-label={isMuted ? "Unmute" : "Mute"}>
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>
                  <button onClick={handleFullscreen} className="text-white hover:text-white/80 transition-colors" aria-label="Fullscreen">
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
