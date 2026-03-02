import { supabase } from "@/integrations/supabase/client";

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the user's Supabase JWT as a Bearer token.
 * Falls back to a normal fetch if no session exists (for public endpoints like track-event).
 */
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set("Authorization", `Bearer ${session.access_token}`);
    }
  } catch {
    // No session available -- proceed without auth header
  }

  return fetch(url, { ...options, headers });
}
