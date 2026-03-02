import { createClient } from "@supabase/supabase-js";
import type { VercelRequest } from "@vercel/node";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Server-side auth verification.
 * Extracts the JWT from the Authorization header and verifies it with Supabase.
 * NEVER trust userId/email from req.body -- always use this verified identity.
 */
export async function verifyAuth(req: VercelRequest): Promise<{
  userId: string;
  email: string;
} | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token || token.length < 10) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return null;
    }

    return {
      userId: data.user.id,
      email: data.user.email || "",
    };
  } catch {
    return null;
  }
}

/**
 * Helper to return a 401 Unauthorized response.
 */
export function unauthorized(res: any) {
  return res.status(401).json({ error: "Unauthorized. Please sign in." });
}
