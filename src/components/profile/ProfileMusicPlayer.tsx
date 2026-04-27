import { useState } from "react";

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

type MusicSource =
  | { platform: "spotify"; embedUrl: string; height: number }
  | { platform: "youtube"; embedUrl: string }
  | null;

function resolveMusicSource(url: string): MusicSource {
  const spotify = parseSpotifyUrl(url);
  if (spotify) {
    return {
      platform: "spotify",
      embedUrl: `https://open.spotify.com/embed/${spotify.type}/${spotify.id}?utm_source=generator&theme=0`,
      height: spotify.type === "track" ? 80 : 152,
    };
  }

  const yt = parseYouTubeUrl(url);
  if (yt) {
    if ("playlistId" in yt && yt.playlistId) {
      return {
        platform: "youtube",
        embedUrl: `https://www.youtube.com/embed/videoseries?list=${yt.playlistId}&autoplay=0`,
      };
    }
    if ("id" in yt && yt.id) {
      return {
        platform: "youtube",
        embedUrl: `https://www.youtube.com/embed/${yt.id}?autoplay=0`,
      };
    }
  }

  return null;
}

export function ProfileMusicPlayer({ spotifyUrl }: ProfileMusicPlayerProps) {
  const source = resolveMusicSource(spotifyUrl);
  const [expanded, setExpanded] = useState(false);

  if (!source) return null;

  const isSpotify = source.platform === "spotify";
  const brandColor = isSpotify ? "#1DB954" : "#FF0000";

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
          {isSpotify ? (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#1DB954]">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#FF0000]">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          )}

          <div className="absolute -top-1 -right-1 flex items-end gap-[1.5px] h-3">
            {[4, 7, 3, 6].map((h, i) => (
              <div
                key={i}
                className="w-[2px] rounded-full animate-pulse"
                style={{
                  height: h,
                  backgroundColor: brandColor,
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
          style={{ animation: "slideUp 0.3s ease-out" }}
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
              {isSpotify ? (
                <iframe
                  src={source.embedUrl}
                  width="100%"
                  height={source.height}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  style={{ border: 0, borderRadius: "12px" }}
                  title="Spotify player"
                />
              ) : (
                <iframe
                  src={source.embedUrl}
                  width="100%"
                  height="200"
                  allow="autoplay; encrypted-media"
                  loading="lazy"
                  style={{ border: 0, borderRadius: "12px" }}
                  title="YouTube player"
                />
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
