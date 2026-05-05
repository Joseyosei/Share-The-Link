import { useState, useEffect } from "react";
import { Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const DEADLINE = new Date("2026-06-01T00:00:00Z");

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = DEADLINE.getTime() - Date.now();
    return diff > 0 ? diff : 0;
  });

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      const diff = DEADLINE.getTime() - Date.now();
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return { days, hours, minutes, seconds, expired: timeLeft <= 0 };
}

interface SocialAuthButtonsProps {
  type: "signup" | "login";
}

export const SocialAuthButtons = ({ type }: SocialAuthButtonsProps) => {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState("");
  const countdown = useCountdown();

  const handleOAuth = async (provider: "google" | "apple") => {
    setLoadingProvider(provider);
    setError("");
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "OAuth failed";
      setError(message);
      setLoadingProvider(null);
    }
  };

  const label = type === "signup" ? "Sign Up" : "Continue";

  return (
    <>
      {error && (
        <div className="mb-3 p-3 bg-destructive/10 text-destructive rounded-xl text-sm text-center">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {/* Google OAuth */}
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={!!loadingProvider}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-background border-2 border-border rounded-xl font-semibold text-foreground hover:bg-muted/50 hover:border-muted-foreground/30 transition-all disabled:opacity-50"
        >
          {loadingProvider === "google" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {label} with Google
        </button>

        {/* Apple OAuth */}
        <button
          type="button"
          onClick={() => handleOAuth("apple")}
          disabled={!!loadingProvider}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-foreground text-background rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loadingProvider === "apple" ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
          )}
          {label} with Apple
        </button>

        {/* Countdown timer - inline below buttons */}
        {!countdown.expired && (
          <div className="flex items-center justify-center gap-2 pt-1 pb-1">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {type === "signup" ? "Early access closes in" : "Offer ends in"}
            </span>
            <span className="text-xs font-bold text-foreground tabular-nums">
              {countdown.days}d {String(countdown.hours).padStart(2, "0")}h {String(countdown.minutes).padStart(2, "0")}m {String(countdown.seconds).padStart(2, "0")}s
            </span>
          </div>
        )}
      </div>

      {/* OR Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-card text-muted-foreground">OR</span>
        </div>
      </div>
    </>
  );
};
