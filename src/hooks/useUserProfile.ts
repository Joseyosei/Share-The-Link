import { useEffect, useState, useCallback } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
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
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!isUserLoaded || !isAuthLoaded) {
      return;
    }

    if (!isSignedIn || !user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

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
          email: user.primaryEmailAddress?.emailAddress,
        });
      } else {
        // Profile doesn't exist yet, create it
        const username = (user.unsafeMetadata?.username as string) || 
                        user.primaryEmailAddress?.emailAddress?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
                        `user${Date.now()}`;

        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            user_id: user.id,
            full_name: (user.unsafeMetadata?.full_name as string) || user.fullName || null,
            username,
            avatar_url: user.imageUrl || null,
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
                full_name: (user.unsafeMetadata?.full_name as string) || user.fullName || null,
                username: uniqueUsername,
                avatar_url: user.imageUrl || null,
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
                email: user.primaryEmailAddress?.emailAddress,
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
            email: user.primaryEmailAddress?.emailAddress,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching/creating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  }, [user, isUserLoaded, isAuthLoaded, isSignedIn]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, refetch: fetchProfile };
};
