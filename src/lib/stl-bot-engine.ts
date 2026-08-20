import { supabase } from "@/integrations/supabase/client";

interface BotResponse {
  reply: string;
  toolsUsed: boolean;
}

interface IntentMatch {
  intent: string;
  params: Record<string, string>;
}

const INTENT_PATTERNS: { pattern: RegExp; intent: string; extract?: (m: RegExpMatchArray) => Record<string, string> }[] = [
  { pattern: /(?:show|list|get|view|display)\s+(?:my\s+)?links/i, intent: "list_links" },
  { pattern: /(?:add|create|new)\s+(?:a\s+)?link\s+(?:to\s+|for\s+)?(.+)/i, intent: "add_link", extract: (m) => ({ url: m[1].trim() }) },
  { pattern: /(?:delete|remove)\s+(?:the\s+)?link\s+(.+)/i, intent: "delete_link", extract: (m) => ({ title: m[1].trim() }) },
  { pattern: /(?:show|view|get|display)\s+(?:my\s+)?(?:analytics|stats|statistics)/i, intent: "analytics" },
  { pattern: /(?:show|view|get|display)\s+(?:my\s+)?(?:profile|bio|about)/i, intent: "profile" },
  { pattern: /(?:update|change|edit|set)\s+(?:my\s+)?(?:bio|description|about)\s+(?:to\s+)?(.+)/i, intent: "update_bio", extract: (m) => ({ bio: m[1].trim() }) },
  { pattern: /(?:update|change|edit|set)\s+(?:my\s+)?(?:display\s*name|name)\s+(?:to\s+)?(.+)/i, intent: "update_name", extract: (m) => ({ name: m[1].trim() }) },
  { pattern: /(?:show|view|get|list)\s+(?:my\s+)?(?:bookings?|appointments?|schedule)/i, intent: "bookings" },
  { pattern: /(?:show|view|get|list)\s+(?:my\s+)?(?:products?|store|shop|digital\s+products?)/i, intent: "products" },
  { pattern: /(?:show|view|get|what)\s+(?:my\s+)?(?:theme|appearance|design|current\s+theme)/i, intent: "appearance" },
  { pattern: /(?:change|set|switch|update)\s+(?:my\s+)?(?:theme|appearance)\s+(?:to\s+)?(.+)/i, intent: "change_theme", extract: (m) => ({ theme: m[1].trim() }) },
  { pattern: /(?:search|look\s+up|find|google)\s+(?:for\s+|the\s+web\s+for\s+|online\s+for\s+)?(.+)/i, intent: "web_search", extract: (m) => ({ query: m[1].trim() }) },
  { pattern: /(?:help|what\s+can\s+you\s+do|commands|capabilities)/i, intent: "help" },
  { pattern: /(?:distribute|share|post)\s+(?:my\s+)?(?:links?|profile)/i, intent: "distribute" },
];

function detectIntent(message: string): IntentMatch {
  for (const { pattern, intent, extract } of INTENT_PATTERNS) {
    const match = message.match(pattern);
    if (match) {
      return { intent, params: extract ? extract(match) : {} };
    }
  }
  return { intent: "general", params: {} };
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function handleListLinks(): Promise<BotResponse> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("links")
    .select("id, title, url, display_order")
    .eq("user_id", userId)
    .order("display_order", { ascending: true });

  if (error) return { reply: `Error fetching links: ${error.message}`, toolsUsed: true };
  if (!data || data.length === 0) return { reply: "You don't have any links yet. Would you like to add one?", toolsUsed: true };

  const linkList = data.map((l, i) => `${i + 1}. **${l.title || "Untitled"}** — ${l.url}`).join("\n");
  return { reply: `Here are your links:\n\n${linkList}\n\nYou have **${data.length}** link(s) total.`, toolsUsed: true };
}

async function handleAddLink(params: Record<string, string>): Promise<BotResponse> {
  const userId = await getUserId();
  let url = params.url || "";
  const title = url.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
  if (url && !url.startsWith("http")) url = `https://${url}`;

  const { error } = await supabase
    .from("links")
    .insert({ user_id: userId, title, url, display_order: 999 });

  if (error) return { reply: `Failed to add link: ${error.message}`, toolsUsed: true };
  return { reply: `Link added!\n\n- **${title}** — ${url}\n\nYou can edit the title and order from your dashboard.`, toolsUsed: true };
}

async function handleDeleteLink(params: Record<string, string>): Promise<BotResponse> {
  const userId = await getUserId();
  const search = params.title?.toLowerCase() || "";

  const { data } = await supabase
    .from("links")
    .select("id, title, url")
    .eq("user_id", userId);

  const match = data?.find((l) => l.title?.toLowerCase().includes(search) || l.url?.toLowerCase().includes(search));
  if (!match) return { reply: `I couldn't find a link matching "${params.title}". Try "Show my links" to see all of them.`, toolsUsed: true };

  const { error } = await supabase.from("links").delete().eq("id", match.id);
  if (error) return { reply: `Failed to delete: ${error.message}`, toolsUsed: true };
  return { reply: `Deleted link **${match.title || match.url}**.`, toolsUsed: true };
}

async function handleAnalytics(): Promise<BotResponse> {
  const userId = await getUserId();
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single();

  const { count: linkCount } = await supabase
    .from("links")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: clicks } = await supabase
    .from("analytics")
    .select("id")
    .eq("profile_id", userId);

  const totalClicks = clicks?.length || 0;

  return {
    reply: `**Analytics Summary**\n\n- **Profile:** ${profile?.username || "N/A"}\n- **Total Links:** ${linkCount || 0}\n- **Total Clicks:** ${totalClicks}\n\nVisit your Analytics page for detailed breakdowns.`,
    toolsUsed: true,
  };
}

async function handleProfile(): Promise<BotResponse> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("profiles")
    .select("username, display_name, bio, avatar_url, theme")
    .eq("id", userId)
    .single();

  if (error || !data) return { reply: "Couldn't fetch your profile.", toolsUsed: true };

  return {
    reply: `**Your Profile**\n\n- **Username:** ${data.username || "Not set"}\n- **Display Name:** ${data.display_name || "Not set"}\n- **Bio:** ${data.bio || "Not set"}\n- **Theme:** ${data.theme || "default"}\n- **Avatar:** ${data.avatar_url ? "Set" : "Not set"}`,
    toolsUsed: true,
  };
}

async function handleUpdateBio(params: Record<string, string>): Promise<BotResponse> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ bio: params.bio })
    .eq("id", userId);

  if (error) return { reply: `Failed to update bio: ${error.message}`, toolsUsed: true };
  return { reply: `Bio updated to: "${params.bio}"`, toolsUsed: true };
}

async function handleUpdateName(params: Record<string, string>): Promise<BotResponse> {
  const userId = await getUserId();
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: params.name })
    .eq("id", userId);

  if (error) return { reply: `Failed to update name: ${error.message}`, toolsUsed: true };
  return { reply: `Display name updated to: **${params.name}**`, toolsUsed: true };
}

async function handleBookings(): Promise<BotResponse> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, service_title, booking_date, booking_time, status, client_name")
    .eq("user_id", userId)
    .order("booking_date", { ascending: true })
    .limit(10);

  if (error) return { reply: `Error fetching bookings: ${error.message}`, toolsUsed: true };
  if (!data || data.length === 0) return { reply: "You don't have any bookings yet.", toolsUsed: true };

  const list = data.map((b) =>
    `- **${b.service_title}** with ${b.client_name || "Unknown"} on ${b.booking_date} at ${b.booking_time || "N/A"} — *${b.status}*`
  ).join("\n");

  return { reply: `**Your Bookings**\n\n${list}`, toolsUsed: true };
}

async function handleProducts(): Promise<BotResponse> {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from("digital_products")
    .select("id, name, price, currency, is_active")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return { reply: `Error fetching products: ${error.message}`, toolsUsed: true };
  if (!data || data.length === 0) return { reply: "You don't have any digital products yet. Create one from the dashboard!", toolsUsed: true };

  const list = data.map((p) =>
    `- **${p.name}** — ${p.price} ${p.currency?.toUpperCase() || "USD"} ${p.is_active ? "✓ Active" : "✗ Inactive"}`
  ).join("\n");

  return { reply: `**Your Digital Products**\n\n${list}`, toolsUsed: true };
}

async function handleAppearance(): Promise<BotResponse> {
  const userId = await getUserId();
  const { data } = await supabase
    .from("profiles")
    .select("theme, custom_css")
    .eq("id", userId)
    .single();

  const theme = data?.theme || "default";
  const hasCustomCss = !!data?.custom_css;

  const availableThemes = [
    "default", "midnight", "sunset", "ocean", "forest",
    "neon", "pastel", "monochrome", "cyberpunk", "minimal"
  ];

  return {
    reply: `**Appearance Settings**\n\n- **Current Theme:** ${theme}\n- **Custom CSS:** ${hasCustomCss ? "Yes" : "No"}\n\n**Available Themes:**\n${availableThemes.map((t) => `- ${t}${t === theme ? " (current)" : ""}`).join("\n")}\n\nTo change your theme, say "Change theme to [name]".`,
    toolsUsed: true,
  };
}

async function handleChangeTheme(params: Record<string, string>): Promise<BotResponse> {
  const userId = await getUserId();
  const theme = params.theme?.toLowerCase().trim();

  const { error } = await supabase
    .from("profiles")
    .update({ theme })
    .eq("id", userId);

  if (error) return { reply: `Failed to change theme: ${error.message}`, toolsUsed: true };
  return { reply: `Theme changed to **${theme}**! Refresh your profile page to see the changes.`, toolsUsed: true };
}

async function handleWebSearch(params: Record<string, string>): Promise<BotResponse> {
  const query = params.query || "";
  if (!query) return { reply: "What would you like me to search for?", toolsUsed: false };

  try {
    const encoded = encodeURIComponent(query);
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encoded}`;

    return {
      reply: `I can't browse the web directly, but here's what you can do:\n\n1. **Search DuckDuckGo:** [${query}](${searchUrl})\n2. **Search Google:** [${query}](https://www.google.com/search?q=${encoded})\n\nWould you like help with something specific about your Share The Link profile instead?`,
      toolsUsed: true,
    };
  } catch {
    return { reply: "Sorry, I had trouble with that search. Try rephrasing your query.", toolsUsed: false };
  }
}

function handleHelp(): BotResponse {
  return {
    reply: `**Here's what I can help with:**\n
- **Links** — "Show my links", "Add a link to youtube.com", "Delete link [name]"
- **Profile** — "Show my profile", "Update my bio to [text]", "Change my name to [name]"
- **Analytics** — "Show my analytics"
- **Appearance** — "Show my theme", "Change theme to [name]"
- **Bookings** — "Show my bookings"
- **Products** — "Show my products"
- **Search** — "Search for [topic]"
- **Distribution** — "Distribute my links"\n
Just type naturally — I'll figure out what you need!`,
    toolsUsed: false,
  };
}

function handleDistribute(): BotResponse {
  return {
    reply: `**Link Distribution Tips**\n
To maximize your reach, share your Share The Link profile on:\n
1. **Instagram** — Add your link to your bio
2. **Twitter/X** — Pin a tweet with your link
3. **TikTok** — Add to your profile bio
4. **LinkedIn** — Add to your contact info
5. **YouTube** — Add to your channel description and video descriptions
6. **Email** — Include in your email signature\n
Copy your profile link from the dashboard and share it across your platforms!`,
    toolsUsed: false,
  };
}

function handleGeneral(message: string): BotResponse {
  const lower = message.toLowerCase();

  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return { reply: "Hey there! I'm STL Bot, your Share The Link assistant. How can I help you today? Type **help** to see what I can do.", toolsUsed: false };
  }

  if (lower.includes("thank")) {
    return { reply: "You're welcome! Let me know if there's anything else I can help with.", toolsUsed: false };
  }

  return {
    reply: `I'm not sure how to help with that. Here are some things I can do:\n\n- Manage your **links** (add, list, delete)\n- View and update your **profile**\n- Check your **analytics**\n- Change your **theme**\n- View **bookings** and **products**\n\nTry asking something like "Show my links" or type **help** for more options.`,
    toolsUsed: false,
  };
}

export async function processMessage(message: string): Promise<BotResponse> {
  const { intent, params } = detectIntent(message);

  switch (intent) {
    case "list_links": return handleListLinks();
    case "add_link": return handleAddLink(params);
    case "delete_link": return handleDeleteLink(params);
    case "analytics": return handleAnalytics();
    case "profile": return handleProfile();
    case "update_bio": return handleUpdateBio(params);
    case "update_name": return handleUpdateName(params);
    case "bookings": return handleBookings();
    case "products": return handleProducts();
    case "appearance": return handleAppearance();
    case "change_theme": return handleChangeTheme(params);
    case "web_search": return handleWebSearch(params);
    case "help": return handleHelp();
    case "distribute": return handleDistribute();
    default: return handleGeneral(message);
  }
}
