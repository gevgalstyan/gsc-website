-- ============================================
-- STRUCTURED SITE CONTENT EDITOR
-- Risk: CRITICAL — public content, revisions, media storage, and RLS.
-- ============================================

begin;

-- Evolve the original key/value CMS without breaking existing public fallbacks.
alter table public.site_content
  add column if not exists page_slug text not null default 'home',
  add column if not exists section_slug text not null default 'general',
  add column if not exists label text,
  add column if not exists content_type text not null default 'textarea',
  add column if not exists draft_value text,
  add column if not exists published_value text,
  add column if not exists sort_order integer not null default 0,
  add column if not exists is_enabled boolean not null default true,
  add column if not exists published_is_enabled boolean not null default true,
  add column if not exists published_by uuid references auth.users (id) on delete set null,
  add column if not exists published_at timestamptz;

update public.site_content
set draft_value = coalesce(draft_value, value),
    published_value = coalesce(published_value, value),
    published_at = coalesce(published_at, updated_at)
where draft_value is null or published_value is null or published_at is null;

alter table public.site_content
  alter column draft_value set default '',
  alter column published_value set default '';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'site_content_type_allowed'
      and conrelid = 'public.site_content'::regclass
  ) then
    alter table public.site_content
      add constraint site_content_type_allowed
      check (content_type in ('text', 'textarea', 'url', 'image', 'toggle', 'seo'));
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'site_content_page_length'
      and conrelid = 'public.site_content'::regclass
  ) then
    alter table public.site_content
      add constraint site_content_page_length
      check (char_length(btrim(page_slug)) between 1 and 80);
  end if;
end;
$$;

create index if not exists site_content_page_order_idx
  on public.site_content (page_slug, section_slug, sort_order, key);

-- ============================================
-- FAQ CONTENT / REVISION HISTORY
-- ============================================
create table if not exists public.site_faq_items (
  id uuid primary key default gen_random_uuid(),
  draft_question text not null default '',
  draft_answer text not null default '',
  published_question text not null default '',
  published_answer text not null default '',
  sort_order integer not null default 0,
  is_enabled boolean not null default true,
  published_is_enabled boolean not null default true,
  updated_by uuid references auth.users (id) on delete set null,
  published_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint site_faq_question_length check (char_length(draft_question) <= 500 and char_length(published_question) <= 500),
  constraint site_faq_answer_length check (char_length(draft_answer) <= 5000 and char_length(published_answer) <= 5000)
);

create index if not exists site_faq_public_order_idx
  on public.site_faq_items (published_is_enabled, sort_order);

create table if not exists public.site_content_revisions (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  action text not null default 'publish',
  snapshot jsonb not null,
  changed_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint site_revision_action_allowed check (action in ('publish', 'restore')),
  constraint site_revision_page_length check (char_length(btrim(page_slug)) between 1 and 80)
);

create index if not exists site_content_revisions_page_created_idx
  on public.site_content_revisions (page_slug, created_at desc);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null unique,
  public_url text not null,
  alt_text text not null default '',
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_asset_path_length check (char_length(storage_path) between 1 and 500),
  constraint media_asset_url_length check (char_length(public_url) between 1 and 2048),
  constraint media_asset_alt_length check (char_length(alt_text) <= 500),
  constraint media_asset_size_allowed check (size_bytes between 1 and 5242880),
  constraint media_asset_type_allowed check (mime_type in ('image/jpeg', 'image/png', 'image/webp', 'image/avif'))
);

alter table public.site_faq_items enable row level security;
alter table public.site_content_revisions enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists site_content_public_read on public.site_content;
create policy site_content_public_read on public.site_content
for select to anon, authenticated
using ((is_public and published_is_enabled) or (select app_private.is_admin()));

drop policy if exists site_content_admin_write on public.site_content;
create policy site_content_admin_write on public.site_content
for all to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy site_faq_public_read on public.site_faq_items
for select to anon, authenticated
using (published_is_enabled or (select app_private.is_admin()));
create policy site_faq_admin_write on public.site_faq_items
for all to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy site_revisions_admin_only on public.site_content_revisions
for all to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy media_assets_admin_only on public.media_assets
for all to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

-- ============================================
-- STORAGE / PUBLIC SITE MEDIA
-- ============================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy site_media_public_read on storage.objects
for select to anon, authenticated
using (bucket_id = 'site-media');
create policy site_media_admin_insert on storage.objects
for insert to authenticated
with check (bucket_id = 'site-media' and (select app_private.is_admin()));
create policy site_media_admin_update on storage.objects
for update to authenticated
using (bucket_id = 'site-media' and (select app_private.is_admin()))
with check (bucket_id = 'site-media' and (select app_private.is_admin()));
create policy site_media_admin_delete on storage.objects
for delete to authenticated
using (bucket_id = 'site-media' and (select app_private.is_admin()));

-- ============================================
-- CONTENT PUBLISH / DISCARD / RESTORE RPCS
-- ============================================
create or replace function public.publish_site_page(p_page_slug text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_snapshot jsonb;
begin
  if not (select app_private.is_admin()) then
    raise exception 'Administrator access required';
  end if;

  select jsonb_build_object(
    'content', coalesce((
      select jsonb_agg(jsonb_build_object(
        'key', c.key,
        'value', coalesce(c.published_value, c.value),
        'is_enabled', c.published_is_enabled
      ) order by c.sort_order, c.key)
      from public.site_content c
      where c.page_slug = p_page_slug
    ), '[]'::jsonb),
    'faq', case when p_page_slug = 'faq' then coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', f.id,
        'question', f.published_question,
        'answer', f.published_answer,
        'is_enabled', f.published_is_enabled,
        'sort_order', f.sort_order
      ) order by f.sort_order, f.id)
      from public.site_faq_items f
    ), '[]'::jsonb) else '[]'::jsonb end
  ) into previous_snapshot;

  insert into public.site_content_revisions (page_slug, action, snapshot, changed_by)
  values (p_page_slug, 'publish', previous_snapshot, (select auth.uid()));

  update public.site_content
  set published_value = coalesce(draft_value, value),
      value = coalesce(draft_value, value),
      published_is_enabled = is_enabled,
      published_by = (select auth.uid()),
      published_at = now()
  where page_slug = p_page_slug;

  if p_page_slug = 'faq' then
    update public.site_faq_items
    set published_question = draft_question,
        published_answer = draft_answer,
        published_is_enabled = is_enabled,
        published_by = (select auth.uid()),
        published_at = now();
  end if;
end;
$$;

create or replace function public.discard_site_page_drafts(p_page_slug text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not (select app_private.is_admin()) then
    raise exception 'Administrator access required';
  end if;

  update public.site_content
  set draft_value = coalesce(published_value, value),
      is_enabled = published_is_enabled,
      updated_by = (select auth.uid()),
      updated_at = now()
  where page_slug = p_page_slug;

  if p_page_slug = 'faq' then
    update public.site_faq_items
    set draft_question = published_question,
        draft_answer = published_answer,
        is_enabled = published_is_enabled,
        updated_by = (select auth.uid()),
        updated_at = now();
  end if;
end;
$$;

create or replace function public.restore_site_revision(p_revision_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_revision public.site_content_revisions%rowtype;
begin
  if not (select app_private.is_admin()) then
    raise exception 'Administrator access required';
  end if;

  select * into selected_revision
  from public.site_content_revisions
  where id = p_revision_id;

  if selected_revision.id is null then
    raise exception 'Revision not found';
  end if;

  update public.site_content c
  set draft_value = restored.value,
      is_enabled = restored.is_enabled,
      updated_by = (select auth.uid()),
      updated_at = now()
  from (
    select item ->> 'key' as key,
           item ->> 'value' as value,
           coalesce((item ->> 'is_enabled')::boolean, true) as is_enabled
    from jsonb_array_elements(selected_revision.snapshot -> 'content') item
  ) restored
  where c.key = restored.key;

  if selected_revision.page_slug = 'faq' then
    update public.site_faq_items f
    set draft_question = restored.question,
        draft_answer = restored.answer,
        is_enabled = restored.is_enabled,
        sort_order = restored.sort_order,
        updated_by = (select auth.uid()),
        updated_at = now()
    from (
      select (item ->> 'id')::uuid as id,
             item ->> 'question' as question,
             item ->> 'answer' as answer,
             coalesce((item ->> 'is_enabled')::boolean, true) as is_enabled,
             coalesce((item ->> 'sort_order')::integer, 0) as sort_order
      from jsonb_array_elements(selected_revision.snapshot -> 'faq') item
    ) restored
    where f.id = restored.id;
  end if;

  insert into public.site_content_revisions (page_slug, action, snapshot, changed_by)
  values (selected_revision.page_slug, 'restore', selected_revision.snapshot, (select auth.uid()));
end;
$$;

revoke all on function public.publish_site_page(text) from public, anon;
revoke all on function public.discard_site_page_drafts(text) from public, anon;
revoke all on function public.restore_site_revision(uuid) from public, anon;
grant execute on function public.publish_site_page(text) to authenticated;
grant execute on function public.discard_site_page_drafts(text) to authenticated;
grant execute on function public.restore_site_revision(uuid) to authenticated;

grant select on table public.site_content to anon, authenticated;
grant insert, update, delete on table public.site_content to authenticated;
grant select on table public.site_faq_items to anon, authenticated;
grant insert, update, delete on table public.site_faq_items to authenticated;
grant select, insert on table public.site_content_revisions to authenticated;
grant select, insert, update, delete on table public.media_assets to authenticated;

-- A safe initial editing catalogue. These are editable fallbacks for the public pages.
insert into public.site_content
  (key, value, page_slug, section_slug, label, content_type, draft_value, published_value, sort_order, is_enabled, published_is_enabled, is_public, published_at)
values
  ('home.hero.eyebrow', 'English Speaking Club in Sergiev Posad', 'home', 'Hero', 'Section label', 'text', 'English Speaking Club in Sergiev Posad', 'English Speaking Club in Sergiev Posad', 10, true, true, true, now()),
  ('home.hero.title', 'Speak English. Meet people. Feel at home.', 'home', 'Hero', 'Headline', 'textarea', 'Speak English. Meet people. Feel at home.', 'Speak English. Meet people. Feel at home.', 20, true, true, true, now()),
  ('home.hero.subtitle', 'A friendly local English-speaking community built around real conversations, real meetups, and progress without pressure.', 'home', 'Hero', 'Subtitle', 'textarea', 'A friendly local English-speaking community built around real conversations, real meetups, and progress without pressure.', 'A friendly local English-speaking community built around real conversations, real meetups, and progress without pressure.', 30, true, true, true, now()),
  ('home.hero.cta', 'Join the club', 'home', 'Hero', 'Primary CTA label', 'text', 'Join the club', 'Join the club', 40, true, true, true, now()),
  ('home.hero.cta_url', '/?auth=register', 'home', 'Hero', 'Primary CTA link', 'url', '/?auth=register', '/?auth=register', 50, true, true, true, now()),
  ('about.hero.title', 'A local English-speaking community in Sergiev Posad', 'about', 'Hero', 'Headline', 'textarea', 'A local English-speaking community in Sergiev Posad', 'A local English-speaking community in Sergiev Posad', 10, true, true, true, now()),
  ('about.intro', 'Galstyan’s Speaking Club is a welcoming place to practice spoken English, meet people, and build confidence through real conversation.', 'about', 'Hero', 'Subtitle', 'textarea', 'Galstyan’s Speaking Club is a welcoming place to practice spoken English, meet people, and build confidence through real conversation.', 'Galstyan’s Speaking Club is a welcoming place to practice spoken English, meet people, and build confidence through real conversation.', 20, true, true, true, now()),
  ('about.host.name', 'Gevorg Galstyan', 'about', 'Meet the host', 'Host name', 'text', 'Gevorg Galstyan', 'Gevorg Galstyan', 30, true, true, true, now()),
  ('about.host.location', 'I’m from Yerevan, Armenia 🇦🇲 and currently live in Sergiyev Posad.', 'about', 'Meet the host', 'Location', 'textarea', 'I’m from Yerevan, Armenia 🇦🇲 and currently live in Sergiyev Posad.', 'I’m from Yerevan, Armenia 🇦🇲 and currently live in Sergiyev Posad.', 40, true, true, true, now()),
  ('about.host.bio', 'I’m Gevorg Galstyan, the host of our meetups.\n\nI’ve been studying English for years, and I genuinely love the whole English-speaking vibe — the people, the conversations, the confidence, the atmosphere.\n\nThat’s exactly why I created Galstyan’s Speaking Club.\n\nCome join us, practice English with real people, meet new friends, and don’t worry about your level.\n\nYou don’t need perfect English to start.\n\nPractice makes perfect.', 'about', 'Meet the host', 'Host bio', 'textarea', 'I’m Gevorg Galstyan, the host of our meetups.\n\nI’ve been studying English for years, and I genuinely love the whole English-speaking vibe — the people, the conversations, the confidence, the atmosphere.\n\nThat’s exactly why I created Galstyan’s Speaking Club.\n\nCome join us, practice English with real people, meet new friends, and don’t worry about your level.\n\nYou don’t need perfect English to start.\n\nPractice makes perfect.', 'I’m Gevorg Galstyan, the host of our meetups.\n\nI’ve been studying English for years, and I genuinely love the whole English-speaking vibe — the people, the conversations, the confidence, the atmosphere.\n\nThat’s exactly why I created Galstyan’s Speaking Club.\n\nCome join us, practice English with real people, meet new friends, and don’t worry about your level.\n\nYou don’t need perfect English to start.\n\nPractice makes perfect.', 50, true, true, true, now()),
  ('about.host.photo', '/gevorg-galstyan-host.jpg', 'about', 'Meet the host', 'Host photo', 'image', '/gevorg-galstyan-host.jpg', '/gevorg-galstyan-host.jpg', 60, true, true, true, now()),
  ('about.host.photo_alt', 'Gevorg Galstyan, host of Galstyan’s Speaking Club', 'about', 'Meet the host', 'Photo alt text', 'text', 'Gevorg Galstyan, host of Galstyan’s Speaking Club', 'Gevorg Galstyan, host of Galstyan’s Speaking Club', 70, true, true, true, now()),
  ('about.host.cta', 'Join the club', 'about', 'Meet the host', 'CTA label', 'text', 'Join the club', 'Join the club', 80, true, true, true, now()),
  ('about.host.cta_url', '/?auth=register', 'about', 'Meet the host', 'CTA link', 'url', '/?auth=register', '/?auth=register', 90, true, true, true, now()),
  ('contact.hero.title', 'Have a question? Say hello.', 'contact', 'Hero', 'Headline', 'textarea', 'Have a question? Say hello.', 'Have a question? Say hello.', 10, true, true, true, now()),
  ('contact.intro', 'Ask about English practice, the next meetup, or how to join Galstyan’s Speaking Club in Sergiyev Posad.', 'contact', 'Hero', 'Subtitle', 'textarea', 'Ask about English practice, the next meetup, or how to join Galstyan’s Speaking Club in Sergiyev Posad.', 'Ask about English practice, the next meetup, or how to join Galstyan’s Speaking Club in Sergiyev Posad.', 20, true, true, true, now()),
  ('contact.local_heading', 'Looking for an English club in Sergiyev Posad?', 'contact', 'Local answer', 'Heading', 'textarea', 'Looking for an English club in Sergiyev Posad?', 'Looking for an English club in Sergiyev Posad?', 30, true, true, true, now()),
  ('contact.telegram_url', 'https://t.me/GalstyansSpeakingClub', 'contact', 'Contact details', 'Telegram link', 'url', 'https://t.me/GalstyansSpeakingClub', 'https://t.me/GalstyansSpeakingClub', 40, true, true, true, now()),
  ('faq.intro', 'Everything we can say accurately today about English practice, published meetups, member access, and the GSC community.', 'faq', 'Hero', 'Subtitle', 'textarea', 'Everything we can say accurately today about English practice, published meetups, member access, and the GSC community.', 'Everything we can say accurately today about English practice, published meetups, member access, and the GSC community.', 10, true, true, true, now()),
  ('community.hero.title', 'A reason to keep English in your life', 'community', 'Hero', 'Headline', 'textarea', 'A reason to keep English in your life', 'A reason to keep English in your life', 10, true, true, true, now()),
  ('community.intro', 'Galstyan’s Speaking Club is a local Sergiev Posad community for conversation, confidence, and the people you meet along the way.', 'community', 'Hero', 'Subtitle', 'textarea', 'Galstyan’s Speaking Club is a local Sergiev Posad community for conversation, confidence, and the people you meet along the way.', 'Galstyan’s Speaking Club is a local Sergiev Posad community for conversation, confidence, and the people you meet along the way.', 20, true, true, true, now()),
  ('how-it-works.hero.title', 'A simple way to practice spoken English', 'how-it-works', 'Hero', 'Headline', 'textarea', 'A simple way to practice spoken English', 'A simple way to practice spoken English', 10, true, true, true, now()),
  ('how-it-works.intro', 'Join the community, choose a published meetup, and turn English on at the table.', 'how-it-works', 'Hero', 'Subtitle', 'textarea', 'Join the community, choose a published meetup, and turn English on at the table.', 'Join the community, choose a published meetup, and turn English on at the table.', 20, true, true, true, now()),
  ('membership.hero.title', 'A member space that keeps your progress close', 'membership', 'Hero', 'Headline', 'textarea', 'A member space that keeps your progress close', 'A member space that keeps your progress close', 10, true, true, true, now()),
  ('membership.intro', 'The current GSC application connects a member profile with question progress, favorites, attendance records, bookings, and loyalty rewards.', 'membership', 'Hero', 'Subtitle', 'textarea', 'The current GSC application connects a member profile with question progress, favorites, attendance records, bookings, and loyalty rewards.', 'The current GSC application connects a member profile with question progress, favorites, attendance records, bookings, and loyalty rewards.', 20, true, true, true, now()),
  ('meetups.intro', 'Published meetup dates, venues, capacity, and booking details appear here when they are ready.', 'meetups', 'Hero', 'Subtitle', 'textarea', 'Published meetup dates, venues, capacity, and booking details appear here when they are ready.', 'Published meetup dates, venues, capacity, and booking details appear here when they are ready.', 10, true, true, true, now()),
  ('questions.intro', 'Explore conversation prompts by level and category, save favorites, and keep English moving between meetups.', 'questions', 'Hero', 'Subtitle', 'textarea', 'Explore conversation prompts by level and category, save favorites, and keep English moving between meetups.', 'Explore conversation prompts by level and category, save favorites, and keep English moving between meetups.', 10, true, true, true, now()),
  ('settings.club_name', 'Galstyan’s Speaking Club', 'settings', 'Brand', 'Club name', 'text', 'Galstyan’s Speaking Club', 'Galstyan’s Speaking Club', 10, true, true, true, now()),
  ('settings.default_city', 'Sergiyev Posad', 'settings', 'Contact', 'Default city', 'text', 'Sergiyev Posad', 'Sergiyev Posad', 20, true, true, true, now()),
  ('settings.telegram_url', 'https://t.me/GalstyansSpeakingClub', 'settings', 'Social links', 'Telegram URL', 'url', 'https://t.me/GalstyansSpeakingClub', 'https://t.me/GalstyansSpeakingClub', 30, true, true, true, now()),
  ('settings.instagram_url', 'https://instagram.com/galstyansspeakingclub', 'settings', 'Social links', 'Instagram URL', 'url', 'https://instagram.com/galstyansspeakingclub', 'https://instagram.com/galstyansspeakingclub', 40, true, true, true, now()),
  ('settings.vk_url', 'https://vk.ru/galstyansspeakingclub', 'settings', 'Social links', 'VK URL', 'url', 'https://vk.ru/galstyansspeakingclub', 'https://vk.ru/galstyansspeakingclub', 50, true, true, true, now()),
  ('settings.youtube_url', '', 'settings', 'Social links', 'YouTube URL', 'url', '', '', 60, true, true, true, now()),
  ('settings.contact_email', '', 'settings', 'Contact', 'Contact email', 'text', '', '', 70, true, true, true, now()),
  ('settings.logo', '/gsc-logo.jpg', 'settings', 'Brand', 'Logo', 'image', '/gsc-logo.jpg', '/gsc-logo.jpg', 80, true, true, true, now()),
  ('settings.default_seo_description', 'Galstyan’s Speaking Club is an English speaking and conversation club in Sergiev Posad for friendly practice, real meetups, and a welcoming local community.', 'settings', 'SEO', 'Default SEO description', 'seo', 'Galstyan’s Speaking Club is an English speaking and conversation club in Sergiev Posad for friendly practice, real meetups, and a welcoming local community.', 'Galstyan’s Speaking Club is an English speaking and conversation club in Sergiev Posad for friendly practice, real meetups, and a welcoming local community.', 90, true, true, true, now()),
  ('settings.banner_text', '', 'settings', 'Public notice', 'Banner text', 'textarea', '', '', 100, false, false, true, now())
on conflict (key) do update
set page_slug = excluded.page_slug,
    section_slug = excluded.section_slug,
    label = excluded.label,
    content_type = excluded.content_type,
    sort_order = excluded.sort_order;

commit;
