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

      // Check if settings exist
      const { data: existing } = await supabase
        .from("appearance_settings")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await supabase
          .from("appearance_settings")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("user_id", session.user.id)
          .select()
          .single();

        if (error) throw error;
        setSettings(data);
        return data;
      } else {
        // Create new
        const { data, error } = await supabase
          .from("appearance_settings")
          .insert({ user_id: session.user.id, ...updates })
          .select()
          .single();

        if (error) throw error;
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
