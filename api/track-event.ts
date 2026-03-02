import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "./_lib/cors";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit";
import { sanitize, isOneOf, badRequest } from "./_lib/validate";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

function getDeviceType(ua: string): "mobile" | "desktop" | "tablet" {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini|iemobile/i.test(ua)) return "mobile";
  return "desktop";
}

function getBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua) && !/edg/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Other";
}

function getOS(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os/i.test(ua)) return "macOS";
  if (/linux/i.test(ua) && !/android/i.test(ua)) return "Linux";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  return "Other";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit: 60 req/min per IP (public endpoint for page views)
  if (isRateLimited(getClientIp(req), 60)) return tooManyRequests(res);

  try {
    const { event_type, user_id, link_id, visitor_id, referrer } = req.body;

    if (!event_type || !user_id) {
      return res.status(400).json({ error: "event_type and user_id are required" });
    }

    // Validate event_type to prevent arbitrary data injection
    const allowedEvents = ["page_view", "profile_view", "link_click", "share", "qr_scan"];
    if (!isOneOf(event_type, allowedEvents)) return badRequest(res, "Invalid event_type");

    const ua = (req.headers["user-agent"] || "") as string;
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
      (req.headers["x-real-ip"] as string) ||
      req.socket?.remoteAddress ||
      "";

    // Geo lookup from Vercel headers
    const country = (req.headers["x-vercel-ip-country"] as string) || null;
    const countryCode = country;
    const city = (req.headers["x-vercel-ip-city"] as string) || null;

    const deviceType = getDeviceType(ua);
    const browser = getBrowser(ua);
    const os = getOS(ua);

    const { error } = await supabaseAdmin.from("analytics_events").insert({
      user_id,
      event_type,
      link_id: link_id || null,
      visitor_id: visitor_id || null,
      ip_address: ip,
      country: country || null,
      country_code: countryCode || null,
      city: city || null,
      device_type: deviceType,
      browser,
      os,
      referrer: referrer || null,
    });

    if (error) {
      console.error("Analytics insert error:", error);
      return res.status(500).json({ error: "Failed to track event" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Track event error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
