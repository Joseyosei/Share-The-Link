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

  // Very strict rate limit: 2 req/min
  if (isRateLimited(getClientIp(req), 2)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  const userId = auth.userId;

  try {
    // Use service role for elevated permissions
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Delete all user data from every table in the correct order
    // (child tables first to avoid FK constraint issues)

    // 1. Delete stream-related data
    // First get all stream IDs for this user
    const { data: userStreams } = await supabase
      .from("streams")
      .select("id")
      .eq("user_id", userId);
    
    const streamIds = (userStreams || []).map((s: any) => s.id);
    
    if (streamIds.length > 0) {
      // Delete chat messages for user's streams
      await supabase.from("stream_chat").delete().in("stream_id", streamIds);
      // Delete tips for user's streams
      await supabase.from("stream_tips").delete().in("stream_id", streamIds);
      // Delete viewers for user's streams
      await supabase.from("stream_viewers").delete().in("stream_id", streamIds);
      // Delete recordings for user's streams
      await supabase.from("stream_recordings").delete().in("stream_id", streamIds);
    }

    // Also delete chat messages sent BY this user (in other streams)
    await supabase.from("stream_chat").delete().eq("user_id", userId);
    // Delete tips sent BY this user
    await supabase.from("stream_tips").delete().eq("tipper_id", userId);
    // Delete viewer records for this user
    await supabase.from("stream_viewers").delete().eq("viewer_id", userId);
    // Delete stream recordings owned by user
    await supabase.from("stream_recordings").delete().eq("user_id", userId);
    // Delete streams
    await supabase.from("streams").delete().eq("user_id", userId);

    // 2. Delete connect/shop data
    // Get connected accounts to find products
    const { data: connectedAccounts } = await supabase
      .from("connected_accounts")
      .select("id")
      .eq("user_id", userId);
    
    const accountIds = (connectedAccounts || []).map((a: any) => a.id);
    if (accountIds.length > 0) {
      await supabase.from("connect_products").delete().in("connected_account_id", accountIds);
    }
    await supabase.from("connected_accounts").delete().eq("user_id", userId);
    await supabase.from("user_products").delete().eq("user_id", userId);

    // 3. Delete analytics and events
    await supabase.from("analytics_events").delete().eq("user_id", userId);

    // 4. Delete links and auto-share
    await supabase.from("auto_share_links").delete().eq("user_id", userId);
    await supabase.from("links").delete().eq("user_id", userId);

    // 5. Delete AI generations
    await supabase.from("ai_generations").delete().eq("user_id", userId);

    // 6. Delete integrations
    await supabase.from("user_integrations").delete().eq("user_id", userId);

    // 7. Delete subscription data
    await supabase.from("user_subscriptions").delete().eq("user_id", userId);

    // 8. Delete earnings
    await supabase.from("earnings").delete().eq("user_id", userId);

    // 9. Delete appearance settings
    await supabase.from("appearance_settings").delete().eq("user_id", userId);

    // 10. Delete admin user entry if exists
    await supabase.from("admin_users").delete().eq("user_id", userId);

    // 11. Delete profile (this is the main user profile)
    await supabase.from("profiles").delete().eq("user_id", userId);

    // 12. Delete storage files (avatar and recordings)
    try {
      const { data: avatarFiles } = await supabase.storage
        .from("avatars")
        .list(userId);
      if (avatarFiles && avatarFiles.length > 0) {
        await supabase.storage
          .from("avatars")
          .remove(avatarFiles.map((f: any) => `${userId}/${f.name}`));
      }
    } catch {
      // Bucket may not exist, that's ok
    }

    try {
      const { data: recordingFiles } = await supabase.storage
        .from("stream-recordings")
        .list(userId);
      if (recordingFiles && recordingFiles.length > 0) {
        await supabase.storage
          .from("stream-recordings")
          .remove(recordingFiles.map((f: any) => `${userId}/${f.name}`));
      }
    } catch {
      // Bucket may not exist, that's ok
    }

    // 13. Finally, delete the auth user (this is permanent!)
    const { error: deleteError } = await (supabase.auth as any).admin.deleteUser(userId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return res.status(500).json({ error: "Failed to delete auth account. Data has been removed." });
    }

    return res.status(200).json({ success: true, message: "Account and all data permanently deleted." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("delete-account error:", message);
    return res.status(500).json({ error: message });
  }
}
