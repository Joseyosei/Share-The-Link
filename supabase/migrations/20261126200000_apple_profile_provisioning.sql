begin;
-- Preserve existing non-Apple behavior. Review live trigger definition before applying.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
declare candidate text;
begin
 if new.raw_app_meta_data->>'provider'='apple' then
   -- Apple may withhold name and return a private relay email. Do not publish its prefix.
   candidate:='creator'||replace(new.id::text,'-','');
   insert into public.profiles(user_id,username,full_name,avatar_url)
   values(new.id,candidate,null,null);
 else
   insert into public.profiles(user_id,username,full_name,avatar_url)
   values(new.id,lower(replace(coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),' ','')),
     coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),new.raw_user_meta_data->>'avatar_url');
 end if;
 return new;
end;
$$;
commit;
