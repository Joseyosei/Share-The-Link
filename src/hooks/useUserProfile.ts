import { useEffect, useState } from "react";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  social_links: Record<string, string> | null;
  email?: string;
}

export const useUserProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      setProfile(data ? { ...data, social_links: (data.social_links && typeof data.social_links === 'object' && !Array.isArray(data.social_links)) ? data.social_links as Record<string, string> : null, email: user.email } : {
        id: "",
        user_id: user.id,
        full_name: user.user_metadata?.full_name || null,
        username: user.user_metadata?.username || null,
        bio: null,
        avatar_url: null,
        social_links: null,
        email: user.email,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};
