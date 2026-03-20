/**
 * Consolidated AI Agent API endpoint.
 * Routes to sub-handlers based on ?action= query parameter.
 *
 * POST /api/ai-agent?action=distribute
 * POST /api/ai-agent?action=save-settings
 * POST /api/ai-agent?action=generate-key
 * GET|POST /api/ai-agent?action=webhook-trigger
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { handleCors } from "./_lib/cors.js";
import { verifyAuth, unauthorized } from "./_lib/auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";
import { sanitizeString, isValidUUID, isValidUrl, badRequest } from "./_lib/validate.js";
import crypto from "crypto";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;

  const action = req.query.action as string || "";

  switch (action) {
    case "distribute":
      return handleDistribute(req, res);
    case "save-settings":
      return handleSaveSettings(req, res);
    case "generate-key":
      return handleGenerateKey(req, res);
    case "webhook-trigger":
      return handleWebhookTrigger(req, res);
    default:
      return res.status(400).json({ error: "Missing or invalid action parameter" });
  }
}

// ─── DISTRIBUTE ─────────────────────────────────────────────────

interface WebhookPayload {
  platform: string;
  link: { id: string; url: string; title: string; description: string };
  content: string;
  creator_id: string;
  creator_username?: string;
  timestamp: string;
  source: string;
}

async function handleDistribute(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isRateLimited(getClientIp(req), 20)) return tooManyRequests(res);

  try {
    let userId: string;
    const apiKey = req.body?.api_key;

    if (apiKey && typeof apiKey === "string") {
      const { data: profile, error } = await supabaseAdmin
        .from("profiles").select("user_id, username").eq("api_key", apiKey).single();
      if (error || !profile) return res.status(401).json({ error: "Invalid API key" });
      userId = profile.user_id;
    } else {
      const auth = await verifyAuth(req);
      if (!auth) return unauthorized(res);
      userId = auth.userId;
    }

    const { link_id, link_url, link_title, platforms: requestedPlatforms } = req.body;
    let linkData: { id: string; url: string; title: string; description: string };

    if (link_id && isValidUUID(link_id)) {
      const { data: link, error } = await supabaseAdmin
        .from("links").select("id, title, url").eq("id", link_id).eq("user_id", userId).single();
      if (error || !link) return badRequest(res, "Link not found or access denied");
      linkData = { id: link.id, url: link.url, title: link.title, description: "" };
    } else if (link_url && isValidUrl(link_url)) {
      linkData = {
        id: `ext-${Date.now()}`,
        url: sanitizeString(link_url, 2000),
        title: sanitizeString(link_title || link_url, 200),
        description: "",
      };
    } else {
      return badRequest(res, "Provide either link_id or link_url");
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles").select("username, webhook_settings").eq("user_id", userId).single();
    const webhookSettings = (profile?.webhook_settings as any) || {};
    const username = profile?.username || "";

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
        platform: platformName, link: linkData, content,
        creator_id: userId, creator_username: username,
        timestamp: new Date().toISOString(), source: "sharethelink",
      };

      try {
        const response = await fetch(platformConfig.webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10000),
        });
        results.push({
          platform: platformName, success: response.ok,
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
        });
      } catch (err) {
        results.push({
          platform: platformName, success: false,
          error: err instanceof Error ? err.message : "Webhook request failed",
        });
      }
      await new Promise((r) => setTimeout(r, 500));
    }

    const successful = results.filter((r) => r.success).length;
    try {
      await supabaseAdmin.from("analytics_events").insert({
        user_id: userId, event_type: "ai_distribution",
        event_data: { link_id: linkData.id, link_url: linkData.url, platforms: results.map((r) => r.platform), successful, total: results.length },
      });
    } catch { /* non-critical */ }

    return res.status(200).json({ success: true, distributed: successful, total: results.length, results });
  } catch (error) {
    console.error("Distribution error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ─── SAVE SETTINGS ──────────────────────────────────────────────

const ALLOWED_PLATFORMS = ["twitter", "linkedin", "facebook", "webhook"];

async function handleSaveSettings(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isRateLimited(getClientIp(req), 20)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    const { platforms } = req.body;
    if (!platforms || typeof platforms !== "object") return badRequest(res, "Missing platforms configuration");

    const sanitized: Record<string, { enabled: boolean; webhookUrl: string }> = {};
    for (const [name, config] of Object.entries(platforms)) {
      if (!ALLOWED_PLATFORMS.includes(name)) continue;
      const cfg = config as any;
      const webhookUrl = cfg?.webhookUrl?.trim() || "";
      if (webhookUrl && !isValidUrl(webhookUrl)) return badRequest(res, `Invalid webhook URL for ${name}`);
      sanitized[name] = { enabled: Boolean(cfg?.enabled), webhookUrl };
    }

    const { error } = await supabaseAdmin
      .from("profiles").update({ webhook_settings: sanitized }).eq("user_id", auth.userId);
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

// ─── GENERATE KEY ───────────────────────────────────────────────

async function handleGenerateKey(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isRateLimited(getClientIp(req), 5)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  try {
    const apiKey = `stl_${crypto.randomBytes(32).toString("hex")}`;
    const { error } = await supabaseAdmin
      .from("profiles").update({ api_key: apiKey }).eq("user_id", auth.userId);
    if (error) {
      console.error("API key generation error:", error);
      return res.status(500).json({ error: "Failed to generate API key" });
    }
    return res.status(200).json({
      success: true, api_key: apiKey,
      message: "API key generated. Use this key to authenticate Make.com/n8n webhooks.",
    });
  } catch (error) {
    console.error("Generate key error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ─── WEBHOOK TRIGGER ────────────────────────────────────────────

function setWebhookCorsHeaders(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key");
  res.setHeader("Access-Control-Max-Age", "86400");
}

async function resolveApiKey(apiKey: string): Promise<{ userId: string; username: string } | null> {
  if (!apiKey || typeof apiKey !== "string" || apiKey.length < 10) return null;
  const { data, error } = await supabaseAdmin
    .from("profiles").select("user_id, username").eq("api_key", apiKey).single();
  if (error || !data) return null;
  return { userId: data.user_id, username: data.username || "" };
}

async function handleWebhookTrigger(req: VercelRequest, res: VercelResponse) {
  setWebhookCorsHeaders(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (isRateLimited(getClientIp(req), 30)) return tooManyRequests(res);

  try {
    const apiKey = (req.query.api_key as string) || req.body?.api_key || req.headers["x-api-key"] || "";
    const user = await resolveApiKey(apiKey as string);
    if (!user) {
      return res.status(401).json({
        error: "Invalid or missing API key",
        help: "Generate an API key in your Share The Link dashboard under AI Agent > Settings",
      });
    }

    if (req.method === "GET") {
      const { data: links } = await supabaseAdmin
        .from("links").select("id, title, url, clicks, is_active, created_at")
        .eq("user_id", user.userId).eq("is_active", true)
        .order("created_at", { ascending: false }).limit(50);
      return res.status(200).json({ success: true, username: user.username, links: links || [], count: links?.length || 0 });
    }

    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const triggerAction = req.body?.action || "distribute";

    switch (triggerAction) {
      case "list-links": {
        const { data: links } = await supabaseAdmin
          .from("links").select("id, title, url, clicks, is_active, created_at")
          .eq("user_id", user.userId).eq("is_active", true)
          .order("created_at", { ascending: false }).limit(50);
        return res.status(200).json({ success: true, username: user.username, links: links || [] });
      }
      case "get-profile": {
        const { data: profile } = await supabaseAdmin
          .from("profiles").select("username, full_name, bio, avatar_url, social_links")
          .eq("user_id", user.userId).single();
        const { data: linkCount } = await supabaseAdmin
          .from("links").select("id", { count: "exact" })
          .eq("user_id", user.userId).eq("is_active", true);
        return res.status(200).json({
          success: true,
          profile: { ...profile, total_links: linkCount?.length || 0, profile_url: `https://sharethelink.app/${profile?.username || ""}` },
        });
      }
      case "distribute": {
        const { link_id, link_url, link_title, platforms } = req.body;
        let linkData: { id: string; url: string; title: string };

        if (!link_id && !link_url) {
          const { data: latestLink } = await supabaseAdmin
            .from("links").select("id, title, url")
            .eq("user_id", user.userId).eq("is_active", true)
            .order("created_at", { ascending: false }).limit(1).single();
          if (!latestLink) return res.status(404).json({ error: "No active links found" });
          linkData = latestLink;
        } else if (link_id) {
          const { data: link } = await supabaseAdmin
            .from("links").select("id, title, url").eq("id", link_id).eq("user_id", user.userId).single();
          if (!link) return res.status(404).json({ error: "Link not found" });
          linkData = link;
        } else {
          linkData = { id: `ext-${Date.now()}`, url: link_url, title: link_title || link_url };
        }

        const { data: profile } = await supabaseAdmin
          .from("profiles").select("webhook_settings").eq("user_id", user.userId).single();
        const webhookSettings = (profile?.webhook_settings as any) || {};
        const results = await distributeToWebhooks(webhookSettings, linkData, user.userId, user.username, platforms);
        return res.status(200).json({ success: true, link: linkData, results });
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${triggerAction}`, available_actions: ["distribute", "list-links", "get-profile"] });
    }
  } catch (error) {
    console.error("Webhook trigger error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ─── SHARED HELPERS ─────────────────────────────────────────────

async function distributeToWebhooks(
  webhookSettings: Record<string, any>,
  link: { id: string; url: string; title: string },
  userId: string, username: string, requestedPlatforms?: string[],
) {
  const allPlatforms = ["twitter", "linkedin", "facebook", "webhook"];
  const targets = requestedPlatforms?.filter((p) => allPlatforms.includes(p)) || allPlatforms;
  const results: Array<{ platform: string; success: boolean; error?: string }> = [];

  for (const platform of targets) {
    const config = webhookSettings[platform];
    if (!config?.enabled || !config?.webhookUrl) continue;
    try {
      const content = generateContent({ ...link, description: "" }, platform);
      const response = await fetch(config.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform, link: { id: link.id, url: link.url, title: link.title },
          content, creator_id: userId, creator_username: username,
          timestamp: new Date().toISOString(), source: "sharethelink",
        }),
        signal: AbortSignal.timeout(10000),
      });
      results.push({ platform, success: response.ok, error: response.ok ? undefined : `HTTP ${response.status}` });
    } catch (err) {
      results.push({ platform, success: false, error: err instanceof Error ? err.message : "Failed" });
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return results;
}

function generateContent(link: { title: string; url: string; description: string }, platform: string): string {
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
