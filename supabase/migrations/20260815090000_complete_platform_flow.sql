begin;

-- Member profile fields used by the member dashboard and admin directory.
alter table public.profiles
  add column if not exists english_level text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_english_level_allowed'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_english_level_allowed
      check (
        english_level is null
        or english_level in ('beginner', 'elementary', 'pre-intermediate', 'intermediate', 'upper-intermediate', 'advanced')
      );
  end if;
end;
$$;

-- Event fields used by the CMS. image_url is deliberately a URL field so an
-- administrator can use an approved image host without exposing service keys.
alter table public.meetups
  add column if not exists category text not null default 'Conversation',
  add column if not exists image_url text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'meetups_category_length'
      and conrelid = 'public.meetups'::regclass
  ) then
    alter table public.meetups
      add constraint meetups_category_length
      check (char_length(btrim(category)) between 1 and 80);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'meetups_image_url_length'
      and conrelid = 'public.meetups'::regclass
  ) then
    alter table public.meetups
      add constraint meetups_image_url_length
      check (image_url is null or char_length(image_url) <= 2048);
  end if;
end;
$$;

-- In-app alerts are the reliable notification channel. Email remains optional
-- and can be layered on later without changing member-visible state.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  meetup_id uuid references public.meetups (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_kind_length check (char_length(btrim(kind)) between 1 and 80),
  constraint notifications_title_length check (char_length(btrim(title)) between 1 and 160),
  constraint notifications_body_length check (char_length(body) between 1 and 1000)
);

create unique index if not exists notifications_meetup_once_idx
  on public.notifications (user_id, meetup_id, kind)
  where meetup_id is not null;
create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create or replace function app_private.notify_published_meetup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'published'
    and (tg_op = 'INSERT' or (tg_op = 'UPDATE' and old.status <> 'published')) then
    insert into public.notifications (user_id, kind, title, body, meetup_id)
    select
      profile.id,
      'new_meetup',
      'A new GSC meetup is live',
      left(new.title, 100) || ' is now open to members.',
      new.id
    from public.profiles as profile
    on conflict (user_id, meetup_id, kind) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function app_private.notify_published_meetup() from public, anon, authenticated;
drop trigger if exists meetups_notify_published on public.meetups;
create trigger meetups_notify_published
after insert or update of status on public.meetups
for each row execute function app_private.notify_published_meetup();

-- Small, editable CMS surface for administrators. Public pages may safely read
-- only rows marked public; empty tables leave the existing authored copy intact.
create table if not exists public.site_content (
  key text primary key,
  value text not null,
  is_public boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_content_key_length check (char_length(btrim(key)) between 1 and 120),
  constraint site_content_value_length check (char_length(value) <= 20000)
);

create table if not exists public.managed_questions (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  translation text,
  category text not null,
  difficulty text not null,
  is_published boolean not null default true,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint managed_questions_prompt_length check (char_length(btrim(prompt)) between 3 and 1000),
  constraint managed_questions_translation_length check (translation is null or char_length(translation) <= 1000),
  constraint managed_questions_category_length check (char_length(btrim(category)) between 1 and 80),
  constraint managed_questions_difficulty_allowed check (difficulty in ('Beginner', 'Intermediate', 'Advanced'))
);

create index if not exists managed_questions_browse_idx
  on public.managed_questions (is_published, category, difficulty);

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    lower(coalesce((select auth.jwt() ->> 'email'), '')) in (
      'galstyanwork@gmail.com',
      'galstyanoff@gmail.com',
      'gevgalstyan913@gmail.com'
    )
    and exists (
      select 1
      from public.user_roles
      where user_id = (select auth.uid())
        and role = 'admin'
    );
$$;

revoke all on function app_private.is_admin() from public, anon, authenticated;
grant usage on schema app_private to authenticated;
grant execute on function app_private.is_admin() to authenticated;

create or replace function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata_name text;
  metadata_avatar text;
  allowed_admin boolean;
begin
  metadata_name := nullif(
    btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')),
    ''
  );
  metadata_avatar := nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), '');
  allowed_admin := lower(coalesce(new.email, '')) in (
    'galstyanwork@gmail.com',
    'galstyanoff@gmail.com',
    'gevgalstyan913@gmail.com'
  );

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    case when metadata_name is null then null else left(metadata_name, 80) end,
    case when metadata_avatar is null then null else left(metadata_avatar, 2048) end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, case when allowed_admin then 'admin' else 'member' end)
  on conflict (user_id) do update set role = excluded.role;

  return new;
end;
$$;

-- Explicitly bootstrap already-existing allowlisted users on migration.
update public.user_roles
set role = 'admin', updated_at = now()
where user_id in (
  select id from auth.users where lower(coalesce(email, '')) in (
    'galstyanwork@gmail.com',
    'galstyanoff@gmail.com',
    'gevgalstyan913@gmail.com'
  )
);

alter table public.notifications enable row level security;
alter table public.site_content enable row level security;
alter table public.managed_questions enable row level security;

drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications
for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
for update to authenticated using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
drop policy if exists notifications_admin_read on public.notifications;
create policy notifications_admin_read on public.notifications
for select to authenticated using ((select app_private.is_admin()));

drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read on public.site_content
for select to anon, authenticated using (is_public = true or (select app_private.is_admin()));
drop policy if exists site_content_admin_write on public.site_content;
create policy site_content_admin_write on public.site_content
for all to authenticated using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

drop policy if exists managed_questions_public_read on public.managed_questions;
create policy managed_questions_public_read on public.managed_questions
for select to anon, authenticated using (is_published = true or (select app_private.is_admin()));
drop policy if exists managed_questions_admin_write on public.managed_questions;
create policy managed_questions_admin_write on public.managed_questions
for all to authenticated using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

grant select, update (read_at) on table public.notifications to authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert, update, delete on table public.site_content to authenticated;
grant select on table public.managed_questions to anon, authenticated;
grant insert, update, delete on table public.managed_questions to authenticated;
grant update (english_level) on table public.profiles to authenticated;
grant insert (category, image_url), update (category, image_url) on table public.meetups to authenticated;

commit;
