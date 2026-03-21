import { useState } from "react";
import { X, Calendar, Clock, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (link: { title: string; url: string; type: string; schedule_start?: string | null; schedule_end?: string | null; link_group?: string | null }) => void;
  existingGroups?: string[];
}

const linkTypes = [
  { value: "standard", label: "Standard Link" },
  { value: "product", label: "Product" },
  { value: "video", label: "Video" },
  { value: "social", label: "Social Profile" },
];

export const AddLinkModal = ({ isOpen, onClose, onAdd, existingGroups = [] }: AddLinkModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    type: "standard",
    schedule_start: "",
    schedule_end: "",
    link_group: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSchedule, setShowSchedule] = useState(false);
  const [showGroup, setShowGroup] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.url.trim()) {
      newErrors.url = "URL is required";
    } else if (!/^https?:\/\/.+/.test(formData.url)) {
      newErrors.url = "Please enter a valid URL (starting with http:// or https://)";
    }

    if (showSchedule && formData.schedule_start && formData.schedule_end) {
      if (new Date(formData.schedule_end) <= new Date(formData.schedule_start)) {
        newErrors.schedule_end = "End date must be after start date";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onAdd({
      title: formData.title,
      url: formData.url,
      type: formData.type,
      schedule_start: showSchedule && formData.schedule_start ? new Date(formData.schedule_start).toISOString() : null,
      schedule_end: showSchedule && formData.schedule_end ? new Date(formData.schedule_end).toISOString() : null,
      link_group: showGroup && formData.link_group ? formData.link_group : null,
    });
    setFormData({ title: "", url: "", type: "standard", schedule_start: "", schedule_end: "", link_group: "" });
    setErrors({});
    setShowSchedule(false);
    setShowGroup(false);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-foreground mb-6">Add New Link</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Link Title
            </label>
            <input
              type="text"
              name="title"
              placeholder="e.g., My Portfolio"
              value={formData.title}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                errors.title ? "border-destructive" : "border-border"
              }`}
            />
            {errors.title && (
              <p className="text-destructive text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              URL
            </label>
            <input
              type="url"
              name="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-xl border-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                errors.url ? "border-destructive" : "border-border"
              }`}
            />
            {errors.url && (
              <p className="text-destructive text-sm mt-1">{errors.url}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Link Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            >
              {linkTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Toggle */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                showSchedule ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="w-4 h-4" />
              Schedule Link Visibility
            </button>

            {showSchedule && (
              <div className="mt-3 space-y-3 p-3 bg-muted rounded-xl">
                <p className="text-xs text-muted-foreground">
                  Set when this link should be visible (e.g., "Flash Sale" only on weekends).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Start
                    </label>
                    <input
                      type="datetime-local"
                      name="schedule_start"
                      value={formData.schedule_start}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      End
                    </label>
                    <input
                      type="datetime-local"
                      name="schedule_end"
                      value={formData.schedule_end}
                      onChange={handleChange}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.schedule_end && (
                      <p className="text-destructive text-xs mt-1">{errors.schedule_end}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Group Toggle */}
          <div className="border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setShowGroup(!showGroup)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                showGroup ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Add to Group
            </button>

            {showGroup && (
              <div className="mt-3 space-y-3 p-3 bg-muted rounded-xl">
                <input
                  type="text"
                  name="link_group"
                  placeholder="e.g., Music, Social, Merch"
                  value={formData.link_group}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  list="add-existing-groups"
                />
                {existingGroups.length > 0 && (
                  <>
                    <datalist id="add-existing-groups">
                      {existingGroups.map((g) => (
                        <option key={g} value={g} />
                      ))}
                    </datalist>
                    <div className="flex flex-wrap gap-1.5">
                      {existingGroups.map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, link_group: g }))}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            formData.link_group === g
                              ? "bg-primary text-white border-primary"
                              : "border-border text-muted-foreground hover:border-primary"
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-6"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 py-6 gradient-button text-primary-foreground hover:opacity-90"
            >
              Save Link
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
