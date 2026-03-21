import { useParams, Link } from "react-router-dom";
import { User, Share2, ExternalLink, Loader2, Instagram, Youtube, Github, Globe, Linkedin, Music, MessageCircle, ChevronLeft, ChevronRight, QrCode, Calendar, Video, ArrowRight, Sun, Moon, ChevronDown, ShoppingBag, Image as ImageIcon } from "lucide-react";
import { XIcon } from "@/components/icons/XIcon";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "@/components/Logo";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { themes } from "@/pages/DashboardAppearance";
import { BookingWidget } from "@/components/BookingWidget";

// ── Embedded media helpers ───────────────────────────────────────────
const getYouTubeId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const getSpotifyEmbed = (url: string) => {
  // Matches open.spotify.com/track/ID, /album/ID, /playlist/ID
  const match = url.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (match) return { type: match[1], id: match[2] };
  return null;
};

const MediaPreview = ({ url }: { url: string }) => {
  const ytId = getYouTubeId(url);
  if (ytId) {
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden mt-1.5 mb-1">
        <img
          src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
          alt="YouTube thumbnail"
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  const spotify = getSpotifyEmbed(url);
  if (spotify) {
    return (
      <div className="w-full rounded-lg overflow-hidden mt-1.5 mb-1" style={{ height: "80px" }}>
        <iframe
          src={`https://open.spotify.com/embed/${spotify.type}/${spotify.id}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          style={{ border: 0, borderRadius: "8px" }}
          title="Spotify embed"
        />
      </div>
    );
  }

  return null;
};

const hasMediaPreview = (url: string) => !!(getYouTubeId(url) || getSpotifyEmbed(url));

// ── Link Button component ───────────────────────────────────────────
interface LinkButtonProps {
  link: { id: string; title: string; url: string; link_type: string };
  onClick: (id: string, url: string) => void;
  btnClass: string;
  btnInlineStyle: React.CSSProperties;
  btnTextColor: string;
  btnTextInlineStyle: React.CSSProperties;
  fontStyle: React.CSSProperties;
}

const LinkButton = ({ link, onClick, btnClass, btnInlineStyle, btnTextColor, btnTextInlineStyle, fontStyle }: LinkButtonProps) => {
  const showMedia = hasMediaPreview(link.url);
  return (
    <button
      key={link.id}
      onClick={() => onClick(link.id, link.url)}
      className={`w-full text-left p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${btnClass}`}
      style={{ ...btnInlineStyle, ...fontStyle }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <span className={`font-semibold block ${btnTextColor}`} style={btnTextInlineStyle}>{link.title}</span>
          {link.link_type === "product" && <span className="text-xs text-accent font-medium">Product</span>}
          {link.link_type === "video" && <span className="text-xs text-destructive font-medium">Video</span>}
        </div>
        <ExternalLink className={`w-5 h-5 opacity-70 ${btnTextColor}`} style={btnTextInlineStyle} />
      </div>
      {showMedia && <MediaPreview url={link.url} />}
    </button>
  );
};

// ── Link Group (collapsible) ────────────────────────────────────────
interface LinkGroupProps {
  groupName: string;
  links: { id: string; title: string; url: string; link_type: string }[];
  onLinkClick: (id: string, url: string) => void;
  btnClass: string;
  btnInlineStyle: React.CSSProperties;
  btnTextColor: string;
  btnTextInlineStyle: React.CSSProperties;
  fontStyle: React.CSSProperties;
  textColor: string;
}

const LinkGroup = ({ groupName, links, onLinkClick, btnClass, btnInlineStyle, btnTextColor, btnTextInlineStyle, fontStyle, textColor }: LinkGroupProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-sm font-semibold ${textColor} opacity-70 hover:opacity-100 transition-opacity w-full`}
        style={fontStyle}
      >
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
        {groupName}
        <span className="text-xs opacity-50">({links.length})</span>
      </button>
      {isOpen && (
        <div className="space-y-2 pl-1">
          {links.map((link) => (
            <LinkButton
              key={link.id}
              link={link}
              onClick={onLinkClick}
              btnClass={btnClass}
              btnInlineStyle={btnInlineStyle}
              btnTextColor={btnTextColor}
              btnTextInlineStyle={btnTextInlineStyle}
              fontStyle={fontStyle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  category: string;
  external_url: string | null;
}

interface BookingServicePreview {
  id: string;
  title: string;
  type: string;
  duration: number;
  price: number;
}

interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

interface ProfileData {
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  social_links?: SocialLinks;
}

interface LinkData {
  id: string;
  title: string;
  url: string;
  link_type: string;
  link_position: number;
  schedule_start?: string | null;
  schedule_end?: string | null;
  link_group?: string | null;
}

const Profile = () => {
  const { username } = useParams<{ username: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [links, setLinks] = useState<LinkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [themeId, setThemeId] = useState<string>("air");
  const [customAppearance, setCustomAppearance] = useState<{
    wallpaperType?: string;
    backgroundGradient?: string;
    backgroundColor?: string;
    backgroundAnimation?: string;
    fontFamily?: string;
    titleColor?: string;
    bioColor?: string;
    buttonStyle?: string;
    buttonColor?: string;
  }>({});
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [hasBookingServices, setHasBookingServices] = useState(false);
  const [bookingServicesPreview, setBookingServicesPreview] = useState<BookingServicePreview[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [viewerDarkMode, setViewerDarkMode] = useState<boolean | null>(null); // null = use theme default

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        // Fetch profile using RPC function
        const { data: profileData, error: profileError } = await supabase
          .rpc('get_public_profile', { lookup_username: username });

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setNotFound(true);
          setLoading(false);
          return;
        }

        if (!profileData || profileData.length === 0) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile(profileData[0] as ProfileData);

        // Fetch links using RPC function
        const { data: linksData, error: linksError } = await supabase
          .rpc('get_public_links', { lookup_username: username });

        if (linksError) {
          console.error('Links fetch error:', linksError);
        } else {
          setLinks((linksData || []) as LinkData[]);
        }

        // Fetch appearance settings for this user
        const { data: profileRecord } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("username", username)
          .single();

        if (profileRecord) {
          const { data: appearanceData } = await supabase
            .from("appearance_settings")
            .select("theme, background_type, background_gradient, background_color, background_animation, font_family, title_color, bio_color, button_style, button_color")
            .eq("user_id", profileRecord.user_id)
            .single();

          if (appearanceData?.theme) {
            setThemeId(appearanceData.theme);
          }
          if (appearanceData) {
            setCustomAppearance({
              wallpaperType: appearanceData.background_type || undefined,
              backgroundGradient: appearanceData.background_gradient || undefined,
              backgroundColor: appearanceData.background_color || undefined,
              backgroundAnimation: (appearanceData as any).background_animation || undefined,
              fontFamily: appearanceData.font_family || undefined,
              titleColor: appearanceData.title_color || undefined,
              bioColor: appearanceData.bio_color || undefined,
              buttonStyle: appearanceData.button_style || undefined,
              buttonColor: appearanceData.button_color || undefined,
            });
          }

          // Store creator ID for booking widget
          setCreatorId(profileRecord.user_id);

          // Check if creator has booking services and fetch preview data
          const { data: bookingSvcs } = await supabase
            .from("booking_services")
            .select("id, title, type, duration, price")
            .eq("creator_id", profileRecord.user_id)
            .eq("is_active", true)
            .order("price")
            .limit(3);
          setHasBookingServices(!!(bookingSvcs && bookingSvcs.length > 0));
          setBookingServicesPreview((bookingSvcs || []) as BookingServicePreview[]);

          // Fetch user products for shop section
          const { data: productsData } = await supabase
            .from("user_products")
            .select("id, name, description, price_cents, image_url, category, external_url")
            .eq("user_id", profileRecord.user_id)
            .eq("is_active", true)
            .order("created_at", { ascending: false });
          setProducts((productsData || []) as ProductData[]);

          // Track profile view
          try {
            const visitorId = localStorage.getItem("stl_visitor_id") || 
              `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
            if (!localStorage.getItem("stl_visitor_id")) {
              localStorage.setItem("stl_visitor_id", visitorId);
            }
            fetch("/api/track-event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event_type: "profile_view",
                user_id: profileRecord.user_id,
                visitor_id: visitorId,
                referrer: document.referrer || null,
              }),
            }).catch(() => {}); // fire and forget
          } catch {}
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  // SEO meta tags - dynamic per profile
  useEffect(() => {
    if (!profile) return;
    const name = profile.full_name || username || "";
    const desc = profile.bio || `Check out ${name}'s links on Share The Link`;
    const url = `${window.location.origin}/${username}`;

    document.title = `${name} | Share The Link`;

    // Helper to set or create meta tags
    const setMeta = (property: string, content: string, isOG = false) => {
      const attr = isOG ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", desc);
    setMeta("og:title", `${name} | Share The Link`, true);
    setMeta("og:description", desc, true);
    setMeta("og:url", url, true);
    setMeta("og:type", "profile", true);
    if (profile.avatar_url) {
      setMeta("og:image", profile.avatar_url, true);
    }
    setMeta("twitter:card", "summary");
    setMeta("twitter:title", `${name} | Share The Link`);
    setMeta("twitter:description", desc);
    if (profile.avatar_url) {
      setMeta("twitter:image", profile.avatar_url);
    }

    // Structured data (JSON-LD)
    let ldScript = document.querySelector('script[data-stl-ld]');
    if (!ldScript) {
      ldScript = document.createElement("script");
      ldScript.setAttribute("type", "application/ld+json");
      ldScript.setAttribute("data-stl-ld", "true");
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: name,
      description: desc,
      url: url,
      image: profile.avatar_url || undefined,
      sameAs: visibleLinks.map((l) => l.url),
    });

    return () => {
      document.title = "Share The Link";
    };
  }, [profile, username, visibleLinks]);

  // Get theme data
  const creatorTheme = themes.find((t) => t.id === themeId) || themes[0];

  // Dark/light mode overrides for the viewer
  const darkOverride = { id: "dark-override", name: "Dark", background: "bg-gray-950", buttonStyle: "bg-white", textColor: "text-white" };
  const lightOverride = { id: "light-override", name: "Light", background: "bg-white", buttonStyle: "bg-gray-900", textColor: "text-gray-900" };

  // Detect if creator's theme is "dark" (dark background)
  const isDarkTheme = /bg-(black|gray-9|slate-9|slate-8|zinc-9|neutral-9|indigo-9|purple-9|blue-9|red-9|rose-9|emerald-7|green-9|stone-[6-9])/.test(creatorTheme.background) || creatorTheme.background.includes("950");

  // Compute current theme: null = creator default, true = dark, false = light
  const currentTheme = viewerDarkMode === null
    ? creatorTheme
    : viewerDarkMode
      ? darkOverride
      : lightOverride;

  // -- ALL HOOKS MUST BE ABOVE CONDITIONAL RETURNS --

  // Filter links by schedule (hide links outside their schedule window)
  const visibleLinks = useMemo(() => {
    const now = new Date();
    return links.filter((link) => {
      if (link.schedule_start && new Date(link.schedule_start) > now) return false;
      if (link.schedule_end && new Date(link.schedule_end) < now) return false;
      return true;
    });
  }, [links]);

  // Flipbook: split links into pages of 4
  const LINKS_PER_PAGE = 4;
  const linkPages = useMemo(() => {
    const pages: LinkData[][] = [];
    for (let i = 0; i < visibleLinks.length; i += LINKS_PER_PAGE) {
      pages.push(visibleLinks.slice(i, i + LINKS_PER_PAGE));
    }
    return pages;
  }, [visibleLinks]);

  const hasProducts = products.length > 0;
  // Pages: cover + link pages + (optional shop) + (optional booking) + footer
  const totalPages = 1 + Math.max(linkPages.length, 1) + (hasProducts ? 1 : 0) + (hasBookingServices ? 1 : 0) + 1;
  const [currentPage, setCurrentPage] = useState(0);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [touchStart, setTouchStart] = useState(0);

  const goToPage = useCallback((direction: "next" | "prev") => {
    if (isFlipping) return;
    const nextIdx = direction === "next" ? currentPage + 1 : currentPage - 1;
    if (nextIdx < 0 || nextIdx >= totalPages) return;
    setFlipDirection(direction);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(nextIdx);
      setFlipDirection(null);
      setIsFlipping(false);
    }, 500);
  }, [currentPage, totalPages, isFlipping]);

  // Keyboard support
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goToPage("next");
      if (e.key === "ArrowLeft") goToPage("prev");
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goToPage]);

  // -- END HOOKS -- conditional returns below are now safe --

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Share this link with your audience.",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      await supabase.rpc('increment_link_click' as never, { link_id: linkId } as never);
    } catch (err) {
      console.error('Click tracking failed:', err);
    }
    try {
      const { data: profileRecord } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", username)
        .single();
      if (profileRecord) {
        const visitorId = localStorage.getItem("stl_visitor_id") || 
          `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        fetch("/api/track-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_type: "link_click",
            user_id: profileRecord.user_id,
            link_id: linkId,
            visitor_id: visitorId,
            referrer: document.referrer || null,
          }),
        }).catch(() => {});
      }
    } catch {}
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center text-primary-foreground">
          <h1 className="text-4xl font-bold mb-4">Profile not found</h1>
          <p className="text-primary-foreground/70 mb-6">
            {"This username doesn't exist yet."}
          </p>
          <Link
            to="/signup"
            className="inline-block px-6 py-3 bg-primary-foreground text-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Claim this username
          </Link>
        </div>
      </div>
    );
  }

  // Auto-detect social links from regular links if social_links isn't populated
  const detectedSocials: SocialLinks = { ...(profile?.social_links || {}) };
  const hasSocialsFromProfile = profile?.social_links && Object.values(profile.social_links).some(Boolean);
  if (!hasSocialsFromProfile && links.length > 0) {
    for (const link of links) {
      const url = link.url?.toLowerCase() || "";
      if (url.includes("twitter.com") || url.includes("x.com")) detectedSocials.twitter = link.url;
      if (url.includes("instagram.com")) detectedSocials.instagram = link.url;
      if (url.includes("youtube.com")) detectedSocials.youtube = link.url;
      if (url.includes("github.com")) detectedSocials.github = link.url;
      if (url.includes("linkedin.com")) detectedSocials.linkedin = link.url;
    }
  }
  const hasAnySocials = Object.values(detectedSocials).some(Boolean);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      goToPage(diff > 0 ? "next" : "prev");
    }
  };

  // Custom appearance helpers
  const ca = customAppearance;
  const hasCustomWallpaper = ca.wallpaperType && ca.wallpaperType !== "none";
  const isAnimated = ca.wallpaperType === "animated";
  const effectiveBackground = hasCustomWallpaper
    ? ca.wallpaperType === "gradient" || isAnimated
      ? `bg-gradient-to-br ${ca.backgroundGradient || "from-purple-500 to-pink-500"}`
      : ca.wallpaperType === "pattern"
        ? `${currentTheme.background} bg-[radial-gradient(circle,_rgba(255,255,255,0.08)_1px,_transparent_1px)] bg-[size:20px_20px]`
        : currentTheme.background
    : currentTheme.background;
  const animationClass = isAnimated ? `stl-anim-${ca.backgroundAnimation || "aurora"}` : "";
  const bgInlineStyle: React.CSSProperties = ca.wallpaperType === "none" && ca.backgroundColor
    ? { backgroundColor: ca.backgroundColor }
    : {};
  const fontStyle: React.CSSProperties = ca.fontFamily ? { fontFamily: ca.fontFamily } : {};
  const titleInlineStyle: React.CSSProperties = ca.titleColor ? { color: ca.titleColor, ...fontStyle } : fontStyle;
  const bioInlineStyle: React.CSSProperties = ca.bioColor ? { color: ca.bioColor, ...fontStyle } : fontStyle;

  // Custom button styling
  const customBtnRadius = ca.buttonStyle === "pill"
    ? "rounded-full"
    : ca.buttonStyle === "sharp"
      ? "rounded-none"
      : ca.buttonStyle === "outline"
        ? "rounded-2xl bg-transparent border-2"
        : "rounded-2xl";
  const hasCustomButton = !!(ca.buttonColor || ca.buttonStyle);
  const effectiveBtnClass = hasCustomButton ? customBtnRadius : currentTheme.buttonStyle;
  const btnInlineStyle: React.CSSProperties = ca.buttonColor
    ? {
        backgroundColor: ca.buttonStyle === "outline" ? "transparent" : ca.buttonColor,
        borderColor: ca.buttonColor,
      }
    : {};

  // Button text color helper
  const btnTextColor = ca.buttonColor
    ? (ca.buttonStyle === "outline" ? "" : "text-white")
    : currentTheme.buttonStyle.includes("bg-white") || currentTheme.buttonStyle.includes("bg-amber-100") || currentTheme.buttonStyle.includes("bg-lime-") || currentTheme.buttonStyle.includes("bg-amber-200") ? "text-gray-900" : "text-white";
  const btnTextInlineStyle: React.CSSProperties = ca.buttonColor && ca.buttonStyle === "outline"
    ? { color: ca.buttonColor }
    : {};

  const renderPage = (pageIndex: number) => {
    // Page 0: Cover page (avatar + name + bio + socials)
    if (pageIndex === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-8">
          <div className="w-28 h-28 rounded-full backdrop-blur-lg mx-auto mb-5 flex items-center justify-center border-4 shadow-xl overflow-hidden bg-white/20 border-white/30">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
            ) : (
              <User className={`w-14 h-14 ${currentTheme.textColor}`} />
            )}
          </div>
          <h1 className={`text-2xl font-bold ${currentTheme.textColor} mb-1 text-balance text-center`} style={titleInlineStyle}>
            {profile?.full_name || username}
          </h1>
          <p className={`${currentTheme.textColor} opacity-70 mb-3`} style={fontStyle}>@{username}</p>
          {profile?.bio && (
            <p className={`${currentTheme.textColor} opacity-90 max-w-xs text-center mb-5 text-pretty leading-relaxed`} style={bioInlineStyle}>
              {profile.bio}
            </p>
          )}
          {hasAnySocials && (
            <div className="flex items-center justify-center gap-3">
              {detectedSocials.twitter && (
                <a href={detectedSocials.twitter.startsWith("http") ? detectedSocials.twitter : `https://x.com/${detectedSocials.twitter}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-black text-white shadow-md" aria-label="X">
                  <XIcon className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.instagram && (
                <a href={detectedSocials.instagram.startsWith("http") ? detectedSocials.instagram : `https://instagram.com/${detectedSocials.instagram}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-md" aria-label="Instagram">
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.youtube && (
                <a href={detectedSocials.youtube.startsWith("http") ? detectedSocials.youtube : `https://youtube.com/${detectedSocials.youtube}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-red-600 text-white shadow-md" aria-label="YouTube">
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.github && (
                <a href={detectedSocials.github.startsWith("http") ? detectedSocials.github : `https://github.com/${detectedSocials.github}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-gray-800 text-white shadow-md" aria-label="GitHub">
                  <Github className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.linkedin && (
                <a href={detectedSocials.linkedin.startsWith("http") ? detectedSocials.linkedin : `https://linkedin.com/in/${detectedSocials.linkedin}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-blue-700 text-white shadow-md" aria-label="LinkedIn">
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
              {detectedSocials.website && (
                <a href={detectedSocials.website.startsWith("http") ? detectedSocials.website : `https://${detectedSocials.website}`} target="_blank" rel="noopener noreferrer" className={`w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-white/20 backdrop-blur-sm shadow-md ${currentTheme.textColor}`} aria-label="Website">
                  <Globe className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
          
          {/* Shop CTA - Show if creator has products */}
          {hasProducts && (
            <button
              onClick={() => {
                const shopIdx = 1 + Math.max(linkPages.length, 1);
                if (shopIdx !== currentPage && !isFlipping) {
                  setFlipDirection(shopIdx > currentPage ? "next" : "prev");
                  setIsFlipping(true);
                  setTimeout(() => {
                    setCurrentPage(shopIdx);
                    setFlipDirection(null);
                    setIsFlipping(false);
                  }, 500);
                }
              }}
              className={`mt-4 w-full max-w-xs px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500/90 to-orange-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
            >
              <ShoppingBag className="w-4 h-4" />
              Shop Products
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          )}

          {/* Booking CTA - Show if creator has booking services */}
          {hasBookingServices && bookingServicesPreview.length > 0 && (
            <button
              onClick={() => {
                // Navigate to booking page (last page before footer)
                const bookingPageIndex = totalPages - 2;
                if (bookingPageIndex !== currentPage && !isFlipping) {
                  setFlipDirection(bookingPageIndex > currentPage ? "next" : "prev");
                  setIsFlipping(true);
                  setTimeout(() => {
                    setCurrentPage(bookingPageIndex);
                    setFlipDirection(null);
                    setIsFlipping(false);
                  }, 500);
                }
              }}
              className={`mt-4 w-full max-w-xs px-5 py-3 rounded-xl bg-gradient-to-r from-primary/90 to-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
            >
              <Calendar className="w-4 h-4" />
              Book a Session
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          )}
          
          {/* Page turn hint */}
          <div className={`mt-auto pt-4 ${currentTheme.textColor} opacity-40 text-xs flex items-center gap-1`}>
            Swipe or tap arrow to flip
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      );
    }

    // Last page: Footer with QR Code
    if (pageIndex === totalPages - 1) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 py-6">
          {/* QR Code for scanning */}
          <div className="bg-white rounded-2xl p-3 shadow-lg mb-4">
            <QRCodeSVG
              value={`${window.location.origin}/${username}`}
              size={120}
              level="H"
              includeMargin={false}
              bgColor="#FFFFFF"
              fgColor="#000000"
            />
          </div>
          <p className={`${currentTheme.textColor} text-sm font-semibold mb-1`}>
            Scan to connect
          </p>
          <p className={`${currentTheme.textColor} opacity-50 text-xs mb-4`}>
            @{username}
          </p>
          <button
            onClick={handleShare}
            className={`px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors ${currentTheme.textColor} font-semibold flex items-center gap-2 text-sm`}
          >
            <Share2 className="w-4 h-4" />
            Share Profile
          </button>
          <Link
            to="/"
            className={`mt-auto pt-4 text-xs ${currentTheme.textColor} opacity-30 hover:opacity-50 transition-colors`}
          >
            Powered by Share The Link
          </Link>
        </div>
      );
    }

    // Shop page: inserted after links, before booking/footer
    const shopPageIndex = 1 + Math.max(linkPages.length, 1);
    if (hasProducts && pageIndex === shopPageIndex) {
      return (
        <div className="flex flex-col h-full px-5 py-6 overflow-y-auto">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className={`w-5 h-5 ${currentTheme.textColor}`} style={titleInlineStyle} />
            <h2 className={`text-lg font-bold ${currentTheme.textColor}`} style={titleInlineStyle}>Shop</h2>
          </div>
          <div className="flex-1 space-y-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => {
                  if (product.external_url) {
                    window.open(
                      product.external_url.startsWith("http") ? product.external_url : `https://${product.external_url}`,
                      "_blank",
                      "noopener,noreferrer"
                    );
                  }
                }}
                className={`w-full text-left rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                  product.external_url ? "cursor-pointer" : "cursor-default"
                }`}
                style={btnInlineStyle}
              >
                <div className={`flex gap-3 p-3 ${hasCustomButton ? effectiveBtnClass : currentTheme.buttonStyle}`} style={btnInlineStyle}>
                  {/* Product image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className={`w-6 h-6 ${btnTextColor} opacity-40`} style={btnTextInlineStyle} />
                    )}
                  </div>
                  {/* Product info */}
                  <div className="flex-1 min-w-0">
                    <span className={`font-semibold text-sm block truncate ${btnTextColor}`} style={btnTextInlineStyle}>
                      {product.name}
                    </span>
                    {product.description && (
                      <span className={`text-xs block truncate mt-0.5 ${btnTextColor} opacity-70`} style={btnTextInlineStyle}>
                        {product.description}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-sm font-bold ${btnTextColor}`} style={btnTextInlineStyle}>
                        ${(product.price_cents / 100).toFixed(2)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 ${btnTextColor}`} style={btnTextInlineStyle}>
                        {product.category === "digital" ? "Digital" : product.category === "physical" ? "Physical" : product.category === "service" ? "Service" : product.category === "course" ? "Course" : product.category}
                      </span>
                    </div>
                  </div>
                  {product.external_url && (
                    <ExternalLink className={`w-4 h-4 shrink-0 mt-1 opacity-60 ${btnTextColor}`} style={btnTextInlineStyle} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Booking page: inserted between links and footer
    const bookingOffset = hasProducts ? 1 : 0;
    if (hasBookingServices && creatorId && pageIndex === totalPages - 2) {
      return (
        <div className="flex flex-col h-full px-4 py-6 overflow-y-auto">
          <BookingWidget
            creatorId={creatorId}
            creatorName={profile?.full_name || username || ""}
            themeTextColor={currentTheme.textColor}
          />
        </div>
      );
    }

    // Middle pages: Links
    const linkPageIdx = pageIndex - 1;
    const pageLinks = linkPages[linkPageIdx] || [];

    // Group links by link_group (null group = ungrouped)
    const groupedLinks: Record<string, LinkData[]> = {};
    const ungroupedLinks: LinkData[] = [];
    for (const link of pageLinks) {
      if (link.link_group) {
        if (!groupedLinks[link.link_group]) groupedLinks[link.link_group] = [];
        groupedLinks[link.link_group].push(link);
      } else {
        ungroupedLinks.push(link);
      }
    }
    const groupNames = Object.keys(groupedLinks);
    const hasGroups = groupNames.length > 0;

    return (
      <div className="flex flex-col h-full px-6 py-8">
        <p className={`text-xs ${currentTheme.textColor} opacity-40 mb-4 text-center`}>
          Links {linkPageIdx * LINKS_PER_PAGE + 1}-{Math.min((linkPageIdx + 1) * LINKS_PER_PAGE, visibleLinks.length)} of {visibleLinks.length}
        </p>
        <div className="flex-1 flex flex-col gap-3 justify-center">
          {pageLinks.length > 0 ? (
            <>
              {/* Grouped links */}
              {groupNames.map((groupName) => (
                <LinkGroup
                  key={groupName}
                  groupName={groupName}
                  links={groupedLinks[groupName]}
                  onLinkClick={handleLinkClick}
                  btnClass={hasCustomButton ? effectiveBtnClass : currentTheme.buttonStyle}
                  btnInlineStyle={btnInlineStyle}
                  btnTextColor={btnTextColor}
                  btnTextInlineStyle={btnTextInlineStyle}
                  fontStyle={fontStyle}
                  textColor={currentTheme.textColor}
                />
              ))}
              {/* Ungrouped links */}
              {ungroupedLinks.map((link) => (
                <LinkButton
                  key={link.id}
                  link={link}
                  onClick={handleLinkClick}
                  btnClass={hasCustomButton ? effectiveBtnClass : currentTheme.buttonStyle}
                  btnInlineStyle={btnInlineStyle}
                  btnTextColor={btnTextColor}
                  btnTextInlineStyle={btnTextInlineStyle}
                  fontStyle={fontStyle}
                />
              ))}
            </>
          ) : (
            <div className={`text-center ${currentTheme.textColor} opacity-50 py-8`}>No links yet</div>
          )}
        </div>
      </div>
    );
  };

  // Flipbook flip animation class
  const getFlipClass = () => {
    if (!flipDirection) return "";
    return flipDirection === "next"
      ? "animate-[flipNext_0.5s_ease-in-out]"
      : "animate-[flipPrev_0.5s_ease-in-out]";
  };

  return (
    <div className={`min-h-screen ${effectiveBackground} ${animationClass} flex flex-col items-center justify-center py-8 px-4`} style={bgInlineStyle}>
      {/* Top-left logo */}
      <Link to="/" className="fixed top-4 left-4 z-10 opacity-60 hover:opacity-100 transition-opacity">
        <Logo textClassName={`${currentTheme.textColor} text-sm`} />
      </Link>

      {/* Top-right controls */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        {/* Dark/Light mode toggle */}
        <button
          onClick={() => {
            if (viewerDarkMode === null) {
              // First click: toggle opposite of creator theme
              setViewerDarkMode(!isDarkTheme);
            } else if (viewerDarkMode) {
              // Currently dark, switch to light
              setViewerDarkMode(false);
            } else {
              // Currently light, reset to creator theme
              setViewerDarkMode(null);
            }
          }}
          className={`p-3 rounded-full backdrop-blur-lg hover:opacity-80 transition-all ${currentTheme.textColor} bg-white/10`}
          aria-label="Toggle dark/light mode"
          title={viewerDarkMode === null ? "Switch mode" : viewerDarkMode ? "Switch to light" : "Reset to theme"}
        >
          {(viewerDarkMode === null ? isDarkTheme : viewerDarkMode) ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
        {/* Share Button */}
        <button
          onClick={handleShare}
          className={`p-3 rounded-full backdrop-blur-lg hover:opacity-80 transition-colors ${currentTheme.textColor} bg-white/10`}
          aria-label="Share profile"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </div>

      {/* Flipbook container */}
      <div
        className="relative w-full max-w-md"
        style={{ perspective: "1200px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* The "book" page */}
        <div
          className={`relative w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden min-h-[520px] flex flex-col ${getFlipClass()}`}
          style={{
            transformStyle: "preserve-3d",
            backfaceVisibility: "hidden",
          }}
        >
          {renderPage(currentPage)}
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-between mt-6 px-2">
          <button
            onClick={() => goToPage("prev")}
            disabled={currentPage === 0 || isFlipping}
            className={`p-3 rounded-full backdrop-blur-sm transition-all ${
              currentPage === 0
                ? "opacity-0 cursor-default"
                : `bg-white/10 hover:bg-white/20 ${currentTheme.textColor}`
            }`}
            aria-label="Previous page"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Page dots */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (i !== currentPage && !isFlipping) {
                    setFlipDirection(i > currentPage ? "next" : "prev");
                    setIsFlipping(true);
                    setTimeout(() => {
                      setCurrentPage(i);
                      setFlipDirection(null);
                      setIsFlipping(false);
                    }, 500);
                  }
                }}
                className={`rounded-full transition-all duration-300 ${
                  i === currentPage
                    ? `w-6 h-2.5 bg-white/80`
                    : `w-2.5 h-2.5 bg-white/30 hover:bg-white/50`
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => goToPage("next")}
            disabled={currentPage === totalPages - 1 || isFlipping}
            className={`p-3 rounded-full backdrop-blur-sm transition-all ${
              currentPage === totalPages - 1
                ? "opacity-0 cursor-default"
                : `bg-white/10 hover:bg-white/20 ${currentTheme.textColor}`
            }`}
            aria-label="Next page"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Flipbook CSS animations */}
      <style>{`
        @keyframes flipNext {
          0% { transform: rotateY(0deg); opacity: 1; }
          50% { transform: rotateY(-90deg); opacity: 0.5; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
        @keyframes flipPrev {
          0% { transform: rotateY(0deg); opacity: 1; }
          50% { transform: rotateY(90deg); opacity: 0.5; }
          100% { transform: rotateY(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Profile;
