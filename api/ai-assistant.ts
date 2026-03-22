import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "./_lib/cors.js";
import { verifyAuth, unauthorized } from "./_lib/auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "./_lib/rate-limit.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getSupabase() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─── Tool definitions for the AI ───────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_profile",
      description: "Get the user's current profile information including username, bio, full name, avatar, and social links.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_links",
      description: "Get all of the user's links with their titles, URLs, visibility, click counts, and order.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "add_link",
      description: "Add a new link to the user's profile page.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "The display title of the link" },
          url: { type: "string", description: "The URL to link to" },
        },
        required: ["title", "url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_link",
      description: "Update an existing link's title, URL, or visibility.",
      parameters: {
        type: "object",
        properties: {
          link_id: { type: "string", description: "The UUID of the link to update" },
          title: { type: "string", description: "New title (optional)" },
          url: { type: "string", description: "New URL (optional)" },
          is_active: { type: "boolean", description: "Whether the link is visible (optional)" },
        },
        required: ["link_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_link",
      description: "Delete a link from the user's profile.",
      parameters: {
        type: "object",
        properties: {
          link_id: { type: "string", description: "The UUID of the link to delete" },
        },
        required: ["link_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_profile",
      description: "Update the user's profile bio, full name, or social links.",
      parameters: {
        type: "object",
        properties: {
          bio: { type: "string", description: "New bio text (optional)" },
          full_name: { type: "string", description: "New display name (optional)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_appearance",
      description: "Get the user's current appearance/theme settings.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "update_appearance",
      description: "Update the user's appearance/theme. Provide any fields to change.",
      parameters: {
        type: "object",
        properties: {
          theme: { type: "string", description: "Theme name (e.g. 'midnight', 'ocean', 'sunset', 'forest', 'minimal')" },
          button_style: { type: "string", description: "Button style: 'rounded', 'pill', 'square', 'outline', 'shadow'" },
          font: { type: "string", description: "Font family name" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_analytics_summary",
      description: "Get a summary of the user's profile analytics — total views, link clicks, top links.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_bookings",
      description: "Get the user's upcoming bookings.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_products",
      description: "Get the user's digital products and their details.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Search the web for information. Use this when the user asks about something you don't know or needs current information.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "The search query" },
        },
        required: ["query"],
      },
    },
  },
];

// ─── Tool execution ────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  userId: string
): Promise<string> {
  const sb = getSupabase();

  switch (toolName) {
    case "get_profile": {
      const { data, error } = await sb
        .from("profiles")
        .select("username, full_name, bio, avatar_url, social_links")
        .eq("user_id", userId)
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify(data);
    }

    case "get_links": {
      const { data, error } = await sb
        .from("links")
        .select("id, title, url, is_active, click_count, position")
        .eq("user_id", userId)
        .order("position", { ascending: true });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify(data || []);
    }

    case "add_link": {
      // Get max position
      const { data: existing } = await sb
        .from("links")
        .select("position")
        .eq("user_id", userId)
        .order("position", { ascending: false })
        .limit(1);

      const nextPos = existing && existing.length > 0 ? (existing[0].position || 0) + 1 : 0;

      const { data, error } = await sb
        .from("links")
        .insert({
          user_id: userId,
          title: args.title as string,
          url: args.url as string,
          is_active: true,
          position: nextPos,
        })
        .select("id, title, url")
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true, link: data });
    }

    case "update_link": {
      const updates: Record<string, unknown> = {};
      if (args.title !== undefined) updates.title = args.title;
      if (args.url !== undefined) updates.url = args.url;
      if (args.is_active !== undefined) updates.is_active = args.is_active;
      updates.updated_at = new Date().toISOString();

      const { error } = await sb
        .from("links")
        .update(updates)
        .eq("id", args.link_id as string)
        .eq("user_id", userId);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true });
    }

    case "delete_link": {
      const { error } = await sb
        .from("links")
        .delete()
        .eq("id", args.link_id as string)
        .eq("user_id", userId);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true });
    }

    case "update_profile": {
      const updates: Record<string, unknown> = {};
      if (args.bio !== undefined) updates.bio = args.bio;
      if (args.full_name !== undefined) updates.full_name = args.full_name;
      updates.updated_at = new Date().toISOString();

      const { error } = await sb
        .from("profiles")
        .update(updates)
        .eq("user_id", userId);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true });
    }

    case "get_appearance": {
      const { data, error } = await sb
        .from("appearance_settings")
        .select("*")
        .eq("user_id", userId)
        .single();
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify(data);
    }

    case "update_appearance": {
      const updates: Record<string, unknown> = {};
      if (args.theme !== undefined) updates.theme = args.theme;
      if (args.button_style !== undefined) updates.button_style = args.button_style;
      if (args.font !== undefined) updates.font = args.font;
      updates.updated_at = new Date().toISOString();

      const { error } = await sb
        .from("appearance_settings")
        .update(updates)
        .eq("user_id", userId);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify({ success: true });
    }

    case "get_analytics_summary": {
      const { data: profile } = await sb
        .from("profiles")
        .select("total_views")
        .eq("user_id", userId)
        .single();

      const { data: links } = await sb
        .from("links")
        .select("title, url, click_count")
        .eq("user_id", userId)
        .order("click_count", { ascending: false })
        .limit(5);

      const totalClicks = (links || []).reduce((sum, l) => sum + (l.click_count || 0), 0);

      return JSON.stringify({
        total_views: profile?.total_views || 0,
        total_link_clicks: totalClicks,
        top_links: links || [],
      });
    }

    case "get_bookings": {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await sb
        .from("bookings")
        .select("id, client_name, client_email, booking_date, booking_time, status, amount, currency")
        .eq("creator_id", userId)
        .gte("booking_date", today)
        .order("booking_date", { ascending: true })
        .limit(10);
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify(data || []);
    }

    case "get_products": {
      const { data, error } = await sb
        .from("connect_products")
        .select("id, title, description, price, currency, type, is_active")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) return JSON.stringify({ error: error.message });
      return JSON.stringify(data || []);
    }

    case "web_search": {
      // Simple web search via DuckDuckGo instant answer API (no key needed)
      try {
        const query = encodeURIComponent(args.query as string);
        const res = await fetch(
          `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1`,
          { signal: AbortSignal.timeout(5000) }
        );
        const data = await res.json();
        const results: string[] = [];
        if (data.AbstractText) results.push(`Summary: ${data.AbstractText}`);
        if (data.RelatedTopics) {
          for (const topic of data.RelatedTopics.slice(0, 5)) {
            if (topic.Text) results.push(`- ${topic.Text}`);
          }
        }
        return results.length > 0
          ? results.join("\n")
          : "No results found. Try a different search query.";
      } catch {
        return "Web search failed. Please try again.";
      }
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}

// ─── Main handler ──────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return;
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Rate limit: 15 messages per minute
  if (isRateLimited(getClientIp(req), 15)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);

  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "AI service is not configured. Please add OPENAI_API_KEY." });
  }

  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Limit conversation length to prevent abuse
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
- Suggest improvements when you notice opportunities (e.g., "Your bio is empty — want me to write one?")
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

    // Build the API messages
    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...trimmedMessages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // Call OpenAI with tool support
    let response = await callOpenAI(apiKey, apiMessages, TOOLS);

    // Handle tool calls in a loop (max 5 iterations)
    let iterations = 0;
    while (response.choices[0]?.message?.tool_calls && iterations < 5) {
      iterations++;
      const assistantMessage = response.choices[0].message;
      apiMessages.push(assistantMessage);

      // Execute each tool call
      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || "{}");
        const result = await executeTool(toolCall.function.name, args, auth.userId);

        apiMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result,
        } as any);
      }

      // Call OpenAI again with tool results
      response = await callOpenAI(apiKey, apiMessages, TOOLS);
    }

    const reply = response.choices[0]?.message?.content || "I'm sorry, I couldn't process that. Please try again.";

    return res.status(200).json({
      reply,
      toolsUsed: iterations > 0,
    });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}

async function callOpenAI(apiKey: string, messages: any[], tools: any[]) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      tools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${err}`);
  }

  return response.json();
}
