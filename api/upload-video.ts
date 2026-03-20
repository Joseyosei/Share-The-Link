import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";
import { handleCors } from "./_lib/cors.js";
import { verifyAuth, unauthorized } from "./_lib/auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Configuration for video uploads
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_DURATION = 10800; // 3 hours in seconds (supports stream recordings)
const ALLOWED_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limiting - 10 uploads per hour
  if (isRateLimited(getClientIp(req), 10)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    // Parse multipart form data
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    // Parse boundary from content-type header
    const contentType = req.headers["content-type"] || "";
    const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!boundaryMatch) {
      return res.status(400).json({ error: "Invalid multipart form data" });
    }
    const boundary = boundaryMatch[1] || boundaryMatch[2];

    // Parse form data
    const formData = parseMultipartFormData(buffer, boundary);
    
    const file = formData.file;
    const title = formData.title || "Untitled Video";
    const description = formData.description || "";
    const visibility = formData.visibility || "public";
    const duration = parseInt(formData.duration || "0", 10);

    if (!file || !file.data || file.data.length === 0) {
      return res.status(400).json({ error: "No video file provided" });
    }

    // Validate file type
    const mimeType = file.contentType || "video/mp4";
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return res.status(400).json({ 
        error: "Invalid file type. Allowed: MP4, WebM, MOV, M4V" 
      });
    }

    // Validate file size
    if (file.data.length > MAX_FILE_SIZE) {
      return res.status(400).json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      });
    }

    // Validate duration (client-side validated, but double check)
    if (duration > MAX_DURATION) {
      return res.status(400).json({ 
        error: `Video too long. Maximum duration is ${MAX_DURATION / 60} minutes` 
      });
    }

    // Validate visibility
    if (!["public", "private", "unlisted"].includes(visibility)) {
      return res.status(400).json({ error: "Invalid visibility option" });
    }

    // Generate unique filename
    const ext = mimeType === "video/quicktime" ? "mov" : 
                mimeType === "video/x-m4v" ? "m4v" :
                mimeType === "video/webm" ? "webm" : "mp4";
    const timestamp = Date.now();
    const fileName = `videos/${auth.userId}/${timestamp}.${ext}`;

    // Upload to Vercel Blob (public access for video playback)
    const blob = await put(fileName, file.data, {
      access: "public",
      contentType: mimeType,
    });

    // Handle thumbnail if provided
    let thumbnailUrl: string | null = null;
    if (formData.thumbnail && formData.thumbnail.data && formData.thumbnail.data.length > 0) {
      const thumbFileName = `thumbnails/${auth.userId}/${timestamp}.jpg`;
      const thumbBlob = await put(thumbFileName, formData.thumbnail.data, {
        access: "public",
        contentType: "image/jpeg",
      });
      thumbnailUrl = thumbBlob.url;
    }

    // Insert into database
    const { data: videoRecord, error: dbError } = await supabaseAdmin
      .from("user_videos")
      .insert({
        user_id: auth.userId,
        title: title.slice(0, 200), // Max title length
        description: description.slice(0, 2000), // Max description length
        video_url: blob.url,
        thumbnail_url: thumbnailUrl,
        duration,
        file_size: file.data.length,
        mime_type: mimeType,
        visibility,
        status: "ready",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database insert error:", dbError);
      return res.status(500).json({ error: "Failed to save video record" });
    }

    return res.status(200).json({
      success: true,
      video: {
        id: videoRecord.id,
        title: videoRecord.title,
        video_url: videoRecord.video_url,
        thumbnail_url: videoRecord.thumbnail_url,
        duration: videoRecord.duration,
        visibility: videoRecord.visibility,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "Upload failed. Please try again." });
  }
}

// Simple multipart form data parser
function parseMultipartFormData(buffer: Buffer, boundary: string): Record<string, any> {
  const result: Record<string, any> = {};
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = splitBuffer(buffer, boundaryBuffer);

  for (const part of parts) {
    if (part.length < 10) continue;

    // Find headers end (double CRLF)
    const headerEnd = part.indexOf("\r\n\r\n");
    if (headerEnd === -1) continue;

    const headerStr = part.slice(0, headerEnd).toString("utf-8");
    const data = part.slice(headerEnd + 4);

    // Parse Content-Disposition
    const nameMatch = headerStr.match(/name="([^"]+)"/);
    const filenameMatch = headerStr.match(/filename="([^"]+)"/);
    const contentTypeMatch = headerStr.match(/Content-Type:\s*(.+)/i);

    if (!nameMatch) continue;
    const name = nameMatch[1];

    // Remove trailing boundary marker if present
    let cleanData = data;
    const trailingCRLF = cleanData.lastIndexOf("\r\n");
    if (trailingCRLF > 0 && trailingCRLF >= cleanData.length - 4) {
      cleanData = cleanData.slice(0, trailingCRLF);
    }

    if (filenameMatch) {
      // It's a file
      result[name] = {
        filename: filenameMatch[1],
        contentType: contentTypeMatch ? contentTypeMatch[1].trim() : "application/octet-stream",
        data: cleanData,
      };
    } else {
      // It's a regular field
      result[name] = cleanData.toString("utf-8").trim();
    }
  }

  return result;
}

function splitBuffer(buffer: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  let index: number;

  while ((index = buffer.indexOf(delimiter, start)) !== -1) {
    if (index > start) {
      parts.push(buffer.slice(start, index));
    }
    start = index + delimiter.length;
  }

  if (start < buffer.length) {
    parts.push(buffer.slice(start));
  }

  return parts;
}
