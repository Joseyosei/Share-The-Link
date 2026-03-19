import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * This hook bridges Clerk authentication with Supabase profiles.
 * When a user signs in with Clerk, it ensures their profile exists in Supabase.
 */
export const useClerkSupabase = () => {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth();
  const [isProfileSynced, setIsProfileSynced] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const syncProfile = async () => {
      if (!isUserLoaded || !isAuthLoaded || !isSignedIn || !user) {
        setIsProfileSynced(false);
        return;
      }

      try {
        // Check if profile exists for this Clerk user ID
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("id, user_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error checking profile:", fetchError);
          setSyncError(fetchError.message);
          return;
        }

        if (!existingProfile) {
          // Get username from Clerk metadata or generate one
          const username = (user.unsafeMetadata?.username as string) || 
                          user.primaryEmailAddress?.emailAddress?.split("@")[0]?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
                          `user${Date.now()}`;

          // Create profile for new Clerk user
          const { error: insertError } = await supabase
            .from("profiles")
            .insert({
              user_id: user.id,
              full_name: (user.unsafeMetadata?.full_name as string) || user.fullName || null,
              username,
              avatar_url: user.imageUrl || null,
            });

          if (insertError) {
            console.error("Error creating profile:", insertError);
            // Check if username is already taken
            if (insertError.message.includes("unique") || insertError.message.includes("duplicate")) {
              // Try with a random suffix
              const uniqueUsername = `${username}${Math.floor(Math.random() * 10000)}`;
              const { error: retryError } = await supabase
                .from("profiles")
                .insert({
                  user_id: user.id,
                  full_name: (user.unsafeMetadata?.full_name as string) || user.fullName || null,
                  username: uniqueUsername,
                  avatar_url: user.imageUrl || null,
                });
              
              if (retryError) {
                setSyncError(retryError.message);
                return;
              }
            } else {
              setSyncError(insertError.message);
              return;
            }
          }
        } else {
          // Optionally update existing profile with latest Clerk data
          // Only update if avatar changed
          if (user.imageUrl && user.imageUrl !== existingProfile.user_id) {
            await supabase
              .from("profiles")
              .update({ avatar_url: user.imageUrl })
              .eq("user_id", user.id);
          }
        }

        setIsProfileSynced(true);
        setSyncError(null);
      } catch (err) {
        console.error("Sync error:", err);
        setSyncError(err instanceof Error ? err.message : "Failed to sync profile");
      }
    };

    syncProfile();
  }, [user, isUserLoaded, isAuthLoaded, isSignedIn]);

  return { 
    isProfileSynced, 
    syncError, 
    clerkUserId: user?.id || null,
    isReady: isUserLoaded && isAuthLoaded && (isSignedIn ? isProfileSynced : true)
  };
};
