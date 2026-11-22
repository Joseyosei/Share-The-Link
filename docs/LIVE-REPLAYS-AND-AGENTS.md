# Live streaming, replays and AI agent workflows

## What was broken

| # | Symptom | Root cause | Fix |
|---|---------|------------|-----|
| 1 | Go Live showed no video / nothing recorded | `vercel.json` sent `Permissions-Policy: camera=()`, which blocks the camera on every page | `camera=(self)`, `display-capture=(self)` |
| 2 | Viewers who opened `/live/:username` early never saw the stream | Viewer sent `viewer-join` once; if the creator was not broadcasting yet it was lost. Page also checked "is live?" once and never again | Broadcaster announces `broadcaster-ready` (on subscribe + every 8s), viewer re-joins every 6s until connected, fresh peer per offer, page auto-switches to the player via realtime + 10s poll |
| 3 | Black player for viewers | Unmuted autoplay is blocked by browsers | Falls back to muted playback with a "Tap to unmute" chip |
| 4 | Replay never reached the Media page | Recording was POSTed through a serverless function: Vercel rejects bodies over 4.5 MB (any stream longer than a few seconds) | Browser uploads straight to Vercel Blob (multipart) with a short-lived token, then a JSON `finalize` call writes `stream_recordings` |
| 5 | Even small uploads failed | MIME check compared `video/webm;codecs=vp9,opus` to `video/webm` | Codec params stripped |
| 6 | Long streams lost | 500 MB cap at 2.5 Mbps ended recording at ~27 min, and the auto-stopped chunks were discarded | 1.5 GB cap at 1.5 Mbps (~2h), chunks kept if the cap is hit |
| 7 | Upload died when the page changed | The player unmounted right after End Stream while uploading in the background | Player stays up with a progress bar until saved, warns before closing the tab, offers Retry / Download on failure |
| 8 | Replays showed twice on My Media | Recording inserted into both `user_videos` and `stream_recordings` | Only `stream_recordings`; migration removes old duplicates |
| 9 | Streams stuck "live" forever after a crash | Nothing ended streams with a dead heartbeat | `end_stale_streams()` RPC (3 min without heartbeat), called by the Media and Live pages and the daily janitor |

`/media` and `/dashboard/media` now update in real time when a stream starts, ends, or a replay lands.

## Agent workflows

All agents live in `api/_lib/agents/` and are served from the existing `api/ai-agent.ts` function
(`?action=agents&op=...`) because the Vercel Hobby plan allows 12 functions and the repo already uses 12.

| Workflow | Who | Trigger | What it does | Needs approval |
|----------|-----|---------|--------------|----------------|
| `post-stream` | Creator | Automatic when a replay is saved; "Regenerate" on My Media | Reads stream stats + chat, writes description, key moments with timestamps, tags, and X / Instagram / TikTok / LinkedIn posts. Keeps the creator's title unless it is generic | No (creator's own content) |
| `go-live-prep` | Creator | "Suggest with AI" in the Go Live dialog | Title + description from profile and best past streams | No |
| `stream-janitor` | Admin | Daily cron + Run now | Ends stale streams, lists streams that ended without a replay | No (deterministic, no AI) |
| `support-triage` | Admin | Daily cron + Run now | Sets ticket priority, drafts replies | Replies: yes |
| `moderation` | Admin | Daily cron + Run now | Reviews last 24h chat + new public replays | Deletes / make-private: yes |
| `daily-digest` | Admin | Daily cron + Run now | Signups, streams, replays, tips, tickets vs 7-day average; what needs you today | No |

Every run is logged in `agent_runs` (steps, tokens, errors). Any tool marked `needsApproval` writes to
`agent_actions` instead of executing; an admin approves or rejects it in **Admin > AI Agents**.

## Setup (one time)

1. **Run the migration** `supabase/migrations/20261122120000_live_replays_and_agent_workflows.sql`
   (Supabase SQL editor or `supabase db push`). It needs the existing `admin_users` and `user_videos` tables.
2. **Vercel environment variables**
   - `BLOB_READ_WRITE_TOKEN`: already used by uploads; confirm it is set
   - `ANTHROPIC_API_KEY`: already used by the AI assistant
   - `CRON_SECRET`: any long random string; Vercel sends it to the cron automatically
   - `AGENT_MODEL` (optional): defaults to `claude-sonnet-5-5`
3. **Make sure you are an admin**: a row for your user in `admin_users`.
4. Deploy. The cron runs daily at 07:00 UTC (`vercel.json > crons`; daily fits the Hobby plan).

Without `ANTHROPIC_API_KEY` everything still works: replays save with basic details and the janitor runs.

## Test checklist

1. Creator: Streaming > Go Live, allow camera. Status flips to LIVE.
2. Viewer (another browser / incognito) opened `/live/<username>` *before* step 1: the player appears on its own within ~10 s.
3. End Stream: progress bar to 100%, toast "Replay saved". Viewer sees "Stream has ended".
4. `/dashboard/media`: replay appears without refreshing, shows "AI is writing details...", then tags + "Social posts".
5. Admin > AI Agents: run each workflow, approve one queued action.
