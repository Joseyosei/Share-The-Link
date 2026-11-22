/**
 * Share The Link agent workflows.
 *
 * CREATOR
 *   post-stream     Runs automatically when a replay is saved. Writes the replay
 *                   description, summary and tags, and drafts social posts.
 *   go-live-prep    "Suggest with AI" in the Go Live dialog: title + description.
 *
 * ADMIN (daily cron + "Run now" in Admin > AI Agents)
 *   stream-janitor  Ends streams whose broadcaster vanished; reports replays missing.
 *   support-triage  Prioritises open tickets and drafts replies (replies need approval).
 *   moderation      Reviews recent chat + replays; proposes takedowns (need approval).
 *   daily-digest    Platform metrics and what needs attention today.
 */
import { supabaseAdmin, type Workflow, type AgentTool, type RunContext } from "./runtime.js";

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const DEFAULT_TITLES = new Set(["", "stream recording", "untitled", "untitled video", "test", "live"]);

// ─── Shared tools ──────────────────────────────────────────────────────────

const getStreamDetails: AgentTool = {
  name: "get_stream_details",
  description: "Stream title, description, timing, viewer and tip stats for the stream being processed.",
  input_schema: { type: "object", properties: {} },
  run: async (_a, ctx) => {
    const { data } = await supabaseAdmin
      .from("streams")
      .select("title, description, started_at, ended_at, peak_viewers, total_tips")
      .eq("id", ctx.subjectId)
      .eq("user_id", ctx.userId)
      .single();
    return data || { error: "stream not found" };
  },
};

const getChatTranscript: AgentTool = {
  name: "get_chat_transcript",
  description: "Chat messages and tips from the stream, oldest first, with minutes since start.",
  input_schema: { type: "object", properties: {} },
  run: async (_a, ctx) => {
    const { data: stream } = await supabaseAdmin
      .from("streams").select("started_at").eq("id", ctx.subjectId).eq("user_id", ctx.userId).single();
    const { data } = await supabaseAdmin
      .from("stream_chat")
      .select("username, message, message_type, created_at")
      .eq("stream_id", ctx.subjectId)
      .order("created_at", { ascending: true })
      .limit(400);
    const start = stream?.started_at ? new Date(stream.started_at).getTime() : 0;
    const lines = (data || []).map((m) => {
      const min = start ? Math.max(0, Math.round((new Date(m.created_at).getTime() - start) / 60000)) : 0;
      return `[${min}m] ${m.message_type === "tip" ? "TIP " : ""}${m.username}: ${m.message}`;
    });
    return lines.length ? lines.join("\n") : "No chat messages.";
  },
};

const getCreatorProfile: AgentTool = {
  name: "get_creator_profile",
  description: "The creator's public profile: name, username, bio.",
  input_schema: { type: "object", properties: {} },
  run: async (_a, ctx) => {
    const { data } = await supabaseAdmin
      .from("profiles").select("username, full_name, bio").eq("user_id", ctx.userId).single();
    return data || {};
  },
};

// ─── CREATOR: post-stream ─────────────────────────────────────────────────

const saveReplayMetadata: AgentTool = {
  name: "save_replay_metadata",
  description:
    "Save the finished replay metadata. Call exactly once at the end. The creator's own title is kept unless it is empty or generic, in which case suggested_title is used.",
  input_schema: {
    type: "object",
    required: ["description", "summary", "tags", "social_posts"],
    properties: {
      suggested_title: { type: "string", description: "Max 80 chars, no clickbait, no emojis" },
      description: { type: "string", description: "2-4 sentences for the replay page" },
      summary: { type: "string", description: "Bullet list of key moments with [Xm] timestamps from chat, max 6 bullets" },
      tags: { type: "array", items: { type: "string" }, description: "3-8 lowercase topic tags" },
      social_posts: {
        type: "object",
        required: ["x", "instagram", "tiktok", "linkedin"],
        properties: {
          x: { type: "string", description: "Max 260 chars" },
          instagram: { type: "string" },
          tiktok: { type: "string" },
          linkedin: { type: "string" },
        },
      },
    },
  },
  run: async (a, ctx) => {
    const { data: rec } = await supabaseAdmin
      .from("stream_recordings").select("id, title").eq("stream_id", ctx.subjectId).eq("user_id", ctx.userId).single();
    if (!rec) throw new Error("replay not found");
    const keepTitle = !DEFAULT_TITLES.has((rec.title || "").trim().toLowerCase());
    const update = {
      title: keepTitle ? rec.title : String(a.suggested_title || rec.title).slice(0, 200),
      description: String(a.description || "").slice(0, 2000),
      ai_summary: String(a.summary || "").slice(0, 3000),
      tags: (Array.isArray(a.tags) ? a.tags : []).map((t: unknown) => String(t).toLowerCase().slice(0, 30)).slice(0, 8),
      social_posts: a.social_posts || null,
      ai_status: "ready",
    };
    const { error } = await supabaseAdmin.from("stream_recordings").update(update).eq("id", rec.id);
    if (error) throw new Error(error.message);
    ctx.output = { ...ctx.output, recording_id: rec.id, ...update };
    return "Saved. You are done; reply with one short sentence.";
  },
};

async function postStreamFallback(ctx: RunContext) {
  const { data: stream } = await supabaseAdmin
    .from("streams").select("title, description").eq("id", ctx.subjectId).single();
  const tags = (stream?.title || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((w: string) => w.length > 3)
    .slice(0, 5);
  await supabaseAdmin
    .from("stream_recordings")
    .update({ description: stream?.description || "", tags, ai_status: "skipped" })
    .eq("stream_id", ctx.subjectId);
  return { summary: "Saved replay with basic details." };
}

export const postStream: Workflow = {
  id: "post-stream",
  title: "Replay publisher",
  audience: "creator",
  description: "After a stream ends: writes the replay description, key moments, tags and social posts.",
  tools: [getStreamDetails, getChatTranscript, getCreatorProfile, saveReplayMetadata],
  system: () =>
    `You are the replay publisher for Share The Link, a creator monetisation platform.
A creator just finished a live stream and the replay is now on their Media page.
Read the stream details, the chat transcript and the creator profile, then call save_replay_metadata once.
Rules: write in plain, warm British English in the creator's voice. No em dashes. No hashtags spam (max 3 on Instagram/TikTok, none on LinkedIn).
Never invent facts that are not in the stream details or chat. If chat is empty, keep the summary short and generic.
Social posts must point people to the replay on the creator's Share The Link page.`,
  kickoff: () => "Process this replay now.",
  fallback: postStreamFallback,
};

// ─── CREATOR: go-live-prep ────────────────────────────────────────────────

export const goLivePrep: Workflow = {
  id: "go-live-prep",
  title: "Go-live assistant",
  audience: "creator",
  description: "Suggests a stream title and description from the creator's profile and past streams.",
  tools: [
    getCreatorProfile,
    {
      name: "get_past_streams",
      description: "The creator's last 10 streams with peak viewers and tips.",
      input_schema: { type: "object", properties: {} },
      run: async (_a, ctx) => {
        const { data } = await supabaseAdmin
          .from("streams")
          .select("title, description, peak_viewers, total_tips, started_at")
          .eq("user_id", ctx.userId)
          .eq("status", "ended")
          .order("started_at", { ascending: false })
          .limit(10);
        return data || [];
      },
    },
    {
      name: "suggest_stream",
      description: "Return the suggestion to the creator. Call exactly once.",
      input_schema: {
        type: "object",
        required: ["title", "description"],
        properties: {
          title: { type: "string", description: "Max 70 chars" },
          description: { type: "string", description: "1-2 sentences" },
        },
      },
      run: async (a, ctx) => {
        ctx.output = { title: String(a.title).slice(0, 100), description: String(a.description).slice(0, 500) };
        return "Delivered. Reply with one short sentence.";
      },
    },
  ],
  system: (ctx) =>
    `You help creators on Share The Link start a live stream. Suggest a clear, specific title and a short description.
Base it on what performed well in past streams and the creator's bio. No em dashes, no clickbait.
${ctx.input.idea ? `The creator's rough idea: "${String(ctx.input.idea).slice(0, 300)}"` : ""}`,
  kickoff: () => "Suggest a title and description for my next stream.",
};

// ─── ADMIN: stream janitor (deterministic) ────────────────────────────────

export const streamJanitor: Workflow = {
  id: "stream-janitor",
  title: "Stream janitor",
  audience: "admin",
  description: "Ends streams whose broadcaster disconnected and lists ended streams that never got a replay.",
  scheduled: true,
  deterministic: async (ctx) => {
    const { data: ended } = await supabaseAdmin.rpc("end_stale_streams");
    const { data: recent } = await supabaseAdmin
      .from("streams")
      .select("id, title, user_id, ended_at")
      .eq("status", "ended")
      .gte("ended_at", hoursAgo(48))
      .lte("ended_at", hoursAgo(1));
    const ids = (recent || []).map((s) => s.id);
    const { data: recs } = ids.length
      ? await supabaseAdmin.from("stream_recordings").select("stream_id").in("stream_id", ids)
      : { data: [] as { stream_id: string }[] };
    const have = new Set((recs || []).map((r) => r.stream_id));
    const missing = (recent || []).filter((s) => !have.has(s.id));
    ctx.output = { stale_streams_ended: ended ?? 0, streams_missing_replay: missing };
    return {
      summary: `Ended ${ended ?? 0} stale stream(s). ${missing.length} stream(s) in the last 48h ended without a saved replay.`,
    };
  },
};

// ─── ADMIN: support triage ────────────────────────────────────────────────

export const supportTriage: Workflow = {
  id: "support-triage",
  title: "Support triage",
  audience: "admin",
  description: "Sets ticket priority and drafts replies. Replies are sent only after an admin approves them.",
  scheduled: true,
  tools: [
    {
      name: "list_open_tickets",
      description: "Open or in-progress support tickets, newest first.",
      input_schema: { type: "object", properties: { limit: { type: "number" } } },
      run: async (a) => {
        const { data } = await supabaseAdmin
          .from("support_tickets")
          .select("id, subject, category, priority, status, created_at")
          .in("status", ["open", "in_progress"])
          .order("created_at", { ascending: false })
          .limit(Math.min(Number(a.limit) || 15, 30));
        return data || [];
      },
    },
    {
      name: "get_ticket_thread",
      description: "All messages on one ticket.",
      input_schema: { type: "object", required: ["ticket_id"], properties: { ticket_id: { type: "string" } } },
      run: async (a) => {
        const { data } = await supabaseAdmin
          .from("support_messages")
          .select("sender_type, message, created_at")
          .eq("ticket_id", a.ticket_id)
          .order("created_at", { ascending: true })
          .limit(50);
        return data || [];
      },
    },
    {
      name: "set_ticket_priority",
      description: "Set priority on a ticket (internal metadata, applied immediately).",
      input_schema: {
        type: "object",
        required: ["ticket_id", "priority"],
        properties: { ticket_id: { type: "string" }, priority: { type: "string", enum: ["low", "medium", "high", "urgent"] } },
      },
      run: async (a) => {
        const { error } = await supabaseAdmin.from("support_tickets").update({ priority: a.priority }).eq("id", a.ticket_id);
        if (error) throw new Error(error.message);
        return "ok";
      },
    },
    {
      name: "reply_support_ticket",
      description: "Propose a reply to the user. Goes to the admin approval queue, not sent directly.",
      needsApproval: true,
      input_schema: {
        type: "object",
        required: ["target_id", "message", "reason"],
        properties: {
          target_id: { type: "string", description: "ticket id" },
          message: { type: "string", description: "The reply, friendly and specific, max 900 chars" },
          reason: { type: "string", description: "Why this reply, one line" },
        },
      },
      run: async () => "queued",
    },
  ],
  system: () =>
    `You are the support triage agent for Share The Link (link-in-bio, live streaming, tips, bookings, shop; 2% transaction fee).
For each open ticket whose last message is from the user: read the thread, set priority (urgent = payments/money missing or account locked; high = live streaming or payouts broken; medium = feature not working; low = questions/feedback), and propose a reply.
Skip tickets where the last message is from an admin. Never promise refunds, dates or features. No em dashes.
Finish with a short summary listing each ticket and what you did.`,
  kickoff: () => "Triage the support queue now.",
};

// ─── ADMIN: moderation ─────────────────────────────────────────────────────

export const moderation: Workflow = {
  id: "moderation",
  title: "Content moderation",
  audience: "admin",
  description: "Reviews the last 24h of chat and new replays and proposes takedowns for admin approval.",
  scheduled: true,
  tools: [
    {
      name: "list_recent_chat",
      description: "Chat messages from the last N hours (default 24).",
      input_schema: { type: "object", properties: { hours: { type: "number" } } },
      run: async (a) => {
        const { data } = await supabaseAdmin
          .from("stream_chat")
          .select("id, stream_id, username, message, created_at")
          .eq("message_type", "message")
          .gte("created_at", hoursAgo(Math.min(Number(a.hours) || 24, 72)))
          .order("created_at", { ascending: false })
          .limit(300);
        return (data || []).map((m) => `${m.id} | stream ${m.stream_id} | ${m.username}: ${m.message}`).join("\n") || "none";
      },
    },
    {
      name: "list_recent_replays",
      description: "Public replays created in the last N hours (default 24).",
      input_schema: { type: "object", properties: { hours: { type: "number" } } },
      run: async (a) => {
        const { data } = await supabaseAdmin
          .from("stream_recordings")
          .select("id, title, description, tags, user_id, created_at")
          .eq("visibility", "public")
          .gte("created_at", hoursAgo(Math.min(Number(a.hours) || 24, 72)))
          .limit(100);
        return data || [];
      },
    },
    {
      name: "delete_chat_message",
      description: "Propose deleting a chat message (hate, harassment, spam, scams, sexual content involving minors, doxxing).",
      needsApproval: true,
      input_schema: {
        type: "object",
        required: ["target_id", "reason"],
        properties: { target_id: { type: "string", description: "chat message id" }, reason: { type: "string" } },
      },
      run: async () => "queued",
    },
    {
      name: "set_recording_private",
      description: "Propose making a replay private because its title/description breaks policy.",
      needsApproval: true,
      input_schema: {
        type: "object",
        required: ["target_id", "reason"],
        properties: { target_id: { type: "string", description: "recording id" }, reason: { type: "string" } },
      },
      run: async () => "queued",
    },
  ],
  system: () =>
    `You are the trust and safety reviewer for Share The Link. Review recent chat and new public replays.
Only propose an action for clear policy violations: hate speech, harassment or threats, scams/phishing links, spam floods, sexual content, sharing someone's private info.
Banter, swearing without a target, and criticism are fine. When unsure, do not propose an action; mention it in the summary instead.
Finish with a summary: counts reviewed, actions proposed, anything borderline.`,
  kickoff: () => "Run the daily moderation review.",
};

// ─── ADMIN: daily digest ───────────────────────────────────────────────────

export const dailyDigest: Workflow = {
  id: "daily-digest",
  title: "Daily digest",
  audience: "admin",
  description: "Yesterday's numbers (signups, streams, replays, tips, tickets, agent failures) and what needs attention.",
  scheduled: true,
  tools: [
    {
      name: "get_platform_metrics",
      description: "Counts for the last 24h and the 7 days before it.",
      input_schema: { type: "object", properties: {} },
      run: async () => {
        const count = async (table: string, col: string, from: string, to?: string, extra?: (q: any) => any) => {
          let q = supabaseAdmin.from(table).select("*", { count: "exact", head: true }).gte(col, from);
          if (to) q = q.lt(col, to);
          if (extra) q = extra(q);
          const { count: c } = await q;
          return c ?? 0;
        };
        const d1 = hoursAgo(24), d8 = hoursAgo(24 * 8);
        const tipsSum = async (from: string, to?: string) => {
          let q = supabaseAdmin.from("stream_tips").select("amount").gte("created_at", from);
          if (to) q = q.lt("created_at", to);
          const { data } = await q;
          return (data || []).reduce((s: number, r: any) => s + Number(r.amount || 0), 0);
        };
        return {
          last_24h: {
            new_profiles: await count("profiles", "created_at", d1),
            streams_started: await count("streams", "started_at", d1),
            replays_saved: await count("stream_recordings", "created_at", d1),
            stream_tips_total: await tipsSum(d1),
            tickets_opened: await count("support_tickets", "created_at", d1),
            agent_runs_failed: await count("agent_runs", "created_at", d1, undefined, (q) => q.eq("status", "failed")),
          },
          previous_7_days_daily_avg: {
            new_profiles: (await count("profiles", "created_at", d8, d1)) / 7,
            streams_started: (await count("streams", "started_at", d8, d1)) / 7,
            replays_saved: (await count("stream_recordings", "created_at", d8, d1)) / 7,
            stream_tips_total: (await tipsSum(d8, d1)) / 7,
          },
          open_tickets: await count("support_tickets", "created_at", "1970-01-01", undefined, (q) => q.in("status", ["open", "in_progress"])),
          pending_agent_approvals: await count("agent_actions", "created_at", "1970-01-01", undefined, (q) => q.eq("status", "pending")),
        };
      },
    },
  ],
  system: () =>
    `You write the founder's daily digest for Share The Link. Get the metrics, then write a short digest:
1) Headline (one line). 2) Numbers vs 7-day average, as a compact list with up/down. 3) "Needs you today": max 3 items (open tickets, pending approvals, failed agent runs, drops worth checking).
Plain British English, no em dashes, no fluff. Do not invent numbers.`,
  kickoff: () => "Write today's digest.",
};

// ─── Registry ──────────────────────────────────────────────────────────────

export const WORKFLOWS: Record<string, Workflow> = Object.fromEntries(
  [postStream, goLivePrep, streamJanitor, supportTriage, moderation, dailyDigest].map((w) => [w.id, w])
);

/** Execute an approved agent_actions row. */
export async function executeAction(action: { action: string; target_id: string; payload: any }, adminId: string): Promise<string> {
  switch (action.action) {
    case "reply_support_ticket": {
      const message = String(action.payload?.message || "").slice(0, 2000);
      if (!message) throw new Error("empty reply");
      const { error } = await supabaseAdmin.from("support_messages").insert({
        ticket_id: action.target_id,
        sender_id: adminId,
        sender_type: "admin",
        message,
      });
      if (error) throw new Error(error.message);
      await supabaseAdmin.from("support_tickets").update({ status: "in_progress" }).eq("id", action.target_id);
      return "Reply sent";
    }
    case "delete_chat_message": {
      const { error } = await supabaseAdmin.from("stream_chat").delete().eq("id", action.target_id);
      if (error) throw new Error(error.message);
      return "Message deleted";
    }
    case "set_recording_private": {
      const { error } = await supabaseAdmin.from("stream_recordings").update({ visibility: "private" }).eq("id", action.target_id);
      if (error) throw new Error(error.message);
      return "Replay set to private";
    }
    default:
      throw new Error(`No executor for ${action.action}`);
  }
}
