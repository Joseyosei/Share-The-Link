# ⏰ AI AGENT SCHEDULER - Automated Link Distribution

## SUPABASE EDGE FUNCTION FOR SCHEDULED SHARING

### File: supabase/functions/ai-agent-scheduler/index.ts

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all pending scheduled shares that are due
    const { data: scheduledShares, error } = await supabase
      .from('scheduled_shares')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(10); // Process 10 at a time

    if (error) throw error;

    if (!scheduledShares || scheduledShares.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No shares to process' }),
        { status: 200 }
      );
    }

    const results = [];

    for (const share of scheduledShares) {
      // Mark as processing
      await supabase
        .from('scheduled_shares')
        .update({ status: 'processing' })
        .eq('id', share.id);

      try {
        // Get link details
        const { data: link } = await supabase
          .from('links')
          .select('*')
          .eq('id', share.link_id)
          .single();

        if (!link) {
          throw new Error('Link not found');
        }

        // Get platform credentials
        const { data: credentials } = await supabase
          .from('platform_credentials')
          .select('*')
          .eq('creator_id', share.creator_id)
          .in('platform_name', share.platforms);

        if (!credentials || credentials.length === 0) {
          throw new Error('No platform credentials found');
        }

        // Call distribution API
        const distributionUrl = `${Deno.env.get('PUBLIC_SITE_URL')}/api/ai-agent/distribute-link`;
        
        const response = await fetch(distributionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            linkId: share.link_id,
            platforms: share.platforms,
            creatorId: share.creator_id,
          }),
        });

        const distributionResult = await response.json();

        // Update scheduled share
        await supabase
          .from('scheduled_shares')
          .update({
            status: 'completed',
            executed_at: new Date().toISOString(),
            results: distributionResult,
          })
          .eq('id', share.id);

        results.push({
          shareId: share.id,
          success: true,
          result: distributionResult,
        });

      } catch (shareError) {
        // Mark as failed
        await supabase
          .from('scheduled_shares')
          .update({
            status: 'failed',
            executed_at: new Date().toISOString(),
            results: { error: shareError.message },
          })
          .eq('id', share.id);

        results.push({
          shareId: share.id,
          success: false,
          error: shareError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
```

---

## SETUP CRON JOB

### Option 1: Supabase Cron (Recommended)

```sql
-- Run every 5 minutes
select cron.schedule(
  'ai-agent-scheduler',
  '*/5 * * * *', -- Every 5 minutes
  $$
  select
    net.http_post(
      url:='https://YOUR_PROJECT.supabase.co/functions/v1/ai-agent-scheduler',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

### Option 2: Vercel Cron

```typescript
// app/api/cron/ai-agent-scheduler/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Call Supabase Edge Function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-agent-scheduler`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const result = await response.json();

  return NextResponse.json(result);
}

// Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/ai-agent-scheduler",
//     "schedule": "*/5 * * * *"
//   }]
// }
```

---

## AUTO-SHARE ON NEW LINK

### Database Trigger

```sql
create or replace function auto_schedule_new_link()
returns trigger as $$
declare
  creator_platforms text[];
  optimal_time time;
begin
  -- Check if creator has auto-share enabled
  select array_agg(platform_name)
  into creator_platforms
  from platform_settings
  where creator_id = new.creator_id
    and auto_share = true;

  if array_length(creator_platforms, 1) > 0 then
    -- Get optimal posting time (default to 2 hours from now)
    select coalesce(
      (select optimal_time from platform_settings 
       where creator_id = new.creator_id 
       limit 1),
      (current_time + interval '2 hours')::time
    ) into optimal_time;

    -- Schedule the share
    insert into scheduled_shares (
      link_id,
      creator_id,
      platforms,
      scheduled_for,
      status
    ) values (
      new.id,
      new.creator_id,
      creator_platforms,
      (current_date + optimal_time::interval),
      'pending'
    );
  end if;

  return new;
end;
$$ language plpgsql;

create trigger on_new_link_auto_share
  after insert on links
  for each row
  when (new.is_active = true)
  execute function auto_schedule_new_link();
```

---

## MONITORING & ALERTS

### Failed Shares Alert

```sql
create or replace function notify_failed_shares()
returns trigger as $$
begin
  if new.status = 'failed' then
    -- Send notification (implement via Edge Function)
    perform pg_notify(
      'failed_share',
      json_build_object(
        'share_id', new.id,
        'creator_id', new.creator_id,
        'link_id', new.link_id,
        'error', new.results->>'error'
      )::text
    );
  end if;
  return new;
end;
$$ language plpgsql;

create trigger on_share_failed
  after update on scheduled_shares
  for each row
  when (new.status = 'failed' and old.status != 'failed')
  execute function notify_failed_shares();
```

---

## TESTING

### Test Scheduled Share

```sql
-- Schedule a test share for 1 minute from now
insert into scheduled_shares (
  link_id,
  creator_id,
  platforms,
  scheduled_for,
  status
) values (
  'YOUR_LINK_ID',
  auth.uid(),
  ARRAY['openclaw', 'clawdbot'],
  now() + interval '1 minute',
  'pending'
);

-- Check after 1 minute
select * from scheduled_shares
where id = 'THE_ID_FROM_ABOVE'
and status = 'completed';
```

---

## MANUAL TRIGGER

### API Route for Manual Execution

```typescript
// app/api/ai-agent/run-scheduler/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Call the scheduler function
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ai-agent-scheduler`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    }
  );

  const result = await response.json();

  return NextResponse.json(result);
}
```

---

## HEALTH CHECK

```sql
-- Check scheduler health
select 
  count(*) filter (where status = 'pending') as pending,
  count(*) filter (where status = 'processing') as processing,
  count(*) filter (where status = 'completed') as completed,
  count(*) filter (where status = 'failed') as failed,
  count(*) filter (where scheduled_for < now() and status = 'pending') as overdue
from scheduled_shares
where created_at >= now() - interval '24 hours';
```

---

**SCHEDULER READY!** ⏰

Your AI agent will now automatically distribute links at optimal times!
