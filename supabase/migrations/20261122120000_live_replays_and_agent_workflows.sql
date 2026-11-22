-- =============================================================================
-- Live replays + AI agent workflows
--   1. stream_recordings: AI metadata columns, one replay per stream, realtime
--   2. end_stale_streams(): ends "live" streams whose heartbeat stopped
--   3. agent_runs / agent_actions: run log + human-approval queue for agents
-- Safe to re-run (IF NOT EXISTS / guarded blocks).
-- =============================================================================

-- 1. stream_recordings ---------------------------------------------------------
ALTER TABLE public.stream_recordings
  ADD COLUMN IF NOT EXISTS ai_status text NOT NULL DEFAULT 'none',   -- none | pending | ready | failed | skipped
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS social_posts jsonb,
  ADD COLUMN IF NOT EXISTS size_bytes bigint;

-- One replay per stream (finalize upserts on this). Remove older duplicates first.
DELETE FROM public.stream_recordings a
USING public.stream_recordings b
WHERE a.stream_id = b.stream_id
  AND (a.created_at < b.created_at OR (a.created_at = b.created_at AND a.id < b.id));

CREATE UNIQUE INDEX IF NOT EXISTS stream_recordings_stream_id_key
  ON public.stream_recordings (stream_id);

-- Stream replays were also copied into user_videos, which showed every replay
-- twice on the dashboard Media page. Remove those copies.
DELETE FROM public.user_videos v
USING public.stream_recordings r
WHERE v.user_id = r.user_id
  AND v.video_url = r.video_url;

-- Let the Media pages update live when a replay lands
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'stream_recordings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_recordings;
  END IF;
END $$;

-- 2. Stale stream cleanup --------------------------------------------------------
-- The broadcaster heartbeats streams.updated_at every 30s. If the tab crashed or
-- closed, the stream would stay "live" forever. Anyone may call this: it only
-- ends streams with no heartbeat for 3 minutes.
CREATE OR REPLACE FUNCTION public.end_stale_streams()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  UPDATE public.streams
     SET status = 'ended',
         ended_at = COALESCE(ended_at, updated_at)
   WHERE status = 'live'
     AND updated_at < now() - interval '3 minutes';
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.end_stale_streams() FROM public;
GRANT EXECUTE ON FUNCTION public.end_stale_streams() TO anon, authenticated, service_role;

-- 3. Agent run log ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('creator', 'admin')),
  user_id uuid REFERENCES auth.users (id) ON DELETE CASCADE,   -- creator the run is for, or admin who ran it
  subject_id text,                                               -- e.g. stream id
  trigger text NOT NULL DEFAULT 'manual' CHECK (trigger IN ('manual', 'event', 'cron')),
  status text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'succeeded', 'failed')),
  summary text,
  output jsonb NOT NULL DEFAULT '{}'::jsonb,
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  error text,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS agent_runs_user_idx ON public.agent_runs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_runs_workflow_idx ON public.agent_runs (workflow, created_at DESC);

-- Actions an agent wants to take that need a human yes first
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid REFERENCES public.agent_runs (id) ON DELETE CASCADE,
  action text NOT NULL,          -- set_recording_private | delete_chat_message | end_stream | reply_support_ticket
  target_id text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'rejected', 'executed', 'failed')),
  decided_by uuid REFERENCES auth.users (id),
  decided_at timestamptz,
  result text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_actions_status_idx ON public.agent_actions (status, created_at DESC);

ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;

-- Writes happen only through the service role in /api/agents.
DROP POLICY IF EXISTS "Creators read own agent runs" ON public.agent_runs;
CREATE POLICY "Creators read own agent runs" ON public.agent_runs
  FOR SELECT TO authenticated
  USING (audience = 'creator' AND user_id = auth.uid());

DROP POLICY IF EXISTS "Admins read all agent runs" ON public.agent_runs;
CREATE POLICY "Admins read all agent runs" ON public.agent_runs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));

DROP POLICY IF EXISTS "Admins read agent actions" ON public.agent_actions;
CREATE POLICY "Admins read agent actions" ON public.agent_actions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users au WHERE au.user_id = auth.uid()));
