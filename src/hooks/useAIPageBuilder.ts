import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GeneratedPage {
  bio: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    accent: string;
  };
  layout: "minimal" | "bold" | "elegant" | "playful" | "professional";
  font: string;
  ctas: Array<{
    title: string;
    url: string;
    type: "primary" | "secondary";
  }>;
  suggestions?: string[];
}

export interface AIGeneration {
  id: string;
  user_id: string;
  business_description: string;
  generated_bio: string | null;
  generated_colors: GeneratedPage["colors"] | null;
  generated_layout: string | null;
  generated_ctas: GeneratedPage["ctas"] | null;
  generated_font: string | null;
  applied: boolean;
  applied_at: string | null;
  created_at: string;
}

export const useAIPageBuilder = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [generatedPage, setGeneratedPage] = useState<GeneratedPage | null>(null);
  const [generationHistory, setGenerationHistory] = useState<AIGeneration[]>([]);

  // Generate page design
  const generatePage = async (businessDescription: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("ai-page-builder", {
        body: { businessDescription },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setGeneratedPage(data.generation as GeneratedPage);

      toast({
        title: "Page generated! ✨",
        description: "Preview your new design below.",
      });

      return data.generation as GeneratedPage;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to generate page";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Apply generated design to profile
  const applyDesign = async (generation: GeneratedPage) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Update profile bio
      if (generation.bio) {
        await supabase
          .from("profiles")
          .update({ bio: generation.bio })
          .eq("user_id", user.id);
      }

      // Update appearance settings
      if (generation.colors) {
        await supabase
          .from("appearance_settings")
          .update({
            background_color: generation.colors.background,
            button_color: generation.colors.primary,
            title_color: generation.colors.text,
            bio_color: generation.colors.secondary,
            font_family: generation.font || "Inter",
            theme: generation.layout || "default",
          })
          .eq("user_id", user.id);
      }

      // Add generated CTAs as links
      if (generation.ctas && generation.ctas.length > 0) {
        const links = generation.ctas.map((cta, index) => ({
          user_id: user.id,
          title: cta.title,
          url: cta.url.startsWith("http") ? cta.url : `https://${cta.url}`,
          type: cta.type === "primary" ? "standard" : "standard",
          position: index,
        }));

        await supabase.from("links").insert(links);
      }

      toast({
        title: "Design applied! 🎨",
        description: "Your profile has been updated.",
      });

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to apply design";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      throw error;
    }
  };

  // Fetch generation history
  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("ai_generations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setGenerationHistory((data || []) as AIGeneration[]);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  return {
    loading,
    generatedPage,
    generationHistory,
    generatePage,
    applyDesign,
    fetchHistory,
    setGeneratedPage,
  };
};
