begin;
-- Shared monthly accepted-attempt cap across the unified assistant and legacy page builder.
create table if not exists public.creator_ai_budget (
 singleton boolean primary key default true check(singleton),
 monthly_cap integer not null check(monthly_cap between 0 and 100000)
);
insert into public.creator_ai_budget(singleton,monthly_cap) values(true,1000) on conflict(singleton) do nothing;
alter table public.creator_ai_budget enable row level security;
revoke all on public.creator_ai_budget from public,anon,authenticated;
grant select,update on public.creator_ai_budget to service_role;
create index if not exists plan_usage_month_idx on public.plan_usage(month_start);
create or replace function public.consume_builder_usage(p_user uuid,p_tier text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare cap integer; global_cap integer; n integer; m date:=(date_trunc('month',now() at time zone 'UTC'))::date;
begin
 select ai into cap from public.plan_limits(p_tier); if cap is null then raise exception 'Invalid tier'; end if;
 perform pg_advisory_xact_lock(hashtextextended('creator-ai:'||m::text,0));
 select monthly_cap into global_cap from public.creator_ai_budget where singleton;
 if global_cap is null or (select coalesce(sum(builder_requests),0) from public.plan_usage where month_start=m)>=global_cap then return false; end if;
 insert into public.plan_usage(user_id,month_start,builder_requests) values(p_user,m,1)
 on conflict(user_id,month_start) do update set builder_requests=plan_usage.builder_requests+1 where plan_usage.builder_requests<cap
 returning builder_requests into n;
 return n is not null;
end $$;
revoke all on function public.consume_builder_usage(uuid,text) from public,anon,authenticated;
grant execute on function public.consume_builder_usage(uuid,text) to service_role;
commit;
notify pgrst,'reload schema';
