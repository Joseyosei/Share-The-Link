/**
 * API endpoint for AI Agent Link Distribution.
 * Called from the Share The Link dashboard to distribute links via webhooks.
 * Also supports being called directly by Make.com/n8n via API key auth.
 *
 * POST /api/ai-agent/distribute
 * Body: { link_id: string } (when called from dashboard with Bearer token)
 * Body: { api_key: string, link_id?: string, link_url?: string, link_title?: string, platforms?: string[] }
 *        (when called from Make.com/n8n with API key)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "../_lib/cors";
import { verifyAuth, unauthorized } from "../_lib/auth";
import { isRateLimited, getClientIp, tooManyRequests } from "../_lib/rate-limit";
import { sanitizeString, isValidUUID, isValidUrl, badRequest } from "../_lib/validate";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

interface WebhookPayload {
  platform: string;
  link: {
    id: string;
    url: string;
    title: string;
    description: string;
  };
  content: string;
  creator_id: string;
  creator_username?: string;
  timestamp: string;
  source: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isRateLimited(getClientIp(req), 20)) return tooManyRequests(res);

  try {
    // Two auth modes: Bearer token (dashboard) or API key (Make.com/n8n)
    let userId: string;
    const apiKey = req.body?.api_key;

    if (apiKey && typeof apiKey === "string") {
      // API key auth for external automation tools
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("user_id, username")
        .eq("api_key", apiKey)
        .single();

      if (error || !profile) {
        return res.status(401).json({ error: "Invalid API key" });
      }
      userId = profile.user_id;
    } else {
      // Bearer token auth from dashboard
      const auth = await verifyAuth(req);
      if (!auth) return unauthorized(res);
      userId = auth.userId;
    }

    const { link_id, link_url, link_title, platforms: requestedPlatforms } = req.body;

    // Resolve link data
    let linkData: { id: string; url: string; title: string; description: string };

    if (link_id && isValidUUID(link_id)) {
      // Fetch from database
      const { data: link, error } = await supabaseAdmin
        .from("links")
        .select("id, title, url")
        .eq("id", link_id)
        .eq("user_id", userId)
        .single();

      if (error || !link) {
        return badRequest(res, "Link not found or access denied");
      }
      linkData = { id: link.id, url: link.url, title: link.title, description: "" };
    } else if (link_url && isValidUrl(link_url)) {
      // Direct URL from Make.com/n8n
      linkData = {
        id: `ext-${Date.now()}`,
        url: sanitizeString(link_url, 2000),
        title: sanitizeString(link_title || link_url, 200),
        description: "",
      };
    } else {
      return badRequest(res, "Provide either link_id or link_url");
    }

    // Get user's webhook settings
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("username, webhook_settings")
      .eq("user_id", userId)
      .single();

    const webhookSettings = (profile?.webhook_settings as any) || {};
    const username = profile?.username || "";

    // Determine which platforms to distribute to
    const allPlatforms = ["twitter", "linkedin", "facebook", "webhook"];
    const targetPlatforms = requestedPlatforms && Array.isArray(requestedPlatforms)
      ? requestedPlatforms.filter((p: string) => allPlatforms.includes(p))
      : allPlatforms;

    const results: Array<{ platform: string; success: boolean; error?: string }> = [];

    for (const platformName of targetPlatforms) {
      const platformConfig = webhookSettings[platformName];
      if (!platformConfig?.enabled || !platformConfig?.webhookUrl) continue;

      const content = generateContent(linkData, platformName);
      const payload: WebhookPayload = {
        platform: platformName,
        link: linkData,
        content,
        creator_id: userId,
        creator_username: username,
        timestamp: new Date().toISOString(),
        source: "sharethelink",
      };

      try {
        const response = await fetch(platformConfig.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          results.push({
            platform: platformName,
            success: false,
            error: `HTTP ${response.status}: ${response.statusText}`,
          });
        } else {
          results.push({ platform: platformName, success: true });
        }
      } catch (err) {
        results.push({
          platform: platformName,
          success: false,
          error: err instanceof Error ? err.message : "Webhook request failed",
        });
      }

      // Small delay between webhook calls
      await new Promise((r) => setTimeout(r, 500));
    }

    const successful = results.filter((r) => r.success).length;

    // Log the distribution event
    try {
      await supabaseAdmin.from("analytics_events").insert({
        user_id: userId,
        event_type: "ai_distribution",
        event_data: {
          link_id: linkData.id,
          link_url: linkData.url,
          platforms: results.map((r) => r.platform),
          successful,
          total: results.length,
        },
      });
    } catch {
      // Non-critical, don't fail the request
    }

    return res.status(200).json({
      success: true,
      distributed: successful,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error("Distribution error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

function generateContent(
  link: { title: string; url: string; description: string },
  platform: string,
): string {
  switch (platform) {
    case "twitter":
      return `${link.title.slice(0, 200)}\n\n${link.url}`.slice(0, 280);
    case "linkedin":
      return `${link.title}\n\n${link.description || "Check this out!"}\n\nRead more: ${link.url}`;
    case "facebook":
      return `${link.title}\n\n${link.description || ""}\n\n${link.url}`;
    default:
      return `${link.title}\n${link.url}`;
  }
}
