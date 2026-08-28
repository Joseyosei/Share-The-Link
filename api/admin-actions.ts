import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "./_lib/cors.js";
import { verifyAuth, unauthorized } from "./_lib/auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

async function handleRemoveUser(supabase: any, body: any, adminUserId: string, res: VercelResponse) {
  const { targetUserId, reason } = body || {};
  if (!targetUserId || typeof targetUserId !== "string") {
    return res.status(400).json({ error: "targetUserId is required." });
  }

  if (targetUserId === adminUserId) {
    return res.status(400).json({ error: "Cannot remove your own account through admin panel." });
  }

  // Cascading delete in FK-dependency order (mirrors api/delete-account.ts)
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

  await supabase.from("analytics_events").delete().eq("user_id", targetUserId);
  await supabase.from("auto_share_links").delete().eq("user_id", targetUserId);
  await supabase.from("links").delete().eq("user_id", targetUserId);
  await supabase.from("ai_generations").delete().eq("user_id", targetUserId);
  await supabase.from("user_integrations").delete().eq("user_id", targetUserId);
  await supabase.from("user_subscriptions").delete().eq("user_id", targetUserId);
  await supabase.from("earnings").delete().eq("user_id", targetUserId);
  await supabase.from("appearance_settings").delete().eq("user_id", targetUserId);

  const { data: userTickets } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("user_id", targetUserId);

  const ticketIds = (userTickets || []).map((t: any) => t.id);
  if (ticketIds.length > 0) {
    await supabase.from("support_messages").delete().in("ticket_id", ticketIds);
  }
  await supabase.from("support_tickets").delete().eq("user_id", targetUserId);

  await supabase.from("admin_users").delete().eq("user_id", targetUserId);
  await supabase.from("profiles").delete().eq("user_id", targetUserId);

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

  const { error: deleteError } = await (supabase.auth as any).admin.deleteUser(targetUserId);
  if (deleteError) {
    console.error("Failed to delete auth user:", deleteError);
    return res.status(500).json({ error: "Failed to delete auth account. User data has been removed." });
  }

  return res.status(200).json({
    success: true,
    message: `User removed successfully. Reason: ${reason || "unspecified"}`,
  });
}

async function handleDeleteStream(supabase: any, body: any, res: VercelResponse) {
  const { streamId } = body || {};
  if (!streamId || typeof streamId !== "string") {
    return res.status(400).json({ error: "streamId is required." });
  }

  await supabase.from("stream_chat").delete().eq("stream_id", streamId);
  await supabase.from("stream_tips").delete().eq("stream_id", streamId);
  await supabase.from("stream_viewers").delete().eq("stream_id", streamId);
  await supabase.from("stream_recordings").delete().eq("stream_id", streamId);

  const { error } = await supabase.from("streams").delete().eq("id", streamId);
  if (error) throw error;

  return res.status(200).json({ success: true, message: "Stream deleted successfully." });
}

async function handleDeleteRecording(supabase: any, body: any, res: VercelResponse) {
  const { recordingId } = body || {};
  if (!recordingId || typeof recordingId !== "string") {
    return res.status(400).json({ error: "recordingId is required." });
  }

  const { data: recording } = await supabase
    .from("stream_recordings")
    .select("user_id")
    .eq("id", recordingId)
    .single();

  const { error } = await supabase.from("stream_recordings").delete().eq("id", recordingId);
  if (error) throw error;

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
}

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

  const action = req.query.action as string;

  try {
    switch (action) {
      case "remove-user":
        return await handleRemoveUser(supabase, req.body, auth.userId, res);
      case "delete-stream":
        return await handleDeleteStream(supabase, req.body, res);
      case "delete-recording":
        return await handleDeleteRecording(supabase, req.body, res);
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`admin-actions (${action}) error:`, message);
    return res.status(500).json({ error: message });
  }
}
