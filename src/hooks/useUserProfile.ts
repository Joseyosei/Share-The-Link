import { useEffect, useState, useCallback } from "react";
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
        setProfile(null);
        setLoading(false);
        return;
      }

      // First check if profile exists
      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError && profileError.code !== "PGRST116") {
        throw profileError;
      }

      if (data) {
        setProfile({
          id: data.id,
          user_id: data.user_id,
          full_name: data.full_name,
          username: data.username,
          bio: data.bio,
          avatar_url: data.avatar_url,
          social_links: (data.social_links as Record<string, string> | null) ?? null,
          email: user.email,
        });
      } else {
        // Profile doesn't exist yet, create it
        const username = user.user_metadata?.username || 
                        user.email?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
                        `user${Date.now()}`;

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            full_name: user.user_metadata?.full_name || null,
            username,
            avatar_url: user.user_metadata?.avatar_url || null,
          })
          .select()
          .single();

        if (insertError) {
          // If username conflict, try with random suffix
          if (insertError.message.includes("unique") || insertError.message.includes("duplicate")) {
            const uniqueUsername = `${username}${Math.floor(Math.random() * 10000)}`;
            const { data: retryProfile, error: retryError } = await supabase
              .from("profiles")
              .insert({
                user_id: user.id,
                full_name: user.user_metadata?.full_name || null,
                username: uniqueUsername,
                avatar_url: user.user_metadata?.avatar_url || null,
              })
              .select()
              .single();

            if (retryError) throw retryError;
            
            if (retryProfile) {
              setProfile({
                id: retryProfile.id,
                user_id: retryProfile.user_id,
                full_name: retryProfile.full_name,
                username: retryProfile.username,
                bio: retryProfile.bio,
                avatar_url: retryProfile.avatar_url,
                social_links: null,
                email: user.email,
              });
            }
          } else {
            throw insertError;
          }
        } else if (newProfile) {
          setProfile({
            id: newProfile.id,
            user_id: newProfile.user_id,
            full_name: newProfile.full_name,
            username: newProfile.username,
            bio: newProfile.bio,
            avatar_url: newProfile.avatar_url,
            social_links: null,
            email: user.email,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching/creating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};
