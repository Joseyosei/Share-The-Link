import {
  Star,
  Heart,
  Zap,
  Music,
  ShoppingBag,
  Briefcase,
  BookOpen,
  Link2,
  Globe,
  Gamepad2,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  heart: Heart,
  zap: Zap,
  music: Music,
  shop: ShoppingBag,
  work: Briefcase,
  book: BookOpen,
  link: Link2,
  globe: Globe,
  game: Gamepad2,
};

interface SectionDividerProps {
  label: string;
  color?: string | null;
  icon?: string | null;
  style?: "gradient" | "bold" | "dotted";
  textColor: string;
  fontStyle: React.CSSProperties;
}

export const SectionDivider = ({
  label,
  color,
  icon,
  style = "gradient",
  textColor,
  fontStyle,
}: SectionDividerProps) => {
  const dividerColor = color || "rgba(255,255,255,0.4)";
  const IconComponent = icon ? iconMap[icon] || Link2 : null;

  const dividerClass =
    style === "bold"
      ? "stl-divider-bold"
      : style === "dotted"
        ? "stl-divider-dotted"
        : "stl-divider-gradient";

  return (
    <div className="flex items-center gap-3 my-1">
      <hr
        className={`flex-1 ${dividerClass}`}
        style={{ "--divider-color": dividerColor } as React.CSSProperties}
      />
      <div
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${textColor} opacity-60`}
        style={{ color: color || undefined, ...fontStyle }}
      >
        {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
        {label}
      </div>
      <hr
        className={`flex-1 ${dividerClass}`}
        style={{ "--divider-color": dividerColor } as React.CSSProperties}
      />
    </div>
  );
};
