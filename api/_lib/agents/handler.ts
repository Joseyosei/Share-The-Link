/**
 * Agent workflows API, mounted at /api/ai-agent?action=agents&op=...
 * (kept inside an existing function: the Vercel Hobby plan allows 12 functions).
 *
 * GET  ?op=list                     Workflows available to the caller
 * POST ?op=run   {workflow, ...}    Run a workflow now
 *        creator workflows: post-stream {stream_id}, go-live-prep {idea?}
 *        admin workflows (admins only): stream-janitor, support-triage, moderation, daily-digest
 * GET  ?op=runs&limit=30            Recent runs (admins: all, creators: own)
 * GET  ?op=pending                  Actions waiting for approval (admins)
 * POST ?op=decide {action_id, decision: "approve"|"reject"} (admins)
 * GET  ?op=cron                     Vercel Cron (Authorization: Bearer CRON_SECRET)
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handleCors } from "../cors.js";
import { verifyAuth, unauthorized } from "../auth.js";
import { isRateLimited, getClientIp, tooManyRequests } from "../rate-limit.js";
import { isValidUUID, sanitizeString } from "../validate.js";
import { supabaseAdmin, runWorkflow, isAdmin } from "./runtime.js";
import { WORKFLOWS, executeAction } from "./workflows.js";

export async function agentsHandler(req: VercelRequest, res: VercelResponse) {
  const action = String(req.query.op || "");

  // Cron is called by Vercel, not the browser
  if (action === "cron") return cron(req, res);

  if (handleCors(req, res)) return;
  if (isRateLimited(getClientIp(req), 30)) return tooManyRequests(res);

  const auth = await verifyAuth(req);
  if (!auth) return unauthorized(res);
  const admin = await isAdmin(auth.userId);

  try {
    switch (action) {
      case "list":
        return res.status(200).json({
          workflows: Object.values(WORKFLOWS)
            .filter((w) => w.audience === "creator" || admin)
            .map(({ id, title, audience, description, scheduled }) => ({ id, title, audience, description, scheduled: !!scheduled })),
        });

      case "run": {
        if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
        const wf = WORKFLOWS[String(req.body?.workflow || "")];
        if (!wf) return res.status(400).json({ error: "Unknown workflow" });
        if (wf.audience === "admin" && !admin) return res.status(403).json({ error: "Admins only" });

        let subjectId: string | null = null;
        if (wf.id === "post-stream") {
          subjectId = String(req.body?.stream_id || "");
          if (!isValidUUID(subjectId)) return res.status(400).json({ error: "stream_id required" });
          const { data: rec } = await supabaseAdmin
            .from("stream_recordings").select("id").eq("stream_id", subjectId).eq("user_id", auth.userId).maybeSingle();
          if (!rec) return res.status(404).json({ error: "Replay not found" });
          await supabaseAdmin.from("stream_recordings").update({ ai_status: "pending" }).eq("id", rec.id);
        }

        const run = await runWorkflow(wf, {
          userId: auth.userId,
          subjectId,
          trigger: "manual",
          input: { idea: sanitizeString(req.body?.idea, 300) },
        });
        if (wf.id === "post-stream" && subjectId) {
          await supabaseAdmin.from("stream_recordings").update({ ai_status: "failed" }).eq("stream_id", subjectId).eq("ai_status", "pending");
        }
        return res.status(200).json({ run });
      }

      case "runs": {
        const limit = Math.min(Number(req.query.limit) || 30, 100);
        let q = supabaseAdmin.from("agent_runs").select("*").order("created_at", { ascending: false }).limit(limit);
        if (!admin) q = q.eq("audience", "creator").eq("user_id", auth.userId);
        const { data } = await q;
        return res.status(200).json({ runs: data || [] });
      }

      case "pending": {
        if (!admin) return res.status(403).json({ error: "Admins only" });
        const { data } = await supabaseAdmin
          .from("agent_actions").select("*, agent_runs(workflow)").eq("status", "pending").order("created_at", { ascending: false }).limit(100);
        return res.status(200).json({ actions: data || [] });
      }

      case "decide": {
        if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
        if (!admin) return res.status(403).json({ error: "Admins only" });
        const id = String(req.body?.action_id || "");
        const decision = req.body?.decision;
        if (!isValidUUID(id) || !["approve", "reject"].includes(decision)) return res.status(400).json({ error: "Bad request" });

        // Claim the row atomically so a double click can't execute twice
        const { data: claimed } = await supabaseAdmin
          .from("agent_actions")
          .update({ status: decision === "reject" ? "rejected" : "executed", decided_by: auth.userId, decided_at: new Date().toISOString() })
          .eq("id", id)
          .eq("status", "pending")
          .select("*")
          .maybeSingle();
        if (!claimed) return res.status(409).json({ error: "Already decided" });
        if (decision === "reject") return res.status(200).json({ action: claimed });

        try {
          const result = await executeAction(claimed, auth.userId);
          await supabaseAdmin.from("agent_actions").update({ result }).eq("id", id);
          return res.status(200).json({ action: { ...claimed, result } });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await supabaseAdmin.from("agent_actions").update({ status: "failed", result: msg }).eq("id", id);
          return res.status(500).json({ error: msg });
        }
      }

      default:
        return res.status(400).json({ error: "Unknown action" });
    }
  } catch (e) {
    console.error("agents API error:", e);
    return res.status(500).json({ error: e instanceof Error ? e.message : "Agent error" });
  }
}

async function cron(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: "Unauthorized" });

  // Janitor first (cheap, no AI), then the AI workflows in parallel
  const results: Record<string, string> = {};
  const janitor = await runWorkflow(WORKFLOWS["stream-janitor"], { userId: null, trigger: "cron" }).catch((e) => ({ status: "failed", summary: String(e) }));
  results["stream-janitor"] = janitor?.status || "failed";

  const scheduled = Object.values(WORKFLOWS).filter((w) => w.scheduled && w.id !== "stream-janitor");
  const settled = await Promise.allSettled(scheduled.map((w) => runWorkflow(w, { userId: null, trigger: "cron" })));
  settled.forEach((s, i) => {
    results[scheduled[i].id] = s.status === "fulfilled" ? s.value?.status || "unknown" : "failed";
  });
  return res.status(200).json({ ok: true, results });
}
