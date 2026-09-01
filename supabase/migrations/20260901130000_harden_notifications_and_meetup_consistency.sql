-- Structured notification audiences and static-safe navigation targets.
-- Recipient rows are intentional: RLS can enforce privacy without trusting UI filters.
begin;

alter table public.notifications
  add column if not exists audience_type text not null default 'specific_user',
  add column if not exists entity_type text,
  add column if not exists entity_id uuid,
  add column if not exists target_url text;

update public.notifications
set audience_type = case
  when kind in ('new_member', 'new_booking') then 'admin'
  else 'specific_user'
end,
entity_type = coalesce(entity_type, case when meetup_id is not null then 'meetup' when booking_id is not null then 'booking' else null end),
entity_id = coalesce(entity_id, meetup_id, booking_id),
target_url = coalesce(target_url, case
  when meetup_id is not null then '/meetups/?id=' || meetup_id::text
  when kind in ('booking_confirmed', 'booking_cancelled') then '/account/#bookings'
  else null
end);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'notifications_audience_type_allowed') then
    alter table public.notifications add constraint notifications_audience_type_allowed
      check (audience_type in ('admin', 'all_members', 'specific_user'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'notifications_target_url_internal') then
    alter table public.notifications add constraint notifications_target_url_internal
      check (target_url is null or (target_url like '/%' and target_url not like '//%'));
  end if;
end $$;

create index if not exists notifications_recipient_audience_created_idx
  on public.notifications (user_id, audience_type, created_at desc);

drop policy if exists notifications_read_own on public.notifications;
drop policy if exists notifications_admin_read on public.notifications;
create policy notifications_read_recipient_or_admin
on public.notifications for select to authenticated
using (
  (user_id = (select auth.uid()) and (audience_type <> 'admin' or (select app_private.is_admin())))
  or (select app_private.is_admin())
);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_recipient
on public.notifications for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

revoke insert, delete on table public.notifications from authenticated;
grant select, update (read_at) on table public.notifications to authenticated;

create or replace function app_private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare metadata_name text; metadata_avatar text; allowed_admin boolean;
begin
  metadata_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')), '');
  metadata_avatar := nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), '');
  allowed_admin := lower(coalesce(new.email, '')) in ('galstyanwork@gmail.com','galstyanoff@gmail.com','gevgalstyan913@gmail.com');
  insert into public.profiles (id, display_name, avatar_url, onboarding_completed)
  values (new.id, case when metadata_name is null then null else left(metadata_name, 80) end, case when metadata_avatar is null then null else left(metadata_avatar, 2048) end, false)
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, case when allowed_admin then 'admin' else 'member' end)
  on conflict (user_id) do update set role = excluded.role;
  insert into public.notifications (user_id, audience_type, kind, title, body, entity_type, entity_id, target_url)
  select r.user_id, 'admin', 'new_member', 'New member registered',
    coalesce(metadata_name, 'A new member') || ' created a member account.', 'member', new.id, '/admin/?section=members&member=' || new.id::text
  from public.user_roles r where r.role = 'admin';
  return new;
end;
$$;

create or replace function app_private.notify_published_meetup()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    insert into public.notifications (user_id, audience_type, kind, title, body, meetup_id, entity_type, entity_id, target_url)
    select r.user_id, 'all_members', 'new_meetup', 'A new GSC meetup is live',
      left(new.title, 100) || ' is now open to members.', new.id, 'meetup', new.id, '/meetups/?id=' || new.id::text
    from public.user_roles r where r.role = 'member'
    on conflict (user_id, meetup_id, kind) where meetup_id is not null do nothing;
  elsif new.status = 'cancelled' and (tg_op = 'INSERT' or old.status is distinct from 'cancelled') then
    insert into public.notifications (user_id, audience_type, kind, title, body, meetup_id, booking_id, entity_type, entity_id, target_url)
    select b.user_id, 'specific_user', 'meetup_cancelled', 'Meetup cancelled',
      left(new.title, 100) || ' has been cancelled. Your booking remains in your history.', new.id, b.id, 'meetup', new.id, '/meetups/?id=' || new.id::text
    from public.meetup_bookings b where b.meetup_id = new.id and b.status = 'confirmed'
    on conflict (user_id, booking_id, kind) where booking_id is not null do nothing;
  end if;
  return new;
end;
$$;

create or replace function public.admin_publish_announcement(p_title text, p_body text, p_target_url text default null)
returns integer language plpgsql security definer set search_path = '' as $$
declare recipient_count integer;
begin
  if not (select app_private.is_admin()) then raise exception using errcode = '42501', message = 'Administrator access required'; end if;
  if char_length(btrim(p_title)) not between 1 and 160 or char_length(btrim(p_body)) not between 1 and 1000 then
    raise exception using errcode = '22023', message = 'Announcement content is invalid';
  end if;
  if p_target_url is not null and (p_target_url not like '/%' or p_target_url like '//%') then
    raise exception using errcode = '22023', message = 'Announcement target must be an internal path';
  end if;
  insert into public.notifications (user_id, audience_type, kind, title, body, entity_type, target_url)
  select r.user_id, 'all_members', 'announcement', btrim(p_title), btrim(p_body), 'announcement', p_target_url
  from public.user_roles r where r.role = 'member';
  get diagnostics recipient_count = row_count;
  return recipient_count;
end;
$$;
revoke all on function public.admin_publish_announcement(text, text, text) from public, anon;
grant execute on function public.admin_publish_announcement(text, text, text) to authenticated;

commit;
