import { ExternalLink } from "lucide-react";

interface BentoLink {
  id: string;
  title: string;
  url: string;
  link_type: string;
  thumbnail_url?: string | null;
  bento_size?: string;
  animation?: string;
}

interface BentoGridProps {
  links: BentoLink[];
  onLinkClick: (id: string, url: string) => void;
  btnClass: string;
  btnInlineStyle: React.CSSProperties;
  btnTextColor: string;
  btnTextInlineStyle: React.CSSProperties;
  fontStyle: React.CSSProperties;
  globalAnimation: string;
}

const getYouTubeThumb = (url: string) => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
};

const animationClassMap: Record<string, string> = {
  pulse: "stl-link-pulse",
  shake: "stl-link-shake",
  bounce: "stl-link-bounce",
  glow: "stl-link-glow",
  "slide-in": "stl-link-slide-in",
};

export const BentoGrid = ({
  links,
  onLinkClick,
  btnClass,
  btnInlineStyle,
  btnTextColor,
  btnTextInlineStyle,
  fontStyle,
  globalAnimation,
}: BentoGridProps) => {
  if (links.length === 0) return null;

  return (
    <div className="stl-bento-grid w-full">
      {links.map((link) => {
        const size = link.bento_size || "1x1";
        const sizeClass =
          size === "2x1"
            ? "stl-bento-2x1"
            : size === "1x2"
              ? "stl-bento-1x2"
              : "stl-bento-1x1";

        const effectiveAnim =
          link.animation && link.animation !== "none"
            ? link.animation
            : globalAnimation;
        const animClass = animationClassMap[effectiveAnim] || "";

        const thumb = link.thumbnail_url || getYouTubeThumb(link.url);
        const isTall = size === "1x2";

        return (
          <button
            key={link.id}
            onClick={() => onLinkClick(link.id, link.url)}
            className={`${sizeClass} ${animClass} text-left rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${btnClass} relative`}
            style={{ ...btnInlineStyle, ...fontStyle, minHeight: isTall ? "160px" : "80px" }}
          >
            {thumb ? (
              <>
                <img
                  src={thumb}
                  alt={link.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="relative flex flex-col justify-end h-full p-3">
                  <span
                    className="font-semibold text-sm text-white truncate"
                    style={fontStyle}
                  >
                    {link.title}
                  </span>
                </div>
              </>
            ) : (
              <div className="flex flex-col justify-between h-full p-3">
                <div className="flex-1 flex items-center">
                  <span
                    className={`font-semibold text-sm ${btnTextColor} line-clamp-2`}
                    style={{ ...btnTextInlineStyle, ...fontStyle }}
                  >
                    {link.title}
                  </span>
                </div>
                <div className="flex justify-end">
                  <ExternalLink
                    className={`w-4 h-4 opacity-50 ${btnTextColor}`}
                    style={btnTextInlineStyle}
                  />
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
