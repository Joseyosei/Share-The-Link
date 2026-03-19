/**
 * Save AI Agent webhook settings to the user's profile.
 * POST /api/ai-agent/save-settings
 * Body: { platforms: { twitter: { enabled, webhookUrl }, linkedin: {...}, ... } }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "../_lib/cors";
import { verifyAuth, unauthorized } from "../_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "../_lib/rate-limit";
import { isValidUrl, badRequest } from "../_lib/validate";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

const ALLOWED_PLATFORMS = ["twitter", "linkedin", "facebook", "webhook"];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isRateLimited(getClientIp(req), 20)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    const { platforms } = req.body;
    if (!platforms || typeof platforms !== "object") {
      return badRequest(res, "Missing platforms configuration");
    }

    // Validate and sanitize
    const sanitized: Record<string, { enabled: boolean; webhookUrl: string }> = {};
    for (const [name, config] of Object.entries(platforms)) {
      if (!ALLOWED_PLATFORMS.includes(name)) continue;
      const cfg = config as any;
      const webhookUrl = cfg?.webhookUrl?.trim() || "";

      if (webhookUrl && !isValidUrl(webhookUrl)) {
        return badRequest(res, `Invalid webhook URL for ${name}`);
      }

      sanitized[name] = {
        enabled: Boolean(cfg?.enabled),
        webhookUrl,
      };
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ webhook_settings: sanitized })
      .eq("user_id", auth.userId);

    if (error) {
      console.error("Save settings error:", error);
      return res.status(500).json({ error: "Failed to save settings" });
    }

    return res.status(200).json({ success: true, settings: sanitized });
  } catch (error) {
    console.error("Save settings error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
