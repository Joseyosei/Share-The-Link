import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, Star, AlertCircle } from "lucide-react";

interface FormField {
  id: string;
  field_type: string;
  label: string;
  placeholder?: string;
  help_text?: string;
  is_required: boolean;
  options: string[];
  position: number;
}

interface FormData {
  id: string;
  title: string;
  description: string | null;
  thank_you_message: string;
}

const PublicForm = () => {
  const { formId } = useParams<{ formId: string }>();
  const { toast } = useToast();
  const [form, setForm] = useState<FormData | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (formId) loadForm();
  }, [formId]);

  const loadForm = async () => {
    setLoading(true);
    setError(null);

    const { data: formData, error: formErr } = await supabase
      .from("forms")
      .select("id, title, description, thank_you_message")
      .eq("id", formId!)
      .eq("status", "published")
      .eq("is_active", true)
      .single();

    if (formErr || !formData) {
      setError("This form is not available or has been closed.");
      setLoading(false);
      return;
    }

    const { data: fieldsData } = await supabase
      .from("form_fields")
      .select("*")
      .eq("form_id", formId!)
      .order("position", { ascending: true });

    setForm(formData as FormData);
    setFields(
      (fieldsData || []).map((f: any) => ({
        ...f,
        options: Array.isArray(f.options) ? f.options : [],
      }))
    );
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of fields) {
      if (field.is_required && field.field_type !== "statement") {
        const val = responses[field.id];
        if (val === undefined || val === null || val === "") {
          toast({
            title: "Required field",
            description: `Please fill in "${field.label}"`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    setSubmitting(true);
    const { error: submitErr } = await supabase.from("form_submissions").insert({
      form_id: formId!,
      responses,
      submitter_email: responses._email || null,
      submitter_name: responses._name || null,
    });

    if (submitErr) {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const updateResponse = (fieldId: string, value: any, fieldType?: string) => {
    setResponses((prev) => {
      const next = { ...prev, [fieldId]: value };
      // Track email/name for submitter fields
      if (fieldType === "email") next._email = value;
      if (fieldType === "name") next._name = value;
      return next;
    });
  };

  const renderField = (field: FormField) => {
    const value = responses[field.id] ?? "";

    switch (field.field_type) {
      case "statement":
        return (
          <p className="text-muted-foreground italic">{field.label}</p>
        );

      case "short_text":
      case "name":
      case "email":
      case "phone":
      case "website":
      case "address":
        return (
          <Input
            type={field.field_type === "email" ? "email" : field.field_type === "phone" ? "tel" : field.field_type === "website" ? "url" : "text"}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => updateResponse(field.id, e.target.value, field.field_type)}
            required={field.is_required}
          />
        );

      case "long_text":
        return (
          <Textarea
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            value={value}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            rows={4}
            required={field.is_required}
          />
        );

      case "number":
      case "payment":
        return (
          <Input
            type="number"
            placeholder={field.placeholder || "0"}
            value={value}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            required={field.is_required}
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            required={field.is_required}
          />
        );

      case "multiple_choice":
        return (
          <div className="space-y-2">
            {field.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="radio"
                  name={field.id}
                  value={opt}
                  checked={value === opt}
                  onChange={() => updateResponse(field.id, opt)}
                  className="w-4 h-4"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );

      case "checkbox":
        return (
          <div className="space-y-2">
            {field.options.map((opt, i) => (
              <label key={i} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/50 transition-colors">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(opt)}
                  onChange={(e) => {
                    const arr = Array.isArray(value) ? [...value] : [];
                    if (e.target.checked) arr.push(opt);
                    else arr.splice(arr.indexOf(opt), 1);
                    updateResponse(field.id, arr);
                  }}
                  className="w-4 h-4"
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );

      case "dropdown":
        return (
          <select
            value={value}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
            required={field.is_required}
          >
            <option value="">Select an option...</option>
            {field.options.map((opt, i) => (
              <option key={i} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case "yes_no":
        return (
          <div className="flex gap-3">
            {["Yes", "No"].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => updateResponse(field.id, opt)}
                className={`flex-1 py-3 rounded-lg border-2 font-medium transition-colors ${
                  value === opt
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-input hover:border-primary/50"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        );

      case "rating":
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateResponse(field.id, n)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    n <= (value || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>
        );

      case "opinion_scale":
        return (
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => updateResponse(field.id, n)}
                className={`w-10 h-10 rounded-lg border-2 font-medium text-sm transition-colors ${
                  value === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-input hover:border-primary/50"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        );

      case "file_upload":
        return (
          <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground">
            File upload is not available in this version
          </div>
        );

      default:
        return (
          <Input
            placeholder={field.placeholder || ""}
            value={value}
            onChange={(e) => updateResponse(field.id, e.target.value)}
          />
        );
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Form Unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground">{form?.thank_you_message || "Your response has been recorded."}</p>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 sm:p-8 border-b">
            <h1 className="text-2xl sm:text-3xl font-bold">{form?.title}</h1>
            {form?.description && (
              <p className="text-muted-foreground mt-2">{form.description}</p>
            )}
          </div>

          {/* Fields */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            {fields.map((field) => (
              <div key={field.id}>
                {field.field_type !== "statement" && (
                  <label className="block text-sm font-medium mb-2">
                    {field.label}
                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                  </label>
                )}
                {field.help_text && (
                  <p className="text-xs text-muted-foreground mb-2">{field.help_text}</p>
                )}
                {renderField(field)}
              </div>
            ))}

            {fields.length > 0 && (
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Share The Link
        </p>
      </div>
    </div>
  );
};

export default PublicForm;
