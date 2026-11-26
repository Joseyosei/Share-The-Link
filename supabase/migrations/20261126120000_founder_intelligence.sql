-- Founder-only analytics. No browser access to raw conversion events.
begin;
create table if not exists public.founder_events (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 event_type text not null check (event_type in ('dashboard_opened','pricing_viewed','checkout_started','checkout_completed')),
 event_key text not null check (length(event_key) between 1 and 200),
 created_at timestamptz not null default now(),
 unique(user_id,event_type,event_key)
);
alter table public.founder_events enable row level security;
revoke all on public.founder_events from public, anon, authenticated;
grant select, insert, update on public.founder_events to service_role;
create index if not exists founder_events_user_date_idx on public.founder_events(user_id,created_at);
create index if not exists founder_events_type_date_idx on public.founder_events(event_type,created_at);
-- Existing script accidentally grants unrestricted subscription writes via RLS.
drop policy if exists "Service role full access on subscriptions" on public.user_subscriptions;
revoke insert, update, delete on public.user_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.user_subscriptions to service_role;
alter table public.user_subscriptions enable row level security;
create or replace function public.founder_snapshot(p_admin uuid, p_days integer default 30)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare result jsonb; cutoff timestamptz := now() - make_interval(days => p_days);
begin
 if p_days not in (7,30,90) then raise exception 'Invalid window'; end if;
 if not exists(select 1 from public.admin_users where user_id=p_admin and role='super_admin') then
  raise exception 'Forbidden' using errcode='42501';
 end if;
 with users as (
  select id, created_at, last_sign_in_at from auth.users
 ), profiles as (
  select user_id, bool_or(nullif(trim(username),'') is not null) as has_page,
   bool_or(nullif(trim(full_name),'') is not null and nullif(trim(avatar_url),'') is not null) as complete
  from public.profiles group by user_id
 ), links as (
  select user_id, count(*) filter(where is_active is true) as active_links from public.links group by user_id
 ), products as (
  select user_id, count(*) filter(where is_active is true) as active_products from public.user_products group by user_id
 ), activity as (
  select user_id, bool_or(event_type='dashboard_opened') as opened,
   bool_or(event_type='pricing_viewed') as pricing,
   bool_or(event_type='checkout_started') as checkout
  from public.founder_events where created_at>=cutoff group by user_id
 ), subs as (
  select user_id, status, lower(plan_name) as plan, stripe_subscription_id
  from public.user_subscriptions
 ), base as (
  select u.*, coalesce(p.has_page,false) as has_page, coalesce(p.complete,false) as complete,
   coalesce(l.active_links,0)>0 as has_link, coalesce(pr.active_products,0)>0 as has_product,
   coalesce(a.opened,false) as opened, coalesce(a.pricing,false) as pricing, coalesce(a.checkout,false) as checkout,
   coalesce(s.status='active' and s.plan in ('pro','business','enterprise') and s.stripe_subscription_id is not null,false) as paid,
   coalesce(s.status='trialing',false) as trialing,
   coalesce(s.status='past_due',false) as past_due
  from users u left join profiles p on p.user_id=u.id left join links l on l.user_id=u.id
  left join products pr on pr.user_id=u.id::text left join activity a on a.user_id=u.id
  left join subs s on s.user_id=u.id
 ), sessions as (
  select user_id,event_key,min(created_at) as started_at from public.founder_events
  where event_type='checkout_started' and created_at>=cutoff group by user_id,event_key
 )
 select jsonb_build_object(
  'registered',count(*),'newUsers',count(*) filter(where created_at>=cutoff),
  'recentSignIns',count(*) filter(where last_sign_in_at>=cutoff),
  'dashboardUsers',count(*) filter(where opened),
  'profileComplete',count(*) filter(where complete),
  'activated',count(*) filter(where has_page and has_link),
  'productSellers',count(*) filter(where has_product),
  'pricingUsers',count(*) filter(where pricing),
  'checkoutUsers',count(*) filter(where checkout),
  'paidUsers',count(*) filter(where paid),'trialUsers',count(*) filter(where trialing),'pastDueUsers',count(*) filter(where past_due),
  'segments',jsonb_build_object(
   'paid',count(*) filter(where paid),
   'trial',count(*) filter(where not paid and trialing),
   'checkoutIntent',count(*) filter(where not paid and not trialing and checkout),
   'activatedFree',count(*) filter(where not paid and not trialing and not checkout and has_page and has_link),
   'notActivated',count(*) filter(where not paid and not trialing and not checkout and not(has_page and has_link))
  ),
  'checkoutSessions',(select count(*) from sessions),
  'completedSessions',(select count(*) from sessions s where exists(select 1 from public.founder_events e where e.user_id=s.user_id and e.event_key=s.event_key and e.event_type='checkout_completed')),
  'unconfirmedSessions',(select count(*) from sessions s where s.started_at < now()-interval '24 hours' and not exists(select 1 from public.founder_events e where e.user_id=s.user_id and e.event_key=s.event_key and e.event_type='checkout_completed')),
  'dailySignups',(select coalesce(jsonb_agg(jsonb_build_object('date',d.day::date,'count',(select count(*) from users u where u.created_at>=d.day and u.created_at<d.day+interval '1 day')) order by d.day),'[]'::jsonb) from generate_series(date_trunc('day',cutoff at time zone 'UTC') at time zone 'UTC',date_trunc('day',now() at time zone 'UTC') at time zone 'UTC',interval '1 day') d(day)),
  'trackingSince',(select min(created_at) from public.founder_events)
 ) into result from base;
 return result;
end $$;
revoke all on function public.founder_snapshot(uuid,integer) from public, anon, authenticated;
grant execute on function public.founder_snapshot(uuid,integer) to service_role;
commit;
