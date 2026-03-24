import { ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";

interface FeaturedLink {
  id: string;
  title: string;
  url: string;
  thumbnail_url?: string | null;
  link_type: string;
}

interface FeaturedCarouselProps {
  links: FeaturedLink[];
  onLinkClick: (id: string, url: string) => void;
  textColor: string;
  btnClass: string;
  btnInlineStyle: React.CSSProperties;
  btnTextColor: string;
  btnTextInlineStyle: React.CSSProperties;
  fontStyle: React.CSSProperties;
}

const getYouTubeThumb = (url: string) => {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
};

export const FeaturedCarousel = ({
  links,
  onLinkClick,
  textColor,
  btnClass,
  btnInlineStyle,
  btnTextColor,
  btnTextInlineStyle,
  fontStyle,
}: FeaturedCarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [links]);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  if (links.length === 0) return null;

  return (
    <div className="w-full mb-4">
      <div className="flex items-center justify-between mb-2 px-1">
        <h3
          className={`text-xs font-semibold uppercase tracking-wider ${textColor} opacity-50`}
          style={fontStyle}
        >
          Featured
        </h3>
        <div className="flex gap-1">
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className={`p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors ${textColor}`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className={`p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors ${textColor}`}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div ref={trackRef} className="stl-carousel-track">
        {links.map((link) => {
          const thumb = link.thumbnail_url || getYouTubeThumb(link.url);
          return (
            <button
              key={link.id}
              onClick={() => onLinkClick(link.id, link.url)}
              className={`stl-carousel-card rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-xl ${btnClass}`}
              style={{ ...btnInlineStyle, ...fontStyle }}
            >
              {/* Thumbnail */}
              {thumb ? (
                <div className="w-full aspect-[16/10] overflow-hidden bg-black/20">
                  <img
                    src={thumb}
                    alt={link.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[16/10] bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                  <ExternalLink
                    className={`w-6 h-6 opacity-30 ${btnTextColor}`}
                    style={btnTextInlineStyle}
                  />
                </div>
              )}
              {/* Title */}
              <div className="p-3 flex items-center gap-2">
                <span
                  className={`text-xs font-semibold truncate flex-1 ${btnTextColor}`}
                  style={btnTextInlineStyle}
                >
                  {link.title}
                </span>
                <ExternalLink
                  className={`w-3.5 h-3.5 opacity-50 shrink-0 ${btnTextColor}`}
                  style={btnTextInlineStyle}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
