begin;
create table if not exists public.social_connections (
 user_id uuid not null references auth.users(id) on delete cascade,
 provider text not null check(provider in ('instagram','tiktok','youtube')),
 generation uuid not null default gen_random_uuid(),
 state_hash text unique, state_expires timestamptz, verifier_cipher text,
 token_cipher text, account_id text, account_name text,
 status text not null default 'pending' check(status in ('pending','connected','reauthorize')),
 published boolean not null default false,
 media jsonb not null default '[]' check(jsonb_typeof(media)='array' and jsonb_array_length(media)<=20 and octet_length(media::text)<=160000),
 pins text[] not null default '{}' check(cardinality(pins)<=3),
 last_sync timestamptz, next_sync timestamptz not null default now(),
 lease_id uuid, lease_until timestamptz, access_until timestamptz,
 primary key(user_id,provider)
);
alter table public.social_connections enable row level security;
revoke all on public.social_connections from public,anon,authenticated;
grant select,insert,update,delete on public.social_connections to service_role;
create index if not exists social_sync_due on public.social_connections(next_sync) where status='connected';
commit;
notify pgrst,'reload schema';
