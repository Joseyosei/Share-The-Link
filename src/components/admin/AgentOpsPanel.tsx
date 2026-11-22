/**
 * Admin > AI Agents
 * Run workflows on demand, approve/reject what agents want to do, read the run log.
 */
import { useCallback, useEffect, useState } from "react";
import { Bot, Play, Check, X, Loader2, RefreshCw, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/lib/auth-fetch";

interface WorkflowInfo {
  id: string;
  title: string;
  audience: "creator" | "admin";
  description: string;
  scheduled: boolean;
}

interface AgentRun {
  id: string;
  workflow: string;
  audience: string;
  trigger: string;
  status: "running" | "succeeded" | "failed";
  summary: string | null;
  error: string | null;
  steps: Array<{ type: string; name?: string; result?: string }>;
  tokens_in: number;
  tokens_out: number;
  created_at: string;
}

interface PendingAction {
  id: string;
  action: string;
  target_id: string;
  payload: Record<string, unknown>;
  reason: string | null;
  created_at: string;
  agent_runs?: { workflow: string } | null;
}

const API = "/api/ai-agent?action=agents";

const ACTION_LABELS: Record<string, string> = {
  reply_support_ticket: "Send support reply",
  delete_chat_message: "Delete chat message",
  set_recording_private: "Make replay private",
};

export const AgentOpsPanel = () => {
  const { toast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowInfo[]>([]);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [pending, setPending] = useState<PendingAction[]>([]);
  const [running, setRunning] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, r, p] = await Promise.all([
        authFetch(`${API}&op=list`).then((x) => x.json()),
        authFetch(`${API}&op=runs&limit=40`).then((x) => x.json()),
        authFetch(`${API}&op=pending`).then((x) => x.json()),
      ]);
      setWorkflows(w.workflows || []);
      setRuns(r.runs || []);
      setPending(p.actions || []);
    } catch {
      toast({ title: "Could not load agents", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const runNow = async (id: string) => {
    setRunning(id);
    try {
      const res = await authFetch(`${API}&op=run`, { method: "POST", body: JSON.stringify({ workflow: id }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Run failed");
      toast({
        title: json.run?.status === "succeeded" ? "Run finished" : "Run failed",
        description: (json.run?.summary || json.run?.error || "").slice(0, 200),
        variant: json.run?.status === "succeeded" ? "default" : "destructive",
      });
      if (json.run?.id) setExpanded(json.run.id);
    } catch (e) {
      toast({ title: "Run failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
    } finally {
      setRunning(null);
      load();
    }
  };

  const decide = async (actionId: string, decision: "approve" | "reject") => {
    setDeciding(actionId);
    try {
      const res = await authFetch(`${API}&op=decide`, {
        method: "POST",
        body: JSON.stringify({ action_id: actionId, decision }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      toast({ title: decision === "approve" ? json.action?.result || "Done" : "Rejected" });
      setPending((prev) => prev.filter((a) => a.id !== actionId));
    } catch (e) {
      toast({ title: "Action failed", description: e instanceof Error ? e.message : "", variant: "destructive" });
      load();
    } finally {
      setDeciding(null);
    }
  };

  const adminWorkflows = workflows.filter((w) => w.audience === "admin");
  const creatorWorkflows = workflows.filter((w) => w.audience === "creator");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Bot className="w-5 h-5" /> AI Agents
          </h2>
          <p className="text-sm text-muted-foreground">
            Admin agents run daily at 07:00 UTC. Anything that touches users waits for your approval below.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {/* Approvals */}
      <section>
        <h3 className="font-semibold mb-3">Waiting for approval ({pending.length})</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing to approve.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4 flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge>{ACTION_LABELS[a.action] || a.action}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {a.agent_runs?.workflow} · {new Date(a.created_at).toLocaleString()}
                      </span>
                    </div>
                    {a.reason && <p className="text-sm">{a.reason}</p>}
                    {typeof a.payload?.message === "string" && (
                      <p className="text-sm bg-muted rounded p-2 whitespace-pre-line">{a.payload.message}</p>
                    )}
                    <p className="text-xs text-muted-foreground font-mono truncate">target: {a.target_id}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => decide(a.id, "approve")} disabled={deciding === a.id}>
                      {deciding === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => decide(a.id, "reject")} disabled={deciding === a.id}>
                      <X className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Workflows */}
      <section>
        <h3 className="font-semibold mb-3">Workflows</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {adminWorkflows.map((w) => (
            <Card key={w.id}>
              <CardContent className="p-4 flex gap-3 justify-between items-start">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {w.title}
                    {w.scheduled && <Badge variant="outline" className="text-[10px]"><Clock className="w-3 h-3 mr-1" />daily</Badge>}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{w.description}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => runNow(w.id)} disabled={!!running}>
                  {running === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
          {creatorWorkflows.map((w) => (
            <Card key={w.id} className="bg-muted/40">
              <CardContent className="p-4">
                <p className="font-medium flex items-center gap-2">
                  {w.title} <Badge variant="secondary" className="text-[10px]">creator</Badge>
                </p>
                <p className="text-xs text-muted-foreground mt-1">{w.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Run log */}
      <section>
        <h3 className="font-semibold mb-3">Recent runs</h3>
        <div className="space-y-2">
          {runs.length === 0 && <p className="text-sm text-muted-foreground">No runs yet.</p>}
          {runs.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-3">
                <button className="w-full text-left" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.status === "succeeded" ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : r.status === "failed" ? (
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    <span className="font-medium text-sm">{r.workflow}</span>
                    <Badge variant="outline" className="text-[10px]">{r.trigger}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {(r.tokens_in + r.tokens_out).toLocaleString()} tokens
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">
                    {r.error ? `${r.summary || ""} ${r.error}` : r.summary}
                  </p>
                </button>
                {expanded === r.id && (
                  <div className="mt-3 border-t pt-3 space-y-2">
                    {r.summary && <p className="text-sm whitespace-pre-line">{r.summary}</p>}
                    {(r.steps || []).map((s, i) => (
                      <div key={i} className="text-xs font-mono bg-muted rounded p-2">
                        <span className="font-semibold">{s.type}{s.name ? ` · ${s.name}` : ""}</span>
                        {s.result && <div className="whitespace-pre-wrap break-words mt-1 text-muted-foreground">{s.result}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AgentOpsPanel;
