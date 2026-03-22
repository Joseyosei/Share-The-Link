/**
 * Consolidated AI Agent API endpoint.
 * Routes to sub-handlers based on ?action= query parameter.
 *
 * POST /api/ai-agent?action=chat              ← AI Assistant chat
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
    case "chat":
      return handleChat(req, res);
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

// ─── AI ASSISTANT CHAT ─────────────────────────────────────────

const CHAT_TOOLS = [
  { type: "function", function: { name: "get_profile", description: "Get the user's current profile information.", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "get_links", description: "Get all of the user's links.", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "add_link", description: "Add a new link to the user's profile.", parameters: { type: "object", properties: { title: { type: "string" }, url: { type: "string" } }, required: ["title", "url"] } } },
  { type: "function", function: { name: "update_link", description: "Update a link's title, URL, or visibility.", parameters: { type: "object", properties: { link_id: { type: "string" }, title: { type: "string" }, url: { type: "string" }, is_active: { type: "boolean" } }, required: ["link_id"] } } },
  { type: "function", function: { name: "delete_link", description: "Delete a link.", parameters: { type: "object", properties: { link_id: { type: "string" } }, required: ["link_id"] } } },
  { type: "function", function: { name: "update_profile", description: "Update the user's bio or display name.", parameters: { type: "object", properties: { bio: { type: "string" }, full_name: { type: "string" } }, required: [] } } },
  { type: "function", function: { name: "get_appearance", description: "Get the user's appearance/theme settings.", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "update_appearance", description: "Update theme, button style, or font.", parameters: { type: "object", properties: { theme: { type: "string" }, button_style: { type: "string" }, font: { type: "string" } }, required: [] } } },
  { type: "function", function: { name: "get_analytics_summary", description: "Get analytics summary — clicks, top links.", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "get_bookings", description: "Get upcoming bookings.", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "get_products", description: "Get user's digital products.", parameters: { type: "object", properties: {}, required: [] } } },
  { type: "function", function: { name: "web_search", description: "Search the web for information.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
];

async function executeChatTool(toolName: string, args: Record<string, any>, userId: string): Promise<string> {
  switch (toolName) {
    case "get_profile": {
      const { data, error } = await supabaseAdmin.from("profiles").select("username, full_name, bio, avatar_url, social_links").eq("user_id", userId).single();
      return JSON.stringify(error ? { error: error.message } : data);
    }
    case "get_links": {
      const { data, error } = await supabaseAdmin.from("links").select("id, title, url, is_active, click_count, position").eq("user_id", userId).order("position", { ascending: true });
      return JSON.stringify(error ? { error: error.message } : data || []);
    }
    case "add_link": {
      const { data: existing } = await supabaseAdmin.from("links").select("position").eq("user_id", userId).order("position", { ascending: false }).limit(1);
      const nextPos = existing && existing.length > 0 ? (existing[0].position || 0) + 1 : 0;
      const { data, error } = await supabaseAdmin.from("links").insert({ user_id: userId, title: args.title, url: args.url, is_active: true, position: nextPos }).select("id, title, url").single();
      return JSON.stringify(error ? { error: error.message } : { success: true, link: data });
    }
    case "update_link": {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (args.title !== undefined) updates.title = args.title;
      if (args.url !== undefined) updates.url = args.url;
      if (args.is_active !== undefined) updates.is_active = args.is_active;
      const { error } = await supabaseAdmin.from("links").update(updates).eq("id", args.link_id).eq("user_id", userId);
      return JSON.stringify(error ? { error: error.message } : { success: true });
    }
    case "delete_link": {
      const { error } = await supabaseAdmin.from("links").delete().eq("id", args.link_id).eq("user_id", userId);
      return JSON.stringify(error ? { error: error.message } : { success: true });
    }
    case "update_profile": {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (args.bio !== undefined) updates.bio = args.bio;
      if (args.full_name !== undefined) updates.full_name = args.full_name;
      const { error } = await supabaseAdmin.from("profiles").update(updates).eq("user_id", userId);
      return JSON.stringify(error ? { error: error.message } : { success: true });
    }
    case "get_appearance": {
      const { data, error } = await supabaseAdmin.from("appearance_settings").select("*").eq("user_id", userId).single();
      return JSON.stringify(error ? { error: error.message } : data);
    }
    case "update_appearance": {
      const updates: Record<string, any> = { updated_at: new Date().toISOString() };
      if (args.theme !== undefined) updates.theme = args.theme;
      if (args.button_style !== undefined) updates.button_style = args.button_style;
      if (args.font !== undefined) updates.font = args.font;
      const { error } = await supabaseAdmin.from("appearance_settings").update(updates).eq("user_id", userId);
      return JSON.stringify(error ? { error: error.message } : { success: true });
    }
    case "get_analytics_summary": {
      const { data: links } = await supabaseAdmin.from("links").select("title, url, click_count").eq("user_id", userId).order("click_count", { ascending: false }).limit(5);
      const totalClicks = (links || []).reduce((sum: number, l: any) => sum + (l.click_count || 0), 0);
      return JSON.stringify({ total_link_clicks: totalClicks, total_links: (links || []).length, top_links: links || [] });
    }
    case "get_bookings": {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabaseAdmin.from("bookings").select("id, client_name, client_email, booking_date, booking_time, status, amount, currency").eq("creator_id", userId).gte("booking_date", today).order("booking_date", { ascending: true }).limit(10);
      return JSON.stringify(error ? { error: error.message } : data || []);
    }
    case "get_products": {
      const { data, error } = await supabaseAdmin.from("connect_products").select("id, title, description, price, currency, type, is_active").eq("user_id", userId).order("created_at", { ascending: false });
      return JSON.stringify(error ? { error: error.message } : data || []);
    }
    case "web_search": {
      try {
        const query = encodeURIComponent(args.query as string);
        const r = await fetch(`https://api.duckduckgo.com/?q=${query}&format=json&no_html=1`, { signal: AbortSignal.timeout(5000) });
        const data = await r.json();
        const results: string[] = [];
        if (data.AbstractText) results.push(`Summary: ${data.AbstractText}`);
        if (data.RelatedTopics) { for (const topic of data.RelatedTopics.slice(0, 5)) { if (topic.Text) results.push(`- ${topic.Text}`); } }
        return results.length > 0 ? results.join("\n") : "No results found.";
      } catch { return "Web search failed."; }
    }
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

async function handleChat(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (isRateLimited(getClientIp(req), 15)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) return res.status(503).json({ error: "AI service is not configured." });

  try {
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const trimmedMessages = messages.slice(-20);

    const systemPrompt = `You are the Share The Link AI Assistant — a helpful, friendly agent built into the Share The Link platform. You help users manage their link-in-bio pages, profile, appearance, links, bookings, and products.

Your capabilities:
- View and update the user's profile (bio, name, social links)
- Add, edit, delete, and reorder links
- View and change appearance/theme settings
- Check analytics (views, clicks, top links)
- View upcoming bookings
- View digital products
- Search the web for information

Personality:
- Be concise, helpful, and proactive
- When the user asks to do something, use the available tools — don't just explain how
- If you make a change, confirm what you did
- Suggest improvements when you notice opportunities
- Use plain language, not technical jargon
- Keep responses short and actionable

Context:
- The platform is called "Share The Link" (sharethelink.app)
- It's a link-in-bio platform for creators and entrepreneurs
- User's profile URL is sharethelink.app/{username}
- The user is currently logged in as: ${auth.email}

Important:
- Always use tools to read data before answering questions about the user's profile/links/settings
- When adding links, validate the URL format
- Never share sensitive information like API keys or passwords
- If you can't do something, explain what the user can do manually`;

    const apiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...trimmedMessages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    let response = await callChatOpenAI(apiKey, apiMessages, CHAT_TOOLS);
    let iterations = 0;

    while (response.choices[0]?.message?.tool_calls && iterations < 5) {
      iterations++;
      const assistantMessage = response.choices[0].message;
      apiMessages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const result = await executeChatTool(toolCall.function.name, args, auth.userId);
        apiMessages.push({ role: "tool", tool_call_id: toolCall.id, content: result });
      }

      response = await callChatOpenAI(apiKey, apiMessages, CHAT_TOOLS);
    }

    const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";
    return res.status(200).json({ reply, toolsUsed: iterations > 0 });
  } catch (error) {
    console.error("AI Chat error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

async function callChatOpenAI(apiKey: string, messages: any[], tools: any[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: "gpt-4o-mini", messages, tools, tool_choice: "auto", temperature: 0.7, max_tokens: 1500 }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }
  return response.json();
}
