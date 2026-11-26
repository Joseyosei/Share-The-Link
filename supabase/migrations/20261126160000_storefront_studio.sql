begin;
create table if not exists public.creator_websites (
 user_id uuid primary key references auth.users(id) on delete cascade,
 draft jsonb not null,
 published jsonb,
 revision integer not null default 1 check(revision>0),
 updated_at timestamptz not null default now(),
 published_at timestamptz,
 check(jsonb_typeof(draft)='object' and octet_length(draft::text)<=16000),
 check(published is null or (jsonb_typeof(published)='object' and octet_length(published::text)<=16000))
);
alter table public.creator_websites enable row level security;
revoke all on public.creator_websites from public,anon,authenticated;
grant select,insert,update on public.creator_websites to service_role;

-- Atomic optimistic concurrency: stale tabs cannot overwrite newer drafts.
create or replace function public.save_creator_website(p_user uuid,p_revision integer,p_config jsonb,p_action text)
returns integer language plpgsql security invoker set search_path='' as $$
declare current_revision integer; next_revision integer;
begin
 if p_revision<0 or p_action not in ('draft','publish','unpublish') then raise exception 'Invalid action'; end if;
 perform pg_advisory_xact_lock(hashtextextended('website:'||p_user::text,0));
 select revision into current_revision from public.creator_websites where user_id=p_user;
 if coalesce(current_revision,0)<>p_revision then return -1; end if;
 if p_action='unpublish' then
  if current_revision is null then return 0; end if;
  update public.creator_websites set published=null,published_at=null,revision=revision+1,updated_at=now() where user_id=p_user returning revision into next_revision;
 else
  insert into public.creator_websites(user_id,draft,published,published_at)
  values(p_user,p_config,case when p_action='publish' then p_config end,case when p_action='publish' then now() end)
  on conflict(user_id) do update set draft=excluded.draft,
   published=case when p_action='publish' then excluded.draft else creator_websites.published end,
   published_at=case when p_action='publish' then now() else creator_websites.published_at end,
   revision=creator_websites.revision+1,updated_at=now()
  returning revision into next_revision;
 end if;
 return next_revision;
end $$;
revoke all on function public.save_creator_website(uuid,integer,jsonb,text) from public,anon,authenticated;
grant execute on function public.save_creator_website(uuid,integer,jsonb,text) to service_role;
commit;
notify pgrst,'reload schema';
