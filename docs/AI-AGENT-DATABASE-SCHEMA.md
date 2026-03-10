# 🗄️ DATABASE SCHEMA - AI AGENT SYSTEM

## Run these SQL commands in Supabase:

---

## 1. PLATFORM CREDENTIALS TABLE

```sql
-- Store creator's API keys for different platforms
create table public.platform_credentials (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  platform_name text not null check (platform_name in (
    'openclaw', 'clawdbot', 'moltbot', 
    'twitter', 'linkedin', 'facebook'
  )),
  api_key text not null,
  api_secret text, -- Optional for OAuth platforms
  access_token text, -- For OAuth
  refresh_token text, -- For OAuth
  expires_at timestamp with time zone,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Ensure one credential per platform per creator
  unique(creator_id, platform_name)
);

-- Enable RLS
alter table public.platform_credentials enable row level security;

-- Policies
create policy "Creators can manage their own credentials"
  on platform_credentials for all
  using (auth.uid() = creator_id);

-- Indexes
create index platform_credentials_creator_id_idx on platform_credentials(creator_id);
create index platform_credentials_platform_idx on platform_credentials(platform_name);
```

---

## 2. LINK SHARES TABLE

```sql
-- Track all link shares across platforms
create table public.link_shares (
  id uuid default gen_random_uuid() primary key,
  link_id uuid references links(id) on delete cascade not null,
  platform text not null,
  success boolean default false,
  post_id text, -- Platform's post ID
  post_url text, -- Direct URL to post
  error text, -- Error message if failed
  ai_content text, -- AI-generated content used
  engagement_count integer default 0, -- Likes, shares, etc.
  click_count integer default 0, -- Clicks on the link
  shared_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.link_shares enable row level security;

-- Policies
create policy "Creators can view their link shares"
  on link_shares for select
  using (
    exists (
      select 1 from links
      where links.id = link_shares.link_id
      and links.creator_id = auth.uid()
    )
  );

create policy "System can insert link shares"
  on link_shares for insert
  with check (true);

-- Indexes
create index link_shares_link_id_idx on link_shares(link_id);
create index link_shares_platform_idx on link_shares(platform);
create index link_shares_shared_at_idx on link_shares(shared_at desc);
```

---

## 3. SCHEDULED SHARES TABLE

```sql
-- Schedule future link distributions
create table public.scheduled_shares (
  id uuid default gen_random_uuid() primary key,
  link_id uuid references links(id) on delete cascade not null,
  creator_id uuid references auth.users(id) on delete cascade not null,
  platforms text[] not null, -- Array of platform names
  scheduled_for timestamp with time zone not null,
  status text default 'pending' check (status in (
    'pending', 'processing', 'completed', 'failed', 'cancelled'
  )),
  executed_at timestamp with time zone,
  results jsonb, -- Store share results
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.scheduled_shares enable row level security;

-- Policies
create policy "Creators can manage their scheduled shares"
  on scheduled_shares for all
  using (auth.uid() = creator_id);

-- Indexes
create index scheduled_shares_creator_id_idx on scheduled_shares(creator_id);
create index scheduled_shares_scheduled_for_idx on scheduled_shares(scheduled_for);
create index scheduled_shares_status_idx on scheduled_shares(status);
```

---

## 4. AI AGENT ANALYTICS TABLE

```sql
-- Track AI agent performance and usage
create table public.ai_agent_analytics (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  total_shares integer default 0,
  successful_shares integer default 0,
  failed_shares integer default 0,
  platforms_used jsonb, -- { "openclaw": 5, "twitter": 3 }
  total_clicks integer default 0,
  total_engagement integer default 0,
  ai_tokens_used integer default 0, -- Claude API tokens
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- One row per creator per day
  unique(creator_id, date)
);

-- Enable RLS
alter table public.ai_agent_analytics enable row level security;

-- Policies
create policy "Creators can view their analytics"
  on ai_agent_analytics for select
  using (auth.uid() = creator_id);

-- Indexes
create index ai_agent_analytics_creator_date_idx on ai_agent_analytics(creator_id, date desc);
```

---

## 5. PLATFORM SETTINGS TABLE

```sql
-- Per-platform sharing preferences
create table public.platform_settings (
  id uuid default gen_random_uuid() primary key,
  creator_id uuid references auth.users(id) on delete cascade not null,
  platform_name text not null,
  auto_share boolean default false, -- Auto-share new links
  optimal_time time, -- Best time to post
  content_template text, -- Custom template for AI
  include_hashtags boolean default true,
  include_emoji boolean default true,
  max_post_length integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(creator_id, platform_name)
);

-- Enable RLS
alter table public.platform_settings enable row level security;

-- Policies
create policy "Creators can manage their platform settings"
  on platform_settings for all
  using (auth.uid() = creator_id);

-- Indexes
create index platform_settings_creator_idx on platform_settings(creator_id);
```

---

## 6. FUNCTIONS & TRIGGERS

### Auto-update timestamps

```sql
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tables
create trigger platform_credentials_updated_at
  before update on platform_credentials
  for each row execute function update_updated_at();

create trigger scheduled_shares_updated_at
  before update on scheduled_shares
  for each row execute function update_updated_at();

create trigger platform_settings_updated_at
  before update on platform_settings
  for each row execute function update_updated_at();
```

### Update analytics on share

```sql
create or replace function update_analytics_on_share()
returns trigger as $$
begin
  insert into ai_agent_analytics (creator_id, date, total_shares, successful_shares, failed_shares)
  select 
    l.creator_id,
    current_date,
    1,
    case when new.success then 1 else 0 end,
    case when not new.success then 1 else 0 end
  from links l
  where l.id = new.link_id
  on conflict (creator_id, date) do update set
    total_shares = ai_agent_analytics.total_shares + 1,
    successful_shares = ai_agent_analytics.successful_shares + 
      case when new.success then 1 else 0 end,
    failed_shares = ai_agent_analytics.failed_shares + 
      case when not new.success then 1 else 0 end;
  
  return new;
end;
$$ language plpgsql;

create trigger on_link_share_created
  after insert on link_shares
  for each row execute function update_analytics_on_share();
```

---

## 7. SAMPLE DATA

```sql
-- Sample platform credentials (for testing)
insert into platform_credentials (creator_id, platform_name, api_key, is_active)
values
  (auth.uid(), 'openclaw', 'YOUR_OPENCLAW_API_KEY', true),
  (auth.uid(), 'clawdbot', 'YOUR_CLAWDBOT_API_KEY', true),
  (auth.uid(), 'moltbot', 'YOUR_MOLTBOT_API_KEY', true);

-- Sample platform settings
insert into platform_settings (
  creator_id, 
  platform_name, 
  auto_share, 
  optimal_time,
  include_hashtags
)
values
  (auth.uid(), 'openclaw', true, '09:00:00', true),
  (auth.uid(), 'clawdbot', true, '12:00:00', true),
  (auth.uid(), 'moltbot', true, '15:00:00', false);
```

---

## 8. USEFUL QUERIES

### Get all shares for a link

```sql
select 
  ls.*,
  l.title as link_title,
  l.url as link_url
from link_shares ls
join links l on l.id = ls.link_id
where l.creator_id = auth.uid()
order by ls.shared_at desc;
```

### Analytics dashboard

```sql
select 
  date,
  total_shares,
  successful_shares,
  failed_shares,
  round(successful_shares::decimal / nullif(total_shares, 0) * 100, 2) as success_rate,
  total_clicks,
  total_engagement
from ai_agent_analytics
where creator_id = auth.uid()
order by date desc
limit 30;
```

### Platform performance

```sql
select 
  platform,
  count(*) as total_shares,
  count(*) filter (where success) as successful,
  count(*) filter (where not success) as failed,
  sum(click_count) as total_clicks
from link_shares ls
join links l on l.id = ls.link_id
where l.creator_id = auth.uid()
  and ls.shared_at >= now() - interval '30 days'
group by platform
order by total_clicks desc;
```

### Upcoming scheduled shares

```sql
select 
  ss.*,
  l.title as link_title,
  l.url as link_url
from scheduled_shares ss
join links l on l.id = ss.link_id
where ss.creator_id = auth.uid()
  and ss.status = 'pending'
  and ss.scheduled_for > now()
order by ss.scheduled_for asc;
```

---

## ✅ SETUP CHECKLIST

- [ ] Run all CREATE TABLE statements
- [ ] Enable RLS on all tables
- [ ] Create policies
- [ ] Create indexes
- [ ] Set up functions and triggers
- [ ] Insert sample data (optional)
- [ ] Test queries
- [ ] Verify permissions

---

**DATABASE READY FOR AI AGENT!** 🗄️

Next: Build the dashboard UI and scheduling system!
