import { useState, useEffect, useRef, useCallback } from "react";

interface ProfileMusicPlayerProps {
  spotifyUrl: string;
}

function parseSpotifyUrl(url: string) {
  const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (match) return { type: match[1], id: match[2] };
  return null;
}

function parseYouTubeUrl(url: string) {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) return { id: match[1] };
  const playlistMatch = url.match(/youtube\.com\/playlist\?list=([a-zA-Z0-9_-]+)/);
  if (playlistMatch) return { playlistId: playlistMatch[1] };
  return null;
}

/* ── YouTube IFrame API types ── */
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  destroy(): void;
  getPlayerState(): number;
}

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, cfg: Record<string, unknown>) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYTApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

interface VideoMeta {
  title: string;
  author: string;
  thumbnail: string;
}

/* ── YouTube compact music bar ── */
function YouTubeMusicBar({ videoId }: { videoId: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [meta, setMeta] = useState<VideoMeta | null>(null);

  // Fetch video metadata via oEmbed
  useEffect(() => {
    const thumb = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
    fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    )
      .then((r) => r.json())
      .then((d) =>
        setMeta({ title: d.title ?? "Unknown", author: d.author_name ?? "", thumbnail: thumb })
      )
      .catch(() => setMeta({ title: "Music", author: "YouTube", thumbnail: thumb }));
  }, [videoId]);

  // Create hidden YT player
  useEffect(() => {
    let destroyed = false;

    loadYTApi().then(() => {
      if (destroyed || !containerRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        height: "1",
        width: "1",
        playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, playsinline: 1, loop: 1 },
        events: {
          onReady: () => {
            if (!destroyed) setReady(true);
          },
          onStateChange: (e: { data: number }) => {
            if (destroyed) return;
            setPlaying(e.data === window.YT!.PlayerState.PLAYING);
            // Loop single video
            if (e.data === window.YT!.PlayerState.ENDED) {
              playerRef.current?.playVideo();
            }
          },
        },
      } as unknown as Record<string, unknown>);
    });

    return () => {
      destroyed = true;
      playerRef.current?.destroy();
    };
  }, [videoId]);

  const togglePlay = useCallback(() => {
    if (!playerRef.current || !ready) return;
    if (playing) playerRef.current.pauseVideo();
    else playerRef.current.playVideo();
  }, [ready, playing]);

  const toggleMute = useCallback(() => {
    if (!playerRef.current || !ready) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  }, [ready, muted]);

  return (
    <>
      {/* Hidden YT player */}
      <div
        style={{
          position: "fixed",
          width: 1,
          height: 1,
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none",
          bottom: 0,
          left: 0,
        }}
      >
        <div ref={containerRef} />
      </div>

      {/* Compact floating bar */}
      <div
        className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50"
        style={{ animation: "ytSlideUp 0.4s ease-out" }}
      >
        <div
          className="flex items-center gap-3 pl-2.5 pr-3.5 py-2 rounded-full"
          style={{
            background: "rgba(10, 10, 14, 0.92)",
            backdropFilter: "blur(28px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.55)",
          }}
        >
          {/* Thumbnail */}
          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white/5">
            {meta?.thumbnail ? (
              <img
                src={meta.thumbnail}
                alt=""
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white/30">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>

          {/* Title & channel */}
          <div className="min-w-0 max-w-[120px] sm:max-w-[180px]">
            <p className="text-white text-[13px] font-semibold truncate leading-tight">
              {meta?.title ?? "Loading…"}
            </p>
            <p className="text-white/45 text-[11px] truncate leading-tight">
              {meta?.author ?? ""}
            </p>
          </div>

          {/* Audio bars */}
          <div className="flex items-end gap-[2px] h-4 mx-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-[2.5px] rounded-full"
                style={{
                  height: playing ? undefined : [3, 5, 2, 4, 3][i],
                  backgroundColor: "#FF0000",
                  animation: playing
                    ? `ytBar${i} ${0.4 + i * 0.08}s ease-in-out infinite alternate`
                    : "none",
                }}
              />
            ))}
          </div>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            disabled={!ready}
            className="text-white/80 hover:text-white transition-colors disabled:opacity-40"
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Volume */}
          <button
            onClick={toggleMute}
            disabled={!ready}
            className="text-white/50 hover:text-white/90 transition-colors disabled:opacity-40"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ytSlideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes ytBar0 { 0% { height: 3px; } 100% { height: 14px; } }
        @keyframes ytBar1 { 0% { height: 5px; } 100% { height: 18px; } }
        @keyframes ytBar2 { 0% { height: 2px; } 100% { height: 10px; } }
        @keyframes ytBar3 { 0% { height: 4px; } 100% { height: 16px; } }
        @keyframes ytBar4 { 0% { height: 3px; } 100% { height: 12px; } }
      `}</style>
    </>
  );
}

/* ── Spotify embed (unchanged) ── */
function SpotifyEmbedPlayer({ url }: { url: string }) {
  const parsed = parseSpotifyUrl(url);
  if (!parsed) return null;

  const embedUrl = `https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0`;
  const height = parsed.type === "track" ? 80 : 152;
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      {!expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-110 active:scale-95"
          style={{
            background: "rgba(10, 10, 14, 0.88)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.09)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
          }}
          aria-label="Open music player"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#1DB954]">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          <div className="absolute -top-1 -right-1 flex items-end gap-[1.5px] h-3">
            {[4, 7, 3, 6].map((h, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full animate-pulse"
                style={{
                  height: h,
                  backgroundColor: "#1DB954",
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
          </div>
        </button>
      )}

      {expanded && (
        <div
          className="fixed bottom-6 left-6 right-6 sm:left-auto sm:right-auto sm:bottom-6 sm:left-1/2 sm:-translate-x-1/2 z-50 max-w-md w-full"
          style={{ animation: "ytSlideUp 0.3s ease-out" }}
        >
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: "rgba(10, 10, 14, 0.92)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255,255,255,0.09)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex justify-end p-2">
              <button
                onClick={() => setExpanded(false)}
                className="text-white/40 hover:text-white/80 transition-colors text-xs px-2 py-1"
              >
                Minimize
              </button>
            </div>
            <div className="px-2 pb-2">
              <iframe
                src={embedUrl}
                width="100%"
                height={height}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ border: 0, borderRadius: "12px" }}
                title="Spotify player"
              />
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ytSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

/* ── Main export ── */
export function ProfileMusicPlayer({ spotifyUrl }: ProfileMusicPlayerProps) {
  const yt = parseYouTubeUrl(spotifyUrl);
  if (yt && "id" in yt && yt.id) {
    return <YouTubeMusicBar videoId={yt.id} />;
  }

  const spotify = parseSpotifyUrl(spotifyUrl);
  if (spotify) {
    return <SpotifyEmbedPlayer url={spotifyUrl} />;
  }

  return null;
}
