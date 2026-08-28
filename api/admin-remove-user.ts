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

  if (isRateLimited(getClientIp(req), 5)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify the caller is an admin
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("user_id", auth.userId)
    .single();

  if (!adminRow) {
    return res.status(403).json({ error: "Forbidden. Admin access required." });
  }

  const { targetUserId, reason } = req.body || {};
  if (!targetUserId || typeof targetUserId !== "string") {
    return res.status(400).json({ error: "targetUserId is required." });
  }

  // Prevent admins from deleting themselves through this endpoint
  if (targetUserId === auth.userId) {
    return res.status(400).json({ error: "Cannot remove your own account through admin panel." });
  }

  try {
    // Cascading delete in FK-dependency order (mirrors api/delete-account.ts)

    // 1. Stream-related child data
    const { data: userStreams } = await supabase
      .from("streams")
      .select("id")
      .eq("user_id", targetUserId);

    const streamIds = (userStreams || []).map((s: any) => s.id);

    if (streamIds.length > 0) {
      await supabase.from("stream_chat").delete().in("stream_id", streamIds);
      await supabase.from("stream_tips").delete().in("stream_id", streamIds);
      await supabase.from("stream_viewers").delete().in("stream_id", streamIds);
      await supabase.from("stream_recordings").delete().in("stream_id", streamIds);
    }

    await supabase.from("stream_chat").delete().eq("user_id", targetUserId);
    await supabase.from("stream_tips").delete().eq("tipper_id", targetUserId);
    await supabase.from("stream_viewers").delete().eq("viewer_id", targetUserId);
    await supabase.from("stream_recordings").delete().eq("user_id", targetUserId);
    await supabase.from("streams").delete().eq("user_id", targetUserId);

    // 2. Connect/shop data
    const { data: connectedAccounts } = await supabase
      .from("connected_accounts")
      .select("id")
      .eq("user_id", targetUserId);

    const accountIds = (connectedAccounts || []).map((a: any) => a.id);
    if (accountIds.length > 0) {
      await supabase.from("connect_products").delete().in("connected_account_id", accountIds);
    }
    await supabase.from("connected_accounts").delete().eq("user_id", targetUserId);
    await supabase.from("user_products").delete().eq("user_id", targetUserId);

    // 3. Analytics
    await supabase.from("analytics_events").delete().eq("user_id", targetUserId);

    // 4. Links
    await supabase.from("auto_share_links").delete().eq("user_id", targetUserId);
    await supabase.from("links").delete().eq("user_id", targetUserId);

    // 5. AI generations
    await supabase.from("ai_generations").delete().eq("user_id", targetUserId);

    // 6. Integrations
    await supabase.from("user_integrations").delete().eq("user_id", targetUserId);

    // 7. Subscriptions
    await supabase.from("user_subscriptions").delete().eq("user_id", targetUserId);

    // 8. Earnings
    await supabase.from("earnings").delete().eq("user_id", targetUserId);

    // 9. Appearance settings
    await supabase.from("appearance_settings").delete().eq("user_id", targetUserId);

    // 10. Support tickets and messages
    const { data: userTickets } = await supabase
      .from("support_tickets")
      .select("id")
      .eq("user_id", targetUserId);

    const ticketIds = (userTickets || []).map((t: any) => t.id);
    if (ticketIds.length > 0) {
      await supabase.from("support_messages").delete().in("ticket_id", ticketIds);
    }
    await supabase.from("support_tickets").delete().eq("user_id", targetUserId);

    // 11. Admin user entry
    await supabase.from("admin_users").delete().eq("user_id", targetUserId);

    // 12. Profile
    await supabase.from("profiles").delete().eq("user_id", targetUserId);

    // 13. Storage
    try {
      const { data: avatarFiles } = await supabase.storage.from("avatars").list(targetUserId);
      if (avatarFiles && avatarFiles.length > 0) {
        await supabase.storage.from("avatars").remove(avatarFiles.map((f: any) => `${targetUserId}/${f.name}`));
      }
    } catch { /* bucket may not exist */ }

    try {
      const { data: recordingFiles } = await supabase.storage.from("stream-recordings").list(targetUserId);
      if (recordingFiles && recordingFiles.length > 0) {
        await supabase.storage.from("stream-recordings").remove(recordingFiles.map((f: any) => `${targetUserId}/${f.name}`));
      }
    } catch { /* bucket may not exist */ }

    // 14. Delete auth user
    const { error: deleteError } = await (supabase.auth as any).admin.deleteUser(targetUserId);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return res.status(500).json({ error: "Failed to delete auth account. User data has been removed." });
    }

    return res.status(200).json({
      success: true,
      message: `User removed successfully. Reason: ${reason || "unspecified"}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("admin-remove-user error:", message);
    return res.status(500).json({ error: message });
  }
}
