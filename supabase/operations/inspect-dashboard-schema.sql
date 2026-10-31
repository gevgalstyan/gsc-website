-- READ ONLY. Run privately as project owner in Supabase SQL Editor.
-- Do not paste user UUIDs, policies, or result rows into a public issue.
select table_schema,table_name,column_name,data_type,is_nullable
from information_schema.columns
where table_schema='public' and table_name in ('profiles','user_roles')
order by table_name,ordinal_position;

select n.nspname as schema_name,c.relname as table_name,c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('profiles','user_roles');

select schemaname,tablename,policyname,roles,cmd,qual,with_check
from pg_policies
where (schemaname='public' and tablename in ('profiles','user_roles','meetup_bookings','attendance','loyalty_rewards'))
   or (schemaname='storage' and tablename='objects')
order by schemaname,tablename,policyname;

select grantee,table_name,privilege_type from information_schema.role_table_grants
where table_schema='public' and table_name in ('profiles','user_roles')
order by table_name,grantee,privilege_type;
select grantee,table_name,column_name,privilege_type from information_schema.column_privileges
where table_schema='public' and table_name='profiles' and grantee='authenticated'
order by column_name,privilege_type;

-- Trusted existing identities/roles only; no assignment or account creation.
select u.id as existing_user_id,u.email,u.email_confirmed_at is not null as verified,r.role
from auth.users u left join public.user_roles r on r.user_id=u.id
where lower(u.email) in ('galstyanwork@gmail.com','gevgalstyan913@gmail.com','galstyanoff@gmail.com');

select id,public,file_size_limit,allowed_mime_types from storage.buckets where id='profile-avatars';
-- Expected private bucket, <=5 MiB, image/jpeg,image/png,image/webp.
-- Inspect migration history separately if supabase_migrations.schema_migrations exists:
-- select version from supabase_migrations.schema_migrations order by version;
-- Specifically check 20260726214531, 20260726215248, 20260831110000,
-- 20260901130000, and 20261029090000 before considering any migration.
