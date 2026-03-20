/**
 * Generate or regenerate an API key for Make.com/n8n integration.
 * POST /api/ai-agent/generate-key
 * Requires Bearer token auth.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "../_lib/cors.js";
import { verifyAuth, unauthorized } from "../_lib/auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "../_lib/rate-limit.js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isRateLimited(getClientIp(req), 5)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    // Generate a secure API key
    const apiKey = `stl_${crypto.randomBytes(32).toString("hex")}`;

    // Store in profiles table
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ api_key: apiKey })
      .eq("user_id", auth.userId);

    if (error) {
      console.error("API key generation error:", error);
      return res.status(500).json({ error: "Failed to generate API key" });
    }

    return res.status(200).json({
      success: true,
      api_key: apiKey,
      message: "API key generated. Use this key to authenticate Make.com/n8n webhooks.",
    });
  } catch (error) {
    console.error("Generate key error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
