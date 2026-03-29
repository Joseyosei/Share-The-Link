import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type AppearanceSettings = Tables<"appearance_settings">;

export const useAppearanceSettings = () => {
  const [settings, setSettings] = useState<AppearanceSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("appearance_settings")
          .select("*")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching appearance settings:", error);
          setError(error.message);
        } else {
          setSettings(data);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("Failed to fetch appearance settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (updates: Partial<AppearanceSettings>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Known base columns that always exist in the table
      const baseColumns = new Set([
        "theme", "background_type", "background_gradient", "background_color",
        "font_family", "title_color", "bio_color", "button_style", "button_color",
      ]);

      // Split updates into base (safe) and extended (may not exist yet)
      const baseUpdates: Record<string, unknown> = {};
      const extendedUpdates: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(updates)) {
        if (baseColumns.has(key)) {
          baseUpdates[key] = value;
        } else {
          extendedUpdates[key] = value;
        }
      }

      // Check if settings exist
      const { data: existing } = await supabase
        .from("appearance_settings")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Try saving all updates first (works if migrations are applied)
      const allUpdates = { ...updates, updated_at: new Date().toISOString() };

      if (existing) {
        const { data, error } = await supabase
          .from("appearance_settings")
          .update(allUpdates as any)
          .eq("user_id", session.user.id)
          .select()
          .single();

        if (error) {
          // If error contains "column" - a column doesn't exist, try base columns only
          if (error.message?.includes("column") && Object.keys(baseUpdates).length > 0) {
            console.warn("Some columns may not exist yet, saving base settings only:", error.message);
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("appearance_settings")
              .update({ ...baseUpdates, updated_at: new Date().toISOString() } as any)
              .eq("user_id", session.user.id)
              .select()
              .single();
            if (fallbackError) throw fallbackError;
            setSettings(fallbackData);
            return fallbackData;
          }
          throw error;
        }
        setSettings(data);
        return data;
      } else {
        const { data, error } = await supabase
          .from("appearance_settings")
          .insert({ user_id: session.user.id, ...allUpdates } as any)
          .select()
          .single();

        if (error) {
          // Fallback to base columns only
          if (error.message?.includes("column") && Object.keys(baseUpdates).length > 0) {
            console.warn("Some columns may not exist yet, saving base settings only:", error.message);
            const { data: fallbackData, error: fallbackError } = await supabase
              .from("appearance_settings")
              .insert({ user_id: session.user.id, ...baseUpdates } as any)
              .select()
              .single();
            if (fallbackError) throw fallbackError;
            setSettings(fallbackData);
            return fallbackData;
          }
          throw error;
        }
        setSettings(data);
        return data;
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      throw err;
    }
  };

  return { settings, loading, error, updateSettings };
};
