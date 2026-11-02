-- Generator input. Applied only to an ephemeral local fixture, then folded into install.sql.
-- Never run this file against an existing project.
create or replace function app_private.is_admin()
returns boolean language sql stable security definer set search_path='' as $$
  select app_private.is_verified_member() and exists(
    select 1 from public.user_roles where user_id=(select auth.uid()) and role='admin'
  );
$$;
create or replace function app_private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  insert into public.profiles(id,display_name,email,onboarding_completed)
  values(new.id,left(nullif(btrim(coalesce(new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'name','')),''),80),new.email,false);
  insert into public.user_roles(user_id,role) values(new.id,'member');
  insert into public.notifications(user_id,audience_type,kind,title,body,entity_type,entity_id,target_url)
  select r.user_id,'admin','new_member','New member registered','A new member created an account.',
    'member',new.id,'/admin/?section=members&member='||new.id::text
  from public.user_roles r where r.role='admin';
  return new;
end;
$$;
create unique index one_gsc_administrator on public.user_roles(role) where role='admin';

-- Separate published projections: no draft/actor/private columns, no definer view bypass.
create table public.site_content_public (
 key text primary key references public.site_content(key) on delete cascade,
 value text not null, published_value text not null,
 is_public boolean not null check(is_public), published_is_enabled boolean not null check(published_is_enabled)
);
create table public.site_faq_public (
 id uuid primary key references public.site_faq_items(id) on delete cascade,
 question text not null, answer text not null, sort_order integer not null
);
create function app_private.sync_public_content()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' then delete from public.site_content_public where key=old.key; return old; end if;
 if tg_op='UPDATE' and old.key<>new.key then delete from public.site_content_public where key=old.key; end if;
 if new.is_public and new.published_is_enabled and new.published_value is not null then
  insert into public.site_content_public values(new.key,new.published_value,new.published_value,true,true)
  on conflict(key) do update set value=excluded.value,published_value=excluded.published_value;
 else delete from public.site_content_public where key=new.key;
 end if;
 return new;
end;
$$;
create trigger site_content_sync_public after insert or update or delete on public.site_content
for each row execute function app_private.sync_public_content();
create function app_private.sync_public_faq()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_op='DELETE' then delete from public.site_faq_public where id=old.id; return old; end if;
 if new.published_is_enabled then
  insert into public.site_faq_public values(new.id,new.published_question,new.published_answer,new.published_sort_order)
  on conflict(id) do update set question=excluded.question,answer=excluded.answer,sort_order=excluded.sort_order;
 else delete from public.site_faq_public where id=new.id;
 end if;
 return new;
end;
$$;
create trigger site_faq_sync_public after insert or update or delete on public.site_faq_items
for each row execute function app_private.sync_public_faq();

-- Replace mixed public/admin policies on the private CMS tables.
do $$ declare p record; begin
 for p in select policyname,tablename from pg_policies where schemaname='public' and tablename in ('site_content','site_faq_items') loop
  execute format('drop policy %I on public.%I',p.policyname,p.tablename);
 end loop;
end $$;
create policy site_content_admin_only on public.site_content for all to authenticated
using((select app_private.is_admin())) with check((select app_private.is_admin()));
create policy site_faq_admin_only on public.site_faq_items for all to authenticated
using((select app_private.is_admin())) with check((select app_private.is_admin()));
alter table public.site_content_public enable row level security;
alter table public.site_faq_public enable row level security;
create policy published_content_read on public.site_content_public for select to anon,authenticated using(true);
create policy published_faq_read on public.site_faq_public for select to anon,authenticated using(true);
create policy profile_avatars_admin_read on storage.objects for select to authenticated
using(bucket_id='profile-avatars' and (select app_private.is_admin()));
alter table app_private.privacy_protection_control enable row level security;

-- Public catalog reads must not evaluate a private admin helper as anon.
drop policy managed_questions_public_read on public.managed_questions;
create policy managed_questions_published_read on public.managed_questions
for select to anon,authenticated using(is_published=true);
-- Authenticated admin access remains provided by managed_questions_admin_write.
drop policy meetups_anonymous_read on public.meetups;
create policy meetups_anonymous_read on public.meetups for select to anon
using(is_public and status in ('published','cancelled','completed'));
