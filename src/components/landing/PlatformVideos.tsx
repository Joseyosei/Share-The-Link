import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize2, Film } from "lucide-react";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll(".scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .scroll-reveal-scale, .scroll-reveal-blur").forEach((child) => {
              child.classList.add("revealed");
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

const VIDEOS = [
  {
    id: "overview",
    label: "Platform Overview",
    duration: "0:39",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SHARE%20THE%20LINK%20PLATFORM%20OVERVIEW-eD8liUWt4yGZk5HonUbf0Ah9xJEYBb.mp4",
    description: "A 39-second overview of everything Share The Link offers — from AI page building to live streaming.",
  },
  {
    id: "walkthrough",
    label: "Full Walkthrough",
    duration: "1:12",
    src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/SHARE%20THE%20LINK%20WALKTHROUGH-AZ7rLxaQ3kYfU7vdFuxNOMmYTUbBt0.mp4",
    description: "A full walkthrough: claim your name, build with AI, share to 7 platforms, go live, and track your growth.",
  },
] as const;

type VideoId = (typeof VIDEOS)[number]["id"];

export const PlatformVideos = () => {
  const sectionRef = useScrollReveal();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [activeTab, setActiveTab] = useState<VideoId>("overview");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [progress, setProgress] = useState(0);

  const activeVideo = VIDEOS.find((v) => v.id === activeTab)!;

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
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    videoRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * videoRef.current.duration;
  };

  const switchTab = (id: VideoId) => {
    setActiveTab(id);
    setIsPlaying(false);
    setShowOverlay(true);
    setProgress(0);
    setTimeout(() => videoRef.current?.load(), 50);
  };

  return (
    <section className="py-24 bg-background relative overflow-hidden" ref={sectionRef}>
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30 pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-12 scroll-reveal-blur">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <Film className="w-4 h-4" />
            Watch How It Works
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 text-balance">
            See Share The Link in action
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Watch the platform overview and step-by-step walkthrough. Go from idea to live campaign in 30 seconds.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 scroll-reveal scroll-delay-1">
          <div className="inline-flex gap-1.5 p-1.5 rounded-full bg-muted border border-border">
            {VIDEOS.map((video) => (
              <button
                key={video.id}
                onClick={() => switchTab(video.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeTab === video.id
                    ? "gradient-button text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                }`}
              >
                <Play className={`w-3.5 h-3.5 ${activeTab === video.id ? "text-white" : ""}`} />
                {video.label}
                <span className={`text-xs ${activeTab === video.id ? "text-white/70" : "text-muted-foreground/60"}`}>
                  {video.duration}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Video Player */}
        <div className="max-w-5xl mx-auto scroll-reveal-scale scroll-delay-2">
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
                  sharethelink.app
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
                <source src={activeVideo.src} type="video/mp4" />
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

              {/* Controls on hover */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>{activeVideo.description}</p>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Click play to start
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
