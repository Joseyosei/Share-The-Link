/**
 * Stream replay uploads, mounted on /api/upload-video
 * (kept inside an existing function: the Vercel Hobby plan allows 12 functions).
 *
 * POST /api/upload-video?action=client-upload
 *   Vercel Blob client-upload handshake. The browser asks for a short-lived token,
 *   then uploads the recording straight to Blob storage (multipart). The file never
 *   passes through this function, so the 4.5 MB serverless body limit does not apply.
 *
 * POST /api/upload-video?action=finalize
 *   Called after the upload. Verifies ownership, writes the stream_recordings row
 *   (the Media page reads it), links it to the stream, and starts the post-stream agent.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { waitUntil } from "@vercel/functions";
import { handleCors } from "./cors.js";
import { verifyAuth, unauthorized } from "./auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./rate-limit.js";
import { sanitizeString, isValidUUID } from "./validate.js";
import { supabaseAdmin, runWorkflow } from "./agents/runtime.js";
import { WORKFLOWS } from "./agents/workflows.js";

const MAX_RECORDING_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

async function ownsStream(userId: string, streamId: string) {
  if (!isValidUUID(streamId)) return false;
  const { data } = await supabaseAdmin.from("streams").select("id").eq("id", streamId).eq("user_id", userId).maybeSingle();
  return !!data;
}

/** upload-video.ts disables the body parser for multipart; parse JSON ourselves. */
async function readJson(req: VercelRequest): Promise<any> {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks).toString("utf-8");
  return raw ? JSON.parse(raw) : {};
}

export async function recordingUploadHandler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isRateLimited(getClientIp(req), 60)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  let json: any;
  try {
    json = await readJson(req);
  } catch {
    return res.status(400).json({ error: "Invalid JSON" });
  }

  if (req.query.action === "finalize") return finalize(json, res, auth.userId);

  try {
    const body = json as HandleUploadBody;
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload: { streamId?: string; kind?: string } = {};
        try {
          payload = JSON.parse(clientPayload || "{}");
        } catch {
          /* handled below */
        }
        if (!pathname.startsWith(`recordings/${auth.userId}/`)) throw new Error("Invalid upload path");
        if (!payload.streamId || !(await ownsStream(auth.userId, payload.streamId))) throw new Error("Stream not found");

        const isThumb = payload.kind === "thumbnail";
        return {
          allowedContentTypes: isThumb ? ["image/jpeg", "image/png", "image/webp"] : ["video/webm", "video/mp4"],
          maximumSizeInBytes: isThumb ? MAX_THUMBNAIL_BYTES : MAX_RECORDING_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ userId: auth.userId, streamId: payload.streamId }),
        };
      },
    });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ error: err instanceof Error ? err.message : "Upload not allowed" });
  }
}

async function finalize(b: any, res: VercelResponse, userId: string) {
  const streamId = String(b.stream_id || "");
  if (!(await ownsStream(userId, streamId))) return res.status(404).json({ error: "Stream not found" });

  // Only accept files this user uploaded to our Blob store
  const isOwnBlob = (u: unknown) => {
    if (typeof u !== "string") return false;
    try {
      const url = new URL(u);
      return url.protocol === "https:" &&
        url.hostname.endsWith(".public.blob.vercel-storage.com") &&
        url.pathname.startsWith(`/recordings/${userId}/`);
    } catch {
      return false;
    }
  };
  if (!isOwnBlob(b.video_url)) return res.status(400).json({ error: "Invalid video URL" });
  const thumbnailUrl = isOwnBlob(b.thumbnail_url) ? b.thumbnail_url : null;

  const row = {
    stream_id: streamId,
    user_id: userId,
    video_url: b.video_url,
    thumbnail_url: thumbnailUrl,
    title: sanitizeString(b.title, 200) || "Stream Recording",
    description: sanitizeString(b.description, 2000) || null,
    duration: Math.max(0, Math.min(Number(b.duration) || 0, 6 * 3600)),
    size_bytes: Math.max(0, Number(b.size_bytes) || 0),
    visibility: "public",
    ai_status: "pending",
  };

  // One replay per stream: update if a retry already created it
  const { data: existing } = await supabaseAdmin.from("stream_recordings").select("id").eq("stream_id", streamId).maybeSingle();
  const { data: recording, error } = existing
    ? await supabaseAdmin.from("stream_recordings").update(row).eq("id", existing.id).select().single()
    : await supabaseAdmin.from("stream_recordings").insert({ ...row, view_count: 0 }).select().single();

  if (error || !recording) {
    console.error("finalize insert error:", error);
    return res.status(500).json({ error: "Failed to save the replay" });
  }

  await supabaseAdmin
    .from("streams")
    .update({ recording_url: row.video_url, thumbnail_url: thumbnailUrl })
    .eq("id", streamId);

  // Let the post-stream agent write description, key moments, tags and social posts
  // after we respond. The Media page shows "AI is writing..." until ai_status flips.
  waitUntil(
    runWorkflow(WORKFLOWS["post-stream"], { userId, subjectId: streamId, trigger: "event" })
      .catch((e) => console.error("post-stream agent failed:", e))
      .finally(() =>
        // If the agent never saved metadata, don't leave the card stuck on "AI is writing..."
        supabaseAdmin.from("stream_recordings").update({ ai_status: "failed" }).eq("stream_id", streamId).eq("ai_status", "pending")
      )
  );

  return res.status(200).json({ success: true, recording });
}
