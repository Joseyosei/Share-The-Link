import { GripVertical, Pencil, Trash2, ExternalLink, Calendar, FolderOpen, Timer } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface LinkCardProps {
  id: string;
  title: string;
  url: string;
  clicks: number;
  isActive: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  scheduleStart?: string | null;
  scheduleEnd?: string | null;
  linkGroup?: string | null;
  thumbnailUrl?: string | null;
  countdownEnd?: string | null;
  countdownLabel?: string | null;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnter?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLDivElement>) => void;
}

export const LinkCard = ({
  id,
  title,
  url,
  clicks,
  isActive,
  isDragging,
  isDragOver,
  scheduleStart,
  scheduleEnd,
  linkGroup,
  thumbnailUrl,
  countdownEnd,
  countdownLabel,
  onToggle,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragEnter,
  onDragLeave,
}: LinkCardProps) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={`group bg-card rounded-xl p-3 sm:p-4 shadow-md transition-all border-2 ${
        isDragging
          ? "opacity-40 scale-95 border-primary/50"
          : isDragOver
          ? "border-primary ring-2 ring-primary/20 shadow-lg translate-y-[-2px]"
          : isActive
          ? "border-transparent hover:shadow-lg"
          : "border-muted opacity-60"
      }`}
      style={{ cursor: "grab" }}
    >
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Drag Handle */}
        <button className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors touch-none shrink-0">
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Thumbnail */}
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
            <img
              src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`}
              alt=""
              className="w-5 h-5"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            {(scheduleStart || scheduleEnd) && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full shrink-0">
                <Calendar className="w-2.5 h-2.5" />
                Scheduled
              </span>
            )}
            {linkGroup && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded-full shrink-0">
                <FolderOpen className="w-2.5 h-2.5" />
                {linkGroup}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{url}</p>
          {countdownEnd && new Date(countdownEnd) > new Date() && (
            <span className="inline-flex items-center gap-1 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full mt-1">
              <Timer className="w-2.5 h-2.5" />
              {countdownLabel || "Countdown"} &middot; {new Date(countdownEnd).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Clicks */}
        <div className="text-center px-2 sm:px-4 shrink-0">
          <p className="font-bold text-foreground text-sm sm:text-base">{clicks}</p>
          <p className="text-xs text-muted-foreground">clicks</p>
        </div>

        {/* Toggle */}
        <Switch
          checked={isActive}
          onCheckedChange={() => onToggle(id)}
          className="data-[state=checked]:bg-primary"
        />

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onEdit(id)}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};
