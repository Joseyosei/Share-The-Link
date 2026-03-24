import { CheckCircle, Users, Calendar } from "lucide-react";

interface VerifiedBadgeProps {
  isVerified: boolean;
  showMemberSince: boolean;
  showFollowerCount: boolean;
  memberSinceDate?: string | null;
  followerCount?: number | null;
  textColor: string;
  style?: React.CSSProperties;
}

export const VerifiedBadge = ({
  isVerified,
  showMemberSince,
  showFollowerCount,
  memberSinceDate,
  followerCount,
  textColor,
  style,
}: VerifiedBadgeProps) => {
  if (!isVerified && !showMemberSince && !showFollowerCount) return null;

  const formattedDate = memberSinceDate
    ? new Date(memberSinceDate).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  const formattedCount =
    followerCount !== null && followerCount !== undefined
      ? followerCount >= 1000
        ? `${(followerCount / 1000).toFixed(1).replace(/\.0$/, "")}K`
        : String(followerCount)
      : null;

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-2 ${textColor} animate-[fadeInUp_0.5s_ease-out_0.15s_both]`}
      style={style}
    >
      {isVerified && (
        <span className="stl-badge-shimmer inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold">
          <CheckCircle className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />
          Verified
        </span>
      )}
      {showMemberSince && formattedDate && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs opacity-60">
          <Calendar className="w-3 h-3" />
          Joined {formattedDate}
        </span>
      )}
      {showFollowerCount && formattedCount && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-xs opacity-60">
          <Users className="w-3 h-3" />
          {formattedCount} followers
        </span>
      )}
    </div>
  );
};
