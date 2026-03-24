import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface LocalTimeDisplayProps {
  timezone: string;
  textColorClass?: string;
  style?: React.CSSProperties;
}

const TIMEZONE_LABELS: Record<string, string> = {
  "Pacific/Midway": "SST",
  "Pacific/Honolulu": "HAST",
  "America/Anchorage": "AKST",
  "America/Los_Angeles": "PST",
  "America/Denver": "MST",
  "America/Chicago": "CST",
  "America/New_York": "EST",
  "America/Bogota": "COT",
  "America/Caracas": "VET",
  "America/Halifax": "AST",
  "America/St_Johns": "NST",
  "America/Argentina/Buenos_Aires": "ART",
  "America/Sao_Paulo": "BRT",
  "Atlantic/Azores": "AZOST",
  "UTC": "UTC",
  "Europe/London": "GMT",
  "Europe/Paris": "CET",
  "Europe/Berlin": "CET",
  "Europe/Helsinki": "EET",
  "Europe/Istanbul": "TRT",
  "Africa/Cairo": "EET",
  "Africa/Johannesburg": "SAST",
  "Africa/Lagos": "WAT",
  "Africa/Nairobi": "EAT",
  "Asia/Dubai": "GST",
  "Asia/Tehran": "IRST",
  "Asia/Kabul": "AFT",
  "Asia/Karachi": "PKT",
  "Asia/Kolkata": "IST",
  "Asia/Kathmandu": "NPT",
  "Asia/Dhaka": "BST",
  "Asia/Bangkok": "ICT",
  "Asia/Singapore": "SGT",
  "Asia/Hong_Kong": "HKT",
  "Asia/Shanghai": "CST",
  "Asia/Tokyo": "JST",
  "Asia/Seoul": "KST",
  "Australia/Adelaide": "ACST",
  "Australia/Sydney": "AEST",
  "Pacific/Auckland": "NZDT",
  "Pacific/Fiji": "FJT",
  "Pacific/Tongatapu": "TOT",
};

function getShortLabel(tz: string): string {
  if (TIMEZONE_LABELS[tz]) return TIMEZONE_LABELS[tz];
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value || tz.split("/").pop()?.replace(/_/g, " ") || tz;
  } catch {
    return tz.split("/").pop()?.replace(/_/g, " ") || tz;
  }
}

export const LocalTimeDisplay = ({ timezone, textColorClass = "text-white", style }: LocalTimeDisplayProps) => {
  const [time, setTime] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    const update = () => {
      try {
        const now = new Date();
        const formatted = now.toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
        setTime(formatted);
        setLabel(getShortLabel(timezone));
      } catch {
        setTime("");
      }
    };

    update();
    const interval = setInterval(update, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [timezone]);

  if (!time) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium ${textColorClass} opacity-80`}
      style={style}
    >
      <Clock className="w-3 h-3" />
      <span>{time}</span>
      <span className="opacity-60">{label}</span>
    </div>
  );
};

// List of common timezones for the settings dropdown
export const COMMON_TIMEZONES = [
  { value: "", label: "No timezone displayed" },
  { value: "Pacific/Midway", label: "(UTC-11:00) Midway Island, Samoa" },
  { value: "Pacific/Honolulu", label: "(UTC-10:00) Hawaii" },
  { value: "America/Anchorage", label: "(UTC-09:00) Alaska" },
  { value: "America/Los_Angeles", label: "(UTC-08:00) Pacific Time (US & Canada)" },
  { value: "America/Denver", label: "(UTC-07:00) Mountain Time (US & Canada)" },
  { value: "America/Chicago", label: "(UTC-06:00) Central Time (US & Canada)" },
  { value: "America/New_York", label: "(UTC-05:00) Eastern Time (US & Canada)" },
  { value: "America/Bogota", label: "(UTC-05:00) Bogota, Lima, Quito" },
  { value: "America/Caracas", label: "(UTC-04:30) Caracas" },
  { value: "America/Halifax", label: "(UTC-04:00) Atlantic Time (Canada)" },
  { value: "America/St_Johns", label: "(UTC-03:30) Newfoundland" },
  { value: "America/Argentina/Buenos_Aires", label: "(UTC-03:00) Buenos Aires" },
  { value: "America/Sao_Paulo", label: "(UTC-03:00) Brasilia" },
  { value: "Atlantic/Azores", label: "(UTC-01:00) Azores" },
  { value: "UTC", label: "(UTC+00:00) UTC" },
  { value: "Europe/London", label: "(UTC+00:00) London, Dublin, Lisbon (GMT/BST)" },
  { value: "Europe/Paris", label: "(UTC+01:00) Paris, Berlin, Amsterdam (CET)" },
  { value: "Europe/Berlin", label: "(UTC+01:00) Berlin, Frankfurt, Munich" },
  { value: "Africa/Lagos", label: "(UTC+01:00) Lagos, West Africa" },
  { value: "Europe/Helsinki", label: "(UTC+02:00) Helsinki, Kyiv, Bucharest (EET)" },
  { value: "Africa/Cairo", label: "(UTC+02:00) Cairo" },
  { value: "Africa/Johannesburg", label: "(UTC+02:00) Johannesburg (SAST)" },
  { value: "Europe/Istanbul", label: "(UTC+03:00) Istanbul, Turkey" },
  { value: "Africa/Nairobi", label: "(UTC+03:00) Nairobi, East Africa (EAT)" },
  { value: "Asia/Dubai", label: "(UTC+04:00) Dubai, Abu Dhabi" },
  { value: "Asia/Tehran", label: "(UTC+04:30) Tehran" },
  { value: "Asia/Kabul", label: "(UTC+04:30) Kabul" },
  { value: "Asia/Karachi", label: "(UTC+05:00) Karachi, Islamabad (PKT)" },
  { value: "Asia/Kolkata", label: "(UTC+05:30) Mumbai, Kolkata, New Delhi (IST)" },
  { value: "Asia/Kathmandu", label: "(UTC+05:45) Kathmandu (NPT)" },
  { value: "Asia/Dhaka", label: "(UTC+06:00) Dhaka" },
  { value: "Asia/Bangkok", label: "(UTC+07:00) Bangkok, Hanoi, Jakarta" },
  { value: "Asia/Singapore", label: "(UTC+08:00) Singapore, Kuala Lumpur" },
  { value: "Asia/Hong_Kong", label: "(UTC+08:00) Hong Kong" },
  { value: "Asia/Shanghai", label: "(UTC+08:00) Beijing, Shanghai" },
  { value: "Asia/Tokyo", label: "(UTC+09:00) Tokyo, Osaka (JST)" },
  { value: "Asia/Seoul", label: "(UTC+09:00) Seoul (KST)" },
  { value: "Australia/Adelaide", label: "(UTC+09:30) Adelaide" },
  { value: "Australia/Sydney", label: "(UTC+10:00) Sydney, Melbourne (AEST)" },
  { value: "Pacific/Auckland", label: "(UTC+12:00) Auckland, Wellington (NZDT)" },
  { value: "Pacific/Fiji", label: "(UTC+12:00) Fiji" },
  { value: "Pacific/Tongatapu", label: "(UTC+13:00) Tonga" },
];
