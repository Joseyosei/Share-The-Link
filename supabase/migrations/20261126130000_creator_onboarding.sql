-- Apply after founder intelligence. All writes go through authenticated API.
begin;
create table if not exists public.creator_onboarding (
 user_id uuid primary key references auth.users(id) on delete cascade,
 goal text check (goal in ('audience','sell','bookings','community')),
 started_at timestamptz not null default now(),
 activated_at timestamptz,
 copied_at timestamptz
);
alter table public.creator_onboarding enable row level security;
revoke all on public.creator_onboarding from public, anon, authenticated;
grant select, insert, update on public.creator_onboarding to service_role;

create or replace function public.sync_creator_onboarding(p_user uuid, p_goal text default null, p_copied boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb; ready boolean;
begin
 if p_goal is not null and p_goal not in ('audience','sell','bookings','community') then raise exception 'Invalid goal'; end if;
 select exists(select 1 from public.profiles where user_id=p_user and nullif(trim(username),'') is not null)
 and exists(select 1 from public.links where user_id=p_user and is_active is true) into ready;
 insert into public.creator_onboarding(user_id,goal,activated_at,copied_at)
 values(p_user,p_goal,case when ready then now() end,case when p_copied and ready then now() end)
 on conflict(user_id) do update set
 goal=coalesce(excluded.goal,creator_onboarding.goal),
 activated_at=coalesce(creator_onboarding.activated_at,excluded.activated_at),
 copied_at=coalesce(creator_onboarding.copied_at,excluded.copied_at);
 select jsonb_build_object('goal',goal,'copied',copied_at is not null,'activated',ready)
 into result from public.creator_onboarding where user_id=p_user;
 return result;
end $$;
revoke all on function public.sync_creator_onboarding(uuid,text,boolean) from public, anon, authenticated;
grant execute on function public.sync_creator_onboarding(uuid,text,boolean) to service_role;

create or replace function public.founder_onboarding_snapshot(p_admin uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare result jsonb;
begin
 if not exists(select 1 from public.admin_users where user_id=p_admin and role='super_admin') then
 raise exception 'Forbidden' using errcode='42501'; end if;
 select jsonb_build_object('started',count(*),'goalSelected',count(goal),
 'everActivated',count(activated_at),'copied',count(copied_at),
 'goals',jsonb_build_object('audience',count(*) filter(where goal='audience'),'sell',count(*) filter(where goal='sell'),'bookings',count(*) filter(where goal='bookings'),'community',count(*) filter(where goal='community')))
 into result from public.creator_onboarding;
 return result;
end $$;
revoke all on function public.founder_onboarding_snapshot(uuid) from public, anon, authenticated;
grant execute on function public.founder_onboarding_snapshot(uuid) to service_role;
commit;
