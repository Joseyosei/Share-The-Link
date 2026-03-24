import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface CountdownTimerProps {
  endDate: string;
  label?: string;
  textColor?: string;
}

export const CountdownTimer = ({ endDate, label, textColor = "text-white" }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setExpired(true);
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (expired) return null;

  const blocks = [
    { value: timeLeft.days, label: "d" },
    { value: timeLeft.hours, label: "h" },
    { value: timeLeft.minutes, label: "m" },
    { value: timeLeft.seconds, label: "s" },
  ];

  return (
    <div className="flex items-center gap-2 mt-1">
      <Clock className={`w-3 h-3 ${textColor} opacity-60`} />
      {label && <span className={`text-[10px] ${textColor} opacity-60`}>{label}</span>}
      <div className="flex gap-1">
        {blocks.map((block) => (
          <div key={block.label} className="flex items-baseline">
            <span className={`text-xs font-mono font-bold ${textColor}`}>
              {String(block.value).padStart(2, "0")}
            </span>
            <span className={`text-[9px] ${textColor} opacity-50`}>{block.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
