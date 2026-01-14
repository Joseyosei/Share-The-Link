import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

export const StatsCard = ({ icon: Icon, label, value, change, positive }: StatsCardProps) => {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-xl gradient-button flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
        {change && (
          <span
            className={`text-sm font-medium px-2 py-1 rounded-lg ${
              positive
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {positive ? "+" : ""}{change}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
      <p className="text-muted-foreground">{label}</p>
    </div>
  );
};
