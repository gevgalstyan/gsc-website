// Local PGlite contract only. No network or production credentials.
export const supabaseFixture = `
create role anon; create role authenticated; create role service_role bypassrls; create role supabase_admin;
create schema auth; create schema storage; create schema realtime;
create table auth.users (id uuid primary key, email text, encrypted_password text default '', raw_user_meta_data jsonb default '{}', email_confirmed_at timestamptz, created_at timestamptz default now(), last_sign_in_at timestamptz);
create table auth.identities(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), provider text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('test.email',true)) $$;
create function auth.role() returns text language sql stable as $$ select current_user::text $$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid,owner_id text);
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
create table realtime.messages(id bigint, extension text, topic text);
alter table realtime.messages enable row level security;
create function realtime.topic() returns text language sql stable as $$ select coalesce(current_setting('test.topic',true),'') $$;
create table realtime.test_broadcasts(payload jsonb,event text,topic text,private boolean);
create function realtime.send(jsonb,text,text,boolean) returns void language plpgsql as $$ begin insert into realtime.test_broadcasts values($1,$2,$3,$4); end $$;
grant usage on schema auth,storage,realtime to anon,authenticated;
grant select,insert,update,delete on storage.objects to authenticated;
grant select on realtime.messages to authenticated;
`;
