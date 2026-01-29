import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: { title: string; url: string; type: string }) => void;
  link: {
    id: string;
    title: string;
    url: string;
    type: string;
  } | null;
}

const linkTypes = [
  { value: "standard", label: "Standard Link" },
  { value: "product", label: "Product" },
  { value: "video", label: "Video" },
  { value: "social", label: "Social Profile" },
];

export const EditLinkModal = ({ isOpen, onClose, onSave, link }: EditLinkModalProps) => {
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    type: "standard",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (link) {
      setFormData({
        title: link.title,
        url: link.url,
        type: link.type,
      });
    }
  }, [link]);

  if (!isOpen || !link) return null;

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

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave(link.id, formData);
    setErrors({});
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
      <div className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl p-8 animate-scale-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-foreground mb-6">Edit Link</h2>

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
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
