import { useState } from "react";
import { GripVertical, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface LinkCardProps {
  id: string;
  title: string;
  url: string;
  clicks: number;
  isActive: boolean;
  onToggle: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const LinkCard = ({
  id,
  title,
  url,
  clicks,
  isActive,
  onToggle,
  onEdit,
  onDelete,
}: LinkCardProps) => {
  return (
    <div className={`group bg-card rounded-xl p-4 shadow-md hover:shadow-lg transition-all border-2 ${
      isActive ? "border-transparent" : "border-muted opacity-60"
    }`}>
      <div className="flex items-center gap-4">
        {/* Drag Handle */}
        <button className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors">
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">{url}</p>
        </div>

        {/* Clicks */}
        <div className="text-center px-4">
          <p className="font-bold text-foreground">{clicks}</p>
          <p className="text-xs text-muted-foreground">clicks</p>
        </div>

        {/* Toggle */}
        <Switch
          checked={isActive}
          onCheckedChange={() => onToggle(id)}
          className="data-[state=checked]:bg-primary"
        />

        {/* Actions */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
