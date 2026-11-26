begin;
-- Stage 05 must be applied first. Service role only; tier comes from verified Stripe.
create table if not exists public.plan_usage (
 user_id uuid not null references auth.users(id) on delete cascade,
 month_start date not null, builder_requests integer not null default 0 check(builder_requests>=0),
 primary key(user_id,month_start)
);
alter table public.plan_usage enable row level security;
revoke all on public.plan_usage from public,anon,authenticated;
grant select,insert,update on public.plan_usage to service_role;
alter table public.commerce_orders add column if not exists platform_fee integer not null default 0 check(platform_fee>=0 and platform_fee<=amount);
alter table public.commerce_orders add column if not exists seller_tier text not null default 'free' check(seller_tier in ('free','pro','business','enterprise'));
create or replace function public.plan_limits(p_tier text)
returns table(products integer,ai integer,discounts boolean) language sql immutable set search_path='' as $$
 select * from (values ('free',3,3,false),('pro',30,30,true),('business',100,100,true),('enterprise',100,100,true)) v(tier,products,ai,discounts) where tier=p_tier
$$;
create or replace function public.consume_builder_usage(p_user uuid,p_tier text)
returns boolean language plpgsql security invoker set search_path='' as $$
declare cap integer; n integer; m date:=(date_trunc('month',now() at time zone 'UTC'))::date;
begin
 select ai into cap from public.plan_limits(p_tier); if cap is null then raise exception 'Invalid tier'; end if;
 insert into public.plan_usage(user_id,month_start,builder_requests) values(p_user,m,1)
 on conflict(user_id,month_start) do update set builder_requests=plan_usage.builder_requests+1 where plan_usage.builder_requests<cap
 returning builder_requests into n;
 return n is not null;
end $$;
create or replace function public.create_plan_product(p_user uuid,p_tier text,p_name text,p_description text,p_amount integer,p_file text,p_code text,p_percent integer)
returns uuid language plpgsql security invoker set search_path='' as $$
declare cap integer; allow_discount boolean; pid uuid;
begin
 select products,discounts into cap,allow_discount from public.plan_limits(p_tier); if cap is null then raise exception 'Invalid tier'; end if;
 if p_code is not null and not allow_discount then raise exception 'UPGRADE_REQUIRED'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,0));
 if (select count(*) from public.commerce_products where seller_id=p_user)>=cap then raise exception 'PRODUCT_LIMIT'; end if;
 insert into public.commerce_products(seller_id,name,description,amount,file_path,discount_code,discount_percent)
 values(p_user,p_name,p_description,p_amount,p_file,p_code,p_percent) returning id into pid;
 return pid;
end $$;
create or replace function public.plan_usage_snapshot(p_user uuid,p_tier text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare cap integer; ai_cap integer; m date:=(date_trunc('month',now() at time zone 'UTC'))::date;
begin
 select products,ai into cap,ai_cap from public.plan_limits(p_tier); if cap is null then raise exception 'Invalid tier'; end if;
 return jsonb_build_object('productsUsed',(select count(*) from public.commerce_products where seller_id=p_user),'builderUsed',coalesce((select builder_requests from public.plan_usage where user_id=p_user and month_start=m),0),'productsLimit',cap,'builderLimit',ai_cap,'periodStart',m);
end $$;
revoke all on function public.plan_limits(text),public.consume_builder_usage(uuid,text),public.create_plan_product(uuid,text,text,text,integer,text,text,integer),public.plan_usage_snapshot(uuid,text) from public,anon,authenticated;
grant execute on function public.plan_limits(text),public.consume_builder_usage(uuid,text),public.create_plan_product(uuid,text,text,text,integer,text,text,integer),public.plan_usage_snapshot(uuid,text) to service_role;
commit;
notify pgrst,'reload schema';
