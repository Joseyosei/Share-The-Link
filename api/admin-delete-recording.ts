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

  const { recordingId } = req.body || {};
  if (!recordingId || typeof recordingId !== "string") {
    return res.status(400).json({ error: "recordingId is required." });
  }

  try {
    // Get the recording to find storage files
    const { data: recording } = await supabase
      .from("stream_recordings")
      .select("user_id")
      .eq("id", recordingId)
      .single();

    // Delete the recording record
    const { error } = await supabase.from("stream_recordings").delete().eq("id", recordingId);
    if (error) throw error;

    // Try to clean up storage files if we know the user
    if (recording?.user_id) {
      try {
        const { data: files } = await supabase.storage
          .from("stream-recordings")
          .list(`${recording.user_id}`);
        const matchingFiles = (files || []).filter((f: any) => f.name.includes(recordingId));
        if (matchingFiles.length > 0) {
          await supabase.storage
            .from("stream-recordings")
            .remove(matchingFiles.map((f: any) => `${recording.user_id}/${f.name}`));
        }
      } catch { /* storage cleanup is best-effort */ }
    }

    return res.status(200).json({ success: true, message: "Recording deleted successfully." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-delete-recording error:", message);
    return res.status(500).json({ error: message });
  }
}
