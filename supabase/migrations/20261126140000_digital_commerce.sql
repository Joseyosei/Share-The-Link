begin;
create table if not exists public.commerce_products (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references auth.users(id),
 name text not null check(length(name) between 1 and 120), description text not null default '',
 amount integer not null check(amount between 50 and 1000000), currency text not null default 'gbp' check(currency='gbp'),
 file_path text not null, active boolean not null default false, discount_code text,
 discount_percent integer not null default 0 check(discount_percent between 0 and 80),
 created_at timestamptz not null default now(),
 check((discount_code is null and discount_percent=0) or (discount_code ~ '^[A-Z0-9_-]{3,24}$' and discount_percent between 1 and 80))
);
create table if not exists public.commerce_orders (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references auth.users(id), product_id uuid not null references public.commerce_products(id),
 product_name text not null, file_path text not null, connected_account text not null,
 amount integer not null check(amount>=50), currency text not null check(currency='gbp'),
 claim_hash text not null, stripe_session_id text unique, payment_intent_id text unique,
 status text not null default 'pending' check(status in ('pending','paid','expired','revoked')),
 buyer_email text, paid_at timestamptz, created_at timestamptz not null default now(),
 livemode boolean not null default false check(livemode=false)
);
create index if not exists commerce_products_seller_idx on public.commerce_products(seller_id,active);
create index if not exists commerce_orders_seller_idx on public.commerce_orders(seller_id,created_at desc);
alter table public.commerce_products enable row level security;
alter table public.commerce_orders enable row level security;
revoke all on public.commerce_products,public.commerce_orders from public,anon,authenticated;
grant select,insert,update on public.commerce_products,public.commerce_orders to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('commerce-private','commerce-private',false,10485760,array['application/pdf'])
 on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=array['application/pdf'];
-- Restrictive policies also constrain any pre-existing broad permissive policies.
drop policy if exists commerce_upload_guard on storage.objects;
create policy commerce_upload_guard on storage.objects as restrictive for insert to anon,authenticated
 with check(bucket_id<>'commerce-private' or (auth.uid() is not null and (storage.foldername(name))[1]=auth.uid()::text));
drop policy if exists commerce_seller_upload on storage.objects;
create policy commerce_seller_upload on storage.objects for insert to authenticated
 with check(bucket_id='commerce-private' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists commerce_read_guard on storage.objects;
create policy commerce_read_guard on storage.objects as restrictive for select to anon,authenticated using(bucket_id<>'commerce-private');
drop policy if exists commerce_update_guard on storage.objects;
create policy commerce_update_guard on storage.objects as restrictive for update to anon,authenticated
 using(bucket_id<>'commerce-private') with check(bucket_id<>'commerce-private');
drop policy if exists commerce_delete_guard on storage.objects;
create policy commerce_delete_guard on storage.objects as restrictive for delete to anon,authenticated using(bucket_id<>'commerce-private');
commit;
notify pgrst, 'reload schema';
