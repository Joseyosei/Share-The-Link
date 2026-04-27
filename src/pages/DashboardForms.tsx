import { useState, useEffect } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileSidebar } from "@/components/dashboard/MobileSidebar";
import {
  Plus, Trash2, GripVertical, Eye, Copy, ExternalLink, BarChart3,
  FileText, Mail, Phone, MapPin, Globe, Hash, Calendar, Upload, Type,
  AlignLeft, CheckSquare, List, ChevronDown, ToggleLeft, Star, Loader2,
  Briefcase, GraduationCap, Ticket, DollarSign, Users, Send, Settings2,
  ArrowLeft, Save, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// ── Field type definitions ──────────────────────────────────
const FIELD_CATEGORIES = [
  {
    name: "Contact Info",
    fields: [
      { type: "email", label: "Email", icon: Mail, description: "Email address field" },
      { type: "phone", label: "Phone Number", icon: Phone, description: "Phone number input" },
      { type: "name", label: "Full Name", icon: Users, description: "First and last name" },
      { type: "address", label: "Address", icon: MapPin, description: "Physical address" },
      { type: "website", label: "Website", icon: Globe, description: "URL / website link" },
    ],
  },
  {
    name: "Text & Content",
    fields: [
      { type: "short_text", label: "Short Text", icon: Type, description: "Single line text input" },
      { type: "long_text", label: "Long Text", icon: AlignLeft, description: "Multi-line paragraph" },
      { type: "number", label: "Number", icon: Hash, description: "Numeric input" },
    ],
  },
  {
    name: "Choice",
    fields: [
      { type: "multiple_choice", label: "Multiple Choice", icon: List, description: "Select one from options" },
      { type: "checkbox", label: "Checkbox", icon: CheckSquare, description: "Select multiple options" },
      { type: "dropdown", label: "Dropdown", icon: ChevronDown, description: "Dropdown select menu" },
      { type: "yes_no", label: "Yes / No", icon: ToggleLeft, description: "Simple yes or no toggle" },
    ],
  },
  {
    name: "Rating & Ranking",
    fields: [
      { type: "rating", label: "Rating", icon: Star, description: "Star rating (1-5)" },
      { type: "opinion_scale", label: "Opinion Scale", icon: BarChart3, description: "Scale from 1-10" },
    ],
  },
  {
    name: "Other",
    fields: [
      { type: "date", label: "Date", icon: Calendar, description: "Date picker" },
      { type: "file_upload", label: "File Upload", icon: Upload, description: "Allow file attachments" },
      { type: "payment", label: "Payment", icon: DollarSign, description: "Collect payment amount" },
      { type: "statement", label: "Statement", icon: FileText, description: "Display text (no input)" },
    ],
  },
];

const FORM_TEMPLATES = [
  {
    id: "business_feedback",
    name: "Business Feedback",
    icon: Briefcase,
    description: "Collect customer feedback and improve your business",
    category: "business",
    fields: [
      { field_type: "name", label: "Your Name", is_required: true },
      { field_type: "email", label: "Email Address", is_required: true },
      { field_type: "rating", label: "Overall Satisfaction", is_required: true },
      { field_type: "multiple_choice", label: "How did you find us?", options: ["Social Media", "Search Engine", "Referral", "Advertisement", "Other"] },
      { field_type: "long_text", label: "What could we improve?", placeholder: "Share your thoughts..." },
    ],
  },
  {
    id: "event_registration",
    name: "Event Registration",
    icon: Ticket,
    description: "Register attendees for events, workshops, or webinars",
    category: "events",
    fields: [
      { field_type: "name", label: "Full Name", is_required: true },
      { field_type: "email", label: "Email", is_required: true },
      { field_type: "phone", label: "Phone Number" },
      { field_type: "dropdown", label: "Ticket Type", options: ["General Admission", "VIP", "Student"], is_required: true },
      { field_type: "number", label: "Number of Guests" },
      { field_type: "long_text", label: "Dietary Requirements / Accessibility Needs" },
    ],
  },
  {
    id: "academic_survey",
    name: "Academic Research",
    icon: GraduationCap,
    description: "Gather data for research papers, studies, and surveys",
    category: "academic",
    fields: [
      { field_type: "statement", label: "Thank you for participating in this research study. Your responses are anonymous and confidential." },
      { field_type: "dropdown", label: "Age Range", options: ["18-24", "25-34", "35-44", "45-54", "55+"], is_required: true },
      { field_type: "multiple_choice", label: "Education Level", options: ["High School", "Bachelor's", "Master's", "Doctorate", "Other"], is_required: true },
      { field_type: "opinion_scale", label: "How strongly do you agree with the following statement?" },
      { field_type: "long_text", label: "Please elaborate on your response" },
    ],
  },
  {
    id: "payment_invoice",
    name: "Payment / Invoice",
    icon: DollarSign,
    description: "Collect payments, deposits, or invoice details",
    category: "payments",
    fields: [
      { field_type: "name", label: "Full Name", is_required: true },
      { field_type: "email", label: "Email Address", is_required: true },
      { field_type: "short_text", label: "Company / Organization" },
      { field_type: "dropdown", label: "Service", options: ["Consultation", "Design Package", "Development", "Marketing", "Custom"], is_required: true },
      { field_type: "payment", label: "Payment Amount", is_required: true },
      { field_type: "long_text", label: "Additional Notes" },
    ],
  },
  {
    id: "contact_form",
    name: "Contact Form",
    icon: Send,
    description: "Simple contact form for your website or profile",
    category: "general",
    fields: [
      { field_type: "name", label: "Your Name", is_required: true },
      { field_type: "email", label: "Email", is_required: true },
      { field_type: "short_text", label: "Subject", is_required: true },
      { field_type: "long_text", label: "Message", is_required: true, placeholder: "How can we help?" },
    ],
  },
  {
    id: "blank",
    name: "Blank Form",
    icon: FileText,
    description: "Start from scratch and build your own custom form",
    category: "general",
    fields: [],
  },
];

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

interface Form {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  is_active: boolean;
  thank_you_message: string;
  created_at: string;
  updated_at: string;
  _count?: number;
}

const DashboardForms = () => {
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "builder" | "responses">("list");
  const [editingForm, setEditingForm] = useState<Form | null>(null);
  const [fields, setFields] = useState<FormField[]>([]);
  const [saving, setSaving] = useState(false);
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [fieldSearch, setFieldSearch] = useState("");
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // ── Load forms ──
  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("forms")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (!error && data) {
      // Get submission counts
      const formsWithCounts = await Promise.all(
        data.map(async (form: any) => {
          const { count } = await supabase
            .from("form_submissions")
            .select("id", { count: "exact", head: true })
            .eq("form_id", form.id);
          return { ...form, _count: count || 0 };
        })
      );
      setForms(formsWithCounts);
    }
    setLoading(false);
  };

  // ── Create from template ──
  const createFromTemplate = async (template: typeof FORM_TEMPLATES[0]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: form, error } = await supabase
      .from("forms")
      .insert({
        user_id: user.id,
        title: template.id === "blank" ? "Untitled Form" : template.name,
        description: template.description,
        category: template.category,
        status: "draft",
      })
      .select()
      .single();

    if (error || !form) {
      console.error("Form creation error:", error);
      toast({ title: "Error", description: error?.message || "Failed to create form", variant: "destructive" });
      return;
    }

    // Add template fields
    if (template.fields.length > 0) {
      const fieldsToInsert = template.fields.map((f, i) => ({
        form_id: form.id,
        field_type: f.field_type,
        label: f.label,
        placeholder: (f as any).placeholder || null,
        is_required: f.is_required || false,
        options: (f as any).options || [],
        position: i,
      }));
      await supabase.from("form_fields").insert(fieldsToInsert);
    }

    toast({ title: "Form created!", description: `"${form.title}" is ready to edit.` });
    openFormBuilder(form);
  };

  // ── Open form builder ──
  const openFormBuilder = async (form: any) => {
    setEditingForm(form);
    setView("builder");

    const { data } = await supabase
      .from("form_fields")
      .select("*")
      .eq("form_id", form.id)
      .order("position", { ascending: true });

    if (data) {
      setFields(
        data.map((f: any) => ({
          ...f,
          options: typeof f.options === "string" ? JSON.parse(f.options) : (f.options || []),
        }))
      );
    }
  };

  // ── Add field ──
  const addField = (fieldType: string, label: string) => {
    const newField: FormField = {
      id: `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      field_type: fieldType,
      label,
      placeholder: "",
      help_text: "",
      is_required: false,
      options: fieldType === "multiple_choice" || fieldType === "checkbox" || fieldType === "dropdown"
        ? ["Option 1", "Option 2"]
        : [],
      position: fields.length,
    };
    setFields([...fields, newField]);
    setShowFieldPicker(false);
  };

  // ── Remove field ──
  const removeField = (idx: number) => {
    setFields(fields.filter((_, i) => i !== idx));
  };

  // ── Update field ──
  const updateField = (idx: number, updates: Partial<FormField>) => {
    setFields(fields.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  // ── Save form ──
  const saveForm = async () => {
    if (!editingForm) return;
    setSaving(true);
    try {
      // Update form metadata
      await supabase
        .from("forms")
        .update({
          title: editingForm.title,
          description: editingForm.description,
          category: editingForm.category,
          thank_you_message: editingForm.thank_you_message,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingForm.id);

      // Delete old fields and re-insert
      await supabase.from("form_fields").delete().eq("form_id", editingForm.id);

      if (fields.length > 0) {
        const fieldsToInsert = fields.map((f, i) => ({
          form_id: editingForm.id,
          field_type: f.field_type,
          label: f.label,
          placeholder: f.placeholder || null,
          help_text: f.help_text || null,
          is_required: f.is_required,
          options: f.options || [],
          position: i,
        }));
        await supabase.from("form_fields").insert(fieldsToInsert);
      }

      toast({ title: "Saved!", description: "Form updated successfully." });
    } catch {
      toast({ title: "Error", description: "Failed to save form.", variant: "destructive" });
    }
    setSaving(false);
  };

  // ── Publish / unpublish ──
  const togglePublish = async () => {
    if (!editingForm) return;
    const newStatus = editingForm.status === "published" ? "draft" : "published";
    await supabase.from("forms").update({ status: newStatus }).eq("id", editingForm.id);
    setEditingForm({ ...editingForm, status: newStatus });
    toast({
      title: newStatus === "published" ? "Published!" : "Unpublished",
      description: newStatus === "published"
        ? "Your form is now live and accepting responses."
        : "Form is now in draft mode.",
    });
  };

  // ── Delete form ──
  const deleteForm = async (formId: string) => {
    await supabase.from("forms").delete().eq("id", formId);
    setForms(forms.filter((f) => f.id !== formId));
    toast({ title: "Deleted", description: "Form has been removed." });
  };

  // ── View submissions ──
  const viewSubmissions = async (form: Form) => {
    setEditingForm(form);
    setView("responses");
    setLoadingSubs(true);
    const { data } = await supabase
      .from("form_submissions")
      .select("*")
      .eq("form_id", form.id)
      .order("created_at", { ascending: false });
    setSubmissions(data || []);
    setLoadingSubs(false);
  };

  // ── Copy share link ──
  const copyShareLink = (formId: string) => {
    const url = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Copied!", description: "Form link copied to clipboard." });
  };

  // ── Move field up/down ──
  const moveField = (idx: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newFields.length) return;
    [newFields[idx], newFields[swapIdx]] = [newFields[swapIdx], newFields[idx]];
    setFields(newFields);
  };

  // ── Get icon for field type ──
  const getFieldIcon = (type: string) => {
    for (const cat of FIELD_CATEGORIES) {
      const found = cat.fields.find((f) => f.type === type);
      if (found) return found.icon;
    }
    return Type;
  };

  // ── Filter fields by search ──
  const filteredCategories = FIELD_CATEGORIES.map((cat) => ({
    ...cat,
    fields: cat.fields.filter(
      (f) =>
        f.label.toLowerCase().includes(fieldSearch.toLowerCase()) ||
        f.type.toLowerCase().includes(fieldSearch.toLowerCase())
    ),
  })).filter((cat) => cat.fields.length > 0);

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background liquid-glass-muted">
      <Sidebar />
      <MobileSidebar />

      <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {/* ── LIST VIEW ── */}
          {view === "list" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-2xl font-bold">Form Builder</h1>
                  <p className="text-muted-foreground mt-1">
                    Create forms for your business, events, research, or payments
                  </p>
                </div>
              </div>

              {/* Templates */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Start with a Template</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose a template that fits your needs, or start from scratch. We recommend
                  <strong> Business Feedback</strong> for customer surveys,
                  <strong> Event Registration</strong> for events/webinars,
                  <strong> Academic Research</strong> for studies, and
                  <strong> Payment / Invoice</strong> for collecting payments.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {FORM_TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => createFromTemplate(template)}
                        className="text-left p-5 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all group bg-card"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{template.name}</h3>
                            <span className="text-xs text-muted-foreground capitalize">{template.category}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        {template.fields.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-2">{template.fields.length} fields included</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Existing forms */}
              <div>
                <h2 className="text-lg font-semibold mb-4">Your Forms</h2>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : forms.length === 0 ? (
                  <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No forms yet. Pick a template above to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {forms.map((form) => (
                      <div
                        key={form.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">{form.title}</h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                form.status === "published"
                                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              }`}
                            >
                              {form.status === "published" ? "Live" : "Draft"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {form._count || 0} responses &middot; {form.category} &middot; Updated{" "}
                            {new Date(form.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="outline" size="sm" onClick={() => openFormBuilder(form)}>
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => viewSubmissions(form)}>
                            <BarChart3 className="w-4 h-4 mr-1" /> Responses
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => copyShareLink(form.id)}>
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteForm(form.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── BUILDER VIEW ── */}
          {view === "builder" && editingForm && (
            <>
              {/* Builder header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={() => { setView("list"); loadForms(); }}>
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <div>
                    <input
                      type="text"
                      value={editingForm.title}
                      onChange={(e) => setEditingForm({ ...editingForm, title: e.target.value })}
                      className="text-xl font-bold bg-transparent border-none outline-none focus:ring-0 w-full"
                      placeholder="Form title..."
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyShareLink(editingForm.id)}>
                    <Share2 className="w-4 h-4 mr-1" /> Share
                  </Button>
                  <Button
                    variant={editingForm.status === "published" ? "outline" : "default"}
                    size="sm"
                    onClick={togglePublish}
                  >
                    {editingForm.status === "published" ? (
                      <>Unpublish</>
                    ) : (
                      <><Eye className="w-4 h-4 mr-1" /> Publish</>
                    )}
                  </Button>
                  <Button size="sm" onClick={saveForm} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                    Save
                  </Button>
                </div>
              </div>

              {/* Form settings row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
                  <Input
                    value={editingForm.description || ""}
                    onChange={(e) => setEditingForm({ ...editingForm, description: e.target.value })}
                    placeholder="Brief description..."
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                  <select
                    value={editingForm.category}
                    onChange={(e) => setEditingForm({ ...editingForm, category: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="general">General</option>
                    <option value="business">Business</option>
                    <option value="events">Events</option>
                    <option value="academic">Academic Research</option>
                    <option value="payments">Payments / Invoice</option>
                    <option value="investment">Investment</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Thank You Message</label>
                  <Input
                    value={editingForm.thank_you_message || ""}
                    onChange={(e) => setEditingForm({ ...editingForm, thank_you_message: e.target.value })}
                    placeholder="Thank you for your submission!"
                  />
                </div>
              </div>

              {/* Fields list */}
              <div className="space-y-3 mb-6">
                {fields.length === 0 && (
                  <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
                    <Type className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground mb-2">No fields yet</p>
                    <p className="text-sm text-muted-foreground">Click "Add Field" below to start building your form</p>
                  </div>
                )}

                {fields.map((field, idx) => {
                  const FieldIcon = getFieldIcon(field.field_type);
                  return (
                    <div
                      key={field.id}
                      className="p-4 rounded-xl border border-border bg-card hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-1 pt-1">
                          <button
                            onClick={() => moveField(idx, "up")}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            disabled={idx === 0}
                          >
                            <GripVertical className="w-4 h-4 rotate-180" />
                          </button>
                          <span className="text-xs text-muted-foreground font-mono">{idx + 1}</span>
                          <button
                            onClick={() => moveField(idx, "down")}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            disabled={idx === fields.length - 1}
                          >
                            <GripVertical className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <FieldIcon className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-xs font-medium text-primary uppercase tracking-wide">
                              {field.field_type.replace("_", " ")}
                            </span>
                            {field.is_required && (
                              <span className="text-xs text-red-500 font-medium">Required</span>
                            )}
                          </div>

                          <Input
                            value={field.label}
                            onChange={(e) => updateField(idx, { label: e.target.value })}
                            placeholder="Field label..."
                            className="mb-2 font-medium"
                          />

                          {field.field_type !== "statement" && (
                            <Input
                              value={field.placeholder || ""}
                              onChange={(e) => updateField(idx, { placeholder: e.target.value })}
                              placeholder="Placeholder text (optional)"
                              className="text-sm mb-2"
                            />
                          )}

                          {/* Options for choice-type fields */}
                          {(field.field_type === "multiple_choice" ||
                            field.field_type === "checkbox" ||
                            field.field_type === "dropdown") && (
                            <div className="mt-2 space-y-2">
                              <label className="text-xs font-medium text-muted-foreground">Options</label>
                              {field.options.map((opt, optIdx) => (
                                <div key={optIdx} className="flex items-center gap-2">
                                  <Input
                                    value={opt}
                                    onChange={(e) => {
                                      const newOpts = [...field.options];
                                      newOpts[optIdx] = e.target.value;
                                      updateField(idx, { options: newOpts });
                                    }}
                                    placeholder={`Option ${optIdx + 1}`}
                                    className="text-sm"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      updateField(idx, {
                                        options: field.options.filter((_, i) => i !== optIdx),
                                      });
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  updateField(idx, {
                                    options: [...field.options, `Option ${field.options.length + 1}`],
                                  })
                                }
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add Option
                              </Button>
                            </div>
                          )}

                          <div className="flex items-center gap-4 mt-3">
                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={field.is_required}
                                onChange={(e) => updateField(idx, { is_required: e.target.checked })}
                                className="rounded border-input"
                              />
                              Required
                            </label>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => removeField(idx)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add field button + picker */}
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={() => setShowFieldPicker(!showFieldPicker)}
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Field
                </Button>

                {showFieldPicker && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-xl shadow-lg p-4 max-h-[60vh] overflow-y-auto z-50">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Add Form Element</h3>
                      <Button variant="ghost" size="sm" onClick={() => setShowFieldPicker(false)}>
                        &times;
                      </Button>
                    </div>
                    <Input
                      value={fieldSearch}
                      onChange={(e) => setFieldSearch(e.target.value)}
                      placeholder="Search form elements..."
                      className="mb-3"
                    />
                    {filteredCategories.map((cat) => (
                      <div key={cat.name} className="mb-4">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {cat.name}
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {cat.fields.map((field) => {
                            const Icon = field.icon;
                            return (
                              <button
                                key={field.type}
                                onClick={() => addField(field.type, field.label)}
                                className="flex items-center gap-2 p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-left text-sm"
                              >
                                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                                <span>{field.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── RESPONSES VIEW ── */}
          {view === "responses" && editingForm && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <Button variant="ghost" size="sm" onClick={() => { setView("list"); loadForms(); }}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <div>
                  <h1 className="text-xl font-bold">{editingForm.title} - Responses</h1>
                  <p className="text-sm text-muted-foreground">{submissions.length} total submissions</p>
                </div>
              </div>

              {loadingSubs ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No responses yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">Share your form link to start collecting responses.</p>
                  <Button variant="outline" className="mt-4" onClick={() => copyShareLink(editingForm.id)}>
                    <Copy className="w-4 h-4 mr-1" /> Copy Form Link
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {submissions.map((sub, idx) => (
                    <div key={sub.id} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium">Response #{submissions.length - idx}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {Object.entries(sub.responses || {}).map(([key, value]) => (
                          <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
                            <span className="text-sm font-medium text-muted-foreground min-w-[140px]">{key}:</span>
                            <span className="text-sm">{String(value)}</span>
                          </div>
                        ))}
                        {sub.submitter_email && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                            <Mail className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{sub.submitter_email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardForms;
