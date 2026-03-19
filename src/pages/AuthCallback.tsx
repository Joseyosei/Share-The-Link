import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from URL parameters (PKCE flow)
        const code = searchParams.get("code");
        const errorParam = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Handle OAuth error from provider
        if (errorParam) {
          throw new Error(errorDescription || errorParam);
        }

        // If there's a code, exchange it for a session (PKCE flow)
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        // Now get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          // Check if the user already has a profile
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", session.user.id)
            .maybeSingle();

          if (!profile) {
            // Create a profile for OAuth users who don't have one yet
            const metadata = session.user.user_metadata;
            const emailPrefix = session.user.email?.split("@")[0] || "";
            const baseUsername = (metadata?.preferred_username || metadata?.user_name || emailPrefix)
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "")
              .slice(0, 20);

            // Make username unique by appending random chars if needed
            let username = baseUsername || `user${Date.now().toString(36)}`;
            const { data: existing } = await supabase
              .from("profiles")
              .select("username")
              .eq("username", username)
              .maybeSingle();

            if (existing) {
              username = `${baseUsername}${Math.random().toString(36).slice(2, 6)}`;
            }

            await supabase.from("profiles").insert({
              user_id: session.user.id,
              username,
              full_name: metadata?.full_name || metadata?.name || "",
              avatar_url: metadata?.avatar_url || metadata?.picture || "",
              bio: "",
            });
          }

          window.location.href = "/dashboard";
        } else {
          // No session and no code - authentication failed
          setError("Authentication failed. Please try again.");
        }
      } catch (err) {
        console.error("Auth callback error:", err);
        const message = err instanceof Error ? err.message : "Authentication failed. Please try again.";
        setError(message);
      }
    };

    handleCallback();
  }, [navigate, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center p-6">
        <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Error</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 gradient-button text-primary-foreground rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-primary-foreground animate-spin mx-auto mb-4" />
        <p className="text-primary-foreground text-lg font-medium">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
