/**
 * Webhook trigger endpoint for Make.com / n8n.
 * This endpoint is called BY external automation tools to fetch a user's links
 * and trigger distribution, or to receive status updates.
 *
 * GET  /api/ai-agent/webhook-trigger?api_key=xxx           → List user's links
 * POST /api/ai-agent/webhook-trigger                        → Trigger distribution
 *   Body: { api_key: string, action: "distribute", link_id?: string }
 *   Body: { api_key: string, action: "list-links" }
 *   Body: { api_key: string, action: "get-profile" }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { isRateLimited, getClientIp, tooManyRequests } from "../_lib/rate-limit.js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

// Allow CORS from anywhere for webhook triggers
function setCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  res.setHeader("Access-Control-Max-Age", "86400");
}

async function resolveApiKey(apiKey: string): Promise<{ userId: string; username: string } | null> {
  if (!apiKey || typeof apiKey !== "string" || apiKey.length < 10) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("user_id, username")
    .eq("api_key", apiKey)
    .single();

  if (error || !data) return null;
  return { userId: data.user_id, username: data.username || "" };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (isRateLimited(getClientIp(req), 30)) return tooManyRequests(res);

  try {
    // Extract API key from query, body, or header
    const apiKey =
      (req.query.api_key as string) ||
      req.body?.api_key ||
      req.headers["x-api-key"] ||
      "";

    const user = await resolveApiKey(apiKey);
    if (!user) {
      return res.status(401).json({
        error: "Invalid or missing API key",
        help: "Generate an API key in your Share The Link dashboard under AI Agent > Settings",
      });
    }

    // GET: list links (simple endpoint for Make.com/n8n to poll)
    if (req.method === "GET") {
      const { data: links } = await supabaseAdmin
        .from("links")
        .select("id, title, url, clicks, is_active, created_at")
        .eq("user_id", user.userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(50);

      return res.status(200).json({
        success: true,
        username: user.username,
        links: links || [],
        count: links?.length || 0,
      });
    }

    // POST: perform action
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const action = req.body?.action || "distribute";

    switch (action) {
      case "list-links": {
        const { data: links } = await supabaseAdmin
          .from("links")
          .select("id, title, url, clicks, is_active, created_at")
          .eq("user_id", user.userId)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(50);

        return res.status(200).json({
          success: true,
          username: user.username,
          links: links || [],
        });
      }

      case "get-profile": {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("username, full_name, bio, avatar_url, social_links")
          .eq("user_id", user.userId)
          .single();

        const { data: linkCount } = await supabaseAdmin
          .from("links")
          .select("id", { count: "exact" })
          .eq("user_id", user.userId)
          .eq("is_active", true);

        return res.status(200).json({
          success: true,
          profile: {
            ...profile,
            total_links: linkCount?.length || 0,
            profile_url: `https://sharethelink.app/${profile?.username || ""}`,
          },
        });
      }

      case "distribute": {
        // Forward to the distribute endpoint logic
        const { link_id, link_url, link_title, platforms } = req.body;

        if (!link_id && !link_url) {
          // If no specific link, distribute the most recent one
          const { data: latestLink } = await supabaseAdmin
            .from("links")
            .select("id, title, url")
            .eq("user_id", user.userId)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (!latestLink) {
            return res.status(404).json({ error: "No active links found" });
          }

          // Get webhook settings
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("webhook_settings")
            .eq("user_id", user.userId)
            .single();

          const webhookSettings = (profile?.webhook_settings as any) || {};
          const results = await distributeToWebhooks(
            webhookSettings,
            latestLink,
            user.userId,
            user.username,
            platforms,
          );

          return res.status(200).json({
            success: true,
            link: latestLink,
            results,
          });
        }

        // Distribute specific link
        let linkData: { id: string; url: string; title: string };

        if (link_id) {
          const { data: link } = await supabaseAdmin
            .from("links")
            .select("id, title, url")
            .eq("id", link_id)
            .eq("user_id", user.userId)
            .single();

          if (!link) return res.status(404).json({ error: "Link not found" });
          linkData = link;
        } else {
          linkData = {
            id: `ext-${Date.now()}`,
            url: link_url,
            title: link_title || link_url,
          };
        }

        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("webhook_settings")
          .eq("user_id", user.userId)
          .single();

        const webhookSettings = (profile?.webhook_settings as any) || {};
        const results = await distributeToWebhooks(
          webhookSettings,
          linkData,
          user.userId,
          user.username,
          platforms,
        );

        return res.status(200).json({
          success: true,
          link: linkData,
          results,
        });
      }

      default:
        return res.status(400).json({
          error: `Unknown action: ${action}`,
          available_actions: ["distribute", "list-links", "get-profile"],
        });
    }
  } catch (error) {
    console.error("Webhook trigger error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

async function distributeToWebhooks(
  webhookSettings: Record<string, any>,
  link: { id: string; url: string; title: string },
  userId: string,
  username: string,
  requestedPlatforms?: string[],
) {
  const allPlatforms = ["twitter", "linkedin", "facebook", "webhook"];
  const targets = requestedPlatforms?.filter((p) => allPlatforms.includes(p)) || allPlatforms;
  const results: Array<{ platform: string; success: boolean; error?: string }> = [];

  for (const platform of targets) {
    const config = webhookSettings[platform];
    if (!config?.enabled || !config?.webhookUrl) continue;

    try {
      const content = generateContent(link, platform);
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          link: { id: link.id, url: link.url, title: link.title },
          content,
          creator_id: userId,
          creator_username: username,
          timestamp: new Date().toISOString(),
          source: "sharethelink",
        }),
        signal: AbortSignal.timeout(10000),
      });

      results.push({
        platform,
        success: response.ok,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      });
    } catch (err) {
      results.push({
        platform,
        success: false,
        error: err instanceof Error ? err.message : "Failed",
      });
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

function generateContent(
  link: { title: string; url: string },
  platform: string,
): string {
  switch (platform) {
    case "twitter":
      return `${link.title.slice(0, 200)}\n\n${link.url}`.slice(0, 280);
    case "linkedin":
      return `${link.title}\n\nCheck this out!\n\nRead more: ${link.url}`;
    case "facebook":
      return `${link.title}\n\n${link.url}`;
    default:
      return `${link.title}\n${link.url}`;
  }
}
