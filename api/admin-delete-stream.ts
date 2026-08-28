import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "./_lib/cors.js";
import { verifyAuth, unauthorized } from "./_lib/auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (isRateLimited(getClientIp(req), 10)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", auth.userId)
    .single();

  if (!adminRow) {
    return res.status(403).json({ error: "Forbidden. Admin access required." });
  }

  const { streamId } = req.body || {};
  if (!streamId || typeof streamId !== "string") {
    return res.status(400).json({ error: "streamId is required." });
  }

  try {
    // Delete child records first
    await supabase.from("stream_chat").delete().eq("stream_id", streamId);
    await supabase.from("stream_tips").delete().eq("stream_id", streamId);
    await supabase.from("stream_viewers").delete().eq("stream_id", streamId);
    await supabase.from("stream_recordings").delete().eq("stream_id", streamId);

    // Delete the stream itself
    const { error } = await supabase.from("streams").delete().eq("id", streamId);
    if (error) throw error;

    return res.status(200).json({ success: true, message: "Stream deleted successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-delete-stream error:", message);
    return res.status(500).json({ error: message });
  }
}
