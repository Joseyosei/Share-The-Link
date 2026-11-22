/**
 * Agent runtime for Share The Link.
 *
 * A workflow = system prompt + tools + a kickoff prompt. The runtime runs a
 * Claude tool-use loop, logs every step to `agent_runs`, and enforces one rule:
 * tools marked `needsApproval` never execute directly. They write a row to
 * `agent_actions` and wait for an admin to approve it in the Admin panel.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseAdmin: SupabaseClient = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const AGENT_MODEL = process.env.AGENT_MODEL || "claude-sonnet-5-5";
const MAX_STEPS = 8;

export type Audience = "creator" | "admin";
export type Trigger = "manual" | "event" | "cron";

export interface RunContext {
  runId: string;
  workflow: string;
  audience: Audience;
  userId: string | null;       // creator the run is for, or admin who triggered it
  subjectId: string | null;    // e.g. stream id
  input: Record<string, unknown>;
  output: Record<string, unknown>; // tools may write structured results here
}

export interface AgentTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  /** If true the call is queued in agent_actions for a human to approve. */
  needsApproval?: boolean;
  run: (args: any, ctx: RunContext) => Promise<unknown>;
}

export interface Workflow {
  id: string;
  title: string;
  audience: Audience;
  description: string;
  /** Runs without the LLM (e.g. janitor). If present, `tools/system` are ignored. */
  deterministic?: (ctx: RunContext) => Promise<{ summary: string }>;
  system?: (ctx: RunContext) => string;
  kickoff?: (ctx: RunContext) => string;
  tools?: AgentTool[];
  /** Called when the LLM is unavailable (no API key), so the product still works. */
  fallback?: (ctx: RunContext) => Promise<{ summary: string }>;
  /** Included in the daily cron. */
  scheduled?: boolean;
}

interface StepLog {
  at: string;
  type: "tool" | "queued" | "text" | "error";
  name?: string;
  input?: unknown;
  result?: string;
}

const truncate = (s: string, n = 4000) => (s.length > n ? `${s.slice(0, n)}... [truncated]` : s);

async function callClaude(system: string, messages: any[], tools: AgentTool[]) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: AGENT_MODEL,
      max_tokens: 2000,
      system,
      messages,
      tools: tools.map(({ name, description, input_schema }) => ({ name, description, input_schema })),
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Claude API ${res.status}: ${truncate(text, 300)}`);
  }
  return res.json();
}

/** Run a workflow end to end and return the finished run row. */
export async function runWorkflow(
  wf: Workflow,
  opts: { userId: string | null; subjectId?: string | null; trigger: Trigger; input?: Record<string, unknown> }
) {
  const { data: run, error } = await supabaseAdmin
    .from("agent_runs")
    .insert({
      workflow: wf.id,
      audience: wf.audience,
      user_id: opts.userId,
      subject_id: opts.subjectId ?? null,
      trigger: opts.trigger,
      status: "running",
    })
    .select("id")
    .single();
  if (error || !run) throw new Error(`Could not start run: ${error?.message}`);

  const ctx: RunContext = {
    runId: run.id,
    workflow: wf.id,
    audience: wf.audience,
    userId: opts.userId,
    subjectId: opts.subjectId ?? null,
    input: opts.input || {},
    output: {},
  };
  const steps: StepLog[] = [];
  let tokensIn = 0;
  let tokensOut = 0;

  const finish = async (status: "succeeded" | "failed", summary: string, err?: string) => {
    const { data } = await supabaseAdmin
      .from("agent_runs")
      .update({
        status,
        summary: truncate(summary, 8000),
        output: ctx.output,
        steps,
        error: err ?? null,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        finished_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .select("*")
      .single();
    return data;
  };

  try {
    if (wf.deterministic) {
      const { summary } = await wf.deterministic(ctx);
      return await finish("succeeded", summary);
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      if (wf.fallback) {
        const { summary } = await wf.fallback(ctx);
        return await finish("succeeded", `${summary} (ran without AI: ANTHROPIC_API_KEY is not set)`);
      }
      throw new Error("ANTHROPIC_API_KEY is not set");
    }

    const tools = wf.tools || [];
    const messages: any[] = [{ role: "user", content: wf.kickoff!(ctx) }];
    let finalText = "";

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await callClaude(wf.system!(ctx), messages, tools);
      tokensIn += response.usage?.input_tokens || 0;
      tokensOut += response.usage?.output_tokens || 0;

      const content: any[] = response.content || [];
      const text = content.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      if (text) {
        finalText = text;
        steps.push({ at: new Date().toISOString(), type: "text", result: truncate(text, 1500) });
      }

      const toolUses = content.filter((b) => b.type === "tool_use");
      if (toolUses.length === 0 || response.stop_reason !== "tool_use") break;

      messages.push({ role: "assistant", content });
      const results: any[] = [];

      for (const use of toolUses) {
        const tool = tools.find((t) => t.name === use.name);
        let resultText: string;
        try {
          if (!tool) throw new Error(`Unknown tool ${use.name}`);
          if (tool.needsApproval) {
            const { reason, target_id, ...payload } = use.input || {};
            await supabaseAdmin.from("agent_actions").insert({
              run_id: run.id,
              action: tool.name,
              target_id: String(target_id ?? ""),
              payload,
              reason: typeof reason === "string" ? reason.slice(0, 1000) : null,
            });
            resultText = "Queued for admin approval. Do not repeat this action.";
            steps.push({ at: new Date().toISOString(), type: "queued", name: tool.name, input: use.input });
          } else {
            const out = await tool.run(use.input || {}, ctx);
            resultText = truncate(typeof out === "string" ? out : JSON.stringify(out));
            steps.push({ at: new Date().toISOString(), type: "tool", name: tool.name, input: use.input, result: truncate(resultText, 800) });
          }
        } catch (e) {
          resultText = `Error: ${e instanceof Error ? e.message : String(e)}`;
          steps.push({ at: new Date().toISOString(), type: "error", name: use.name, result: resultText });
        }
        results.push({ type: "tool_result", tool_use_id: use.id, content: resultText });
      }
      messages.push({ role: "user", content: results });
    }

    return await finish("succeeded", finalText || "Done.");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    steps.push({ at: new Date().toISOString(), type: "error", result: msg });
    // Keep the product working even when the LLM call fails
    if (wf.fallback) {
      try {
        const { summary } = await wf.fallback(ctx);
        return await finish("failed", `${summary} (AI step failed, fallback used)`, msg);
      } catch {
        /* fall through */
      }
    }
    return await finish("failed", "Run failed.", msg);
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.from("admin_users").select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}
