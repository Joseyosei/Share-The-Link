begin;
create table if not exists public.local_ai_jobs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 mode text not null check(mode in ('website','product','social','campaign','analytics','growth','chat')),
 messages jsonb not null check(octet_length(messages::text)<=24000),
 status text not null default 'queued' check(status in ('queued','running','done','failed')),
 result jsonb check(result is null or octet_length(result::text)<=40000),
 lease uuid, created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '5 minutes'
);
alter table public.local_ai_jobs enable row level security;
revoke all on public.local_ai_jobs from public,anon,authenticated;
grant select,insert,update,delete on public.local_ai_jobs to service_role;
create unique index if not exists local_ai_one_pending on public.local_ai_jobs(user_id) where status in ('queued','running');
create or replace function public.claim_local_ai_job(p_user uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare job public.local_ai_jobs;
begin
 delete from public.local_ai_jobs where user_id=p_user and expires_at<=now();
 select * into job from public.local_ai_jobs where user_id=p_user and status='queued' and expires_at>now()+interval '90 seconds' order by created_at limit 1 for update skip locked;
 if not found then return null; end if;
 update public.local_ai_jobs set status='running',lease=gen_random_uuid() where id=job.id returning * into job;
 return jsonb_build_object('id',job.id,'lease',job.lease,'messages',job.messages);
end $$;
revoke all on function public.claim_local_ai_job(uuid) from public,anon,authenticated;
grant execute on function public.claim_local_ai_job(uuid) to service_role;
commit;
notify pgrst,'reload schema';
