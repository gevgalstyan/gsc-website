begin;

-- Keep the existing meetup, booking, attendance, and reward tables as the
-- business source of truth. This migration only adds the missing state needed
-- to make the admin/member flow observable and auditable.

alter table public.notifications
  add column if not exists booking_id uuid references public.meetup_bookings (id) on delete cascade;

create index if not exists notifications_booking_idx
  on public.notifications (booking_id, created_at desc)
  where booking_id is not null;

create unique index if not exists notifications_booking_once_idx
  on public.notifications (user_id, booking_id, kind)
  where booking_id is not null;

alter table public.attendance
  add column if not exists payment_status text not null default 'unpaid';

update public.attendance
set payment_status = case when is_paid then 'paid' else 'unpaid' end
where payment_status is null
   or (payment_status = 'unpaid' and is_paid = true);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'attendance_payment_status_allowed'
      and conrelid = 'public.attendance'::regclass
  ) then
    alter table public.attendance
      add constraint attendance_payment_status_allowed
      check (payment_status in ('paid', 'unpaid', 'free_reward'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'attendance_payment_state_consistent'
      and conrelid = 'public.attendance'::regclass
  ) then
    alter table public.attendance
      add constraint attendance_payment_state_consistent
      check (
        (payment_status = 'paid' and is_paid = true and paid_currency is not null)
        or
        (payment_status in ('unpaid', 'free_reward') and is_paid = false
          and paid_amount_minor is null and paid_currency is null)
      );
  end if;
end;
$$;

-- The trigger remains the authoritative normalizer for admin attendance edits.
-- Older clients that still submit is_paid=true are upgraded to payment_status
-- paid; new clients use the explicit three-state field.
create or replace function app_private.stamp_admin_managed_rows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is not null and not app_private.is_admin() then
    -- Booking capacity is maintained by a SECURITY DEFINER trigger after a
    -- member booking. That internal update changes only the counter; every
    -- other meetup-definition update remains admin-only.
    if tg_table_name <> 'meetups'
      or tg_op <> 'UPDATE'
      or (to_jsonb(new) - array['confirmed_booking_count'])
         is distinct from (to_jsonb(old) - array['confirmed_booking_count']) then
      raise exception using errcode = '42501', message = 'Administrator access required';
    end if;
    return new;
  end if;

  if tg_table_name = 'meetups' then
    if tg_op = 'INSERT' then new.created_by := actor; end if;
    new.updated_by := actor;
  elsif tg_table_name = 'attendance' then
    if tg_op = 'INSERT' or new.status is distinct from old.status then
      new.recorded_by := actor;
      new.recorded_at := now();
    end if;

    if new.payment_status = 'unpaid' and new.is_paid then
      new.payment_status := 'paid';
    end if;

    if new.payment_status = 'paid' then
      new.is_paid := true;
      if new.paid_currency is null then
        raise exception using errcode = '23514', message = 'Paid attendance requires a currency';
      end if;
      if tg_op = 'INSERT' or old.payment_status is distinct from new.payment_status
        or old.is_paid is distinct from new.is_paid
        or old.paid_amount_minor is distinct from new.paid_amount_minor
        or old.paid_currency is distinct from new.paid_currency
      then
        new.payment_recorded_by := actor;
        new.payment_recorded_at := now();
      end if;
    else
      new.is_paid := false;
      new.paid_amount_minor := null;
      new.paid_currency := null;
      new.payment_recorded_by := null;
      new.payment_recorded_at := null;
    end if;
  elsif tg_table_name = 'special_rewards' then
    if tg_op = 'INSERT' then new.issued_by := actor; end if;
    new.updated_by := actor;
  elsif tg_table_name in ('attendance_admin_notes', 'special_reward_admin_notes') then
    new.updated_by := actor;
  end if;
  return new;
end;
$$;

-- A free visit must consume an available ledger reward. It cannot be created
-- as a free attendance without a booking because redemption must be auditable.
create or replace function app_private.redeem_free_reward_for_attendance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reward_id uuid;
begin
  if tg_op = 'UPDATE'
    and old.payment_status = 'free_reward'
    and new.payment_status <> 'free_reward'
    and exists (
      select 1 from public.loyalty_rewards
      where redeemed_booking_id = old.booking_id
        and user_id = old.user_id
        and status = 'redeemed'
    ) then
    raise exception using
      errcode = '23514',
      message = 'A redeemed free visit cannot be changed to a paid visit';
  end if;

  if new.status = 'attended'
    and new.payment_status = 'free_reward'
    and (tg_op = 'INSERT' or old.payment_status is distinct from new.payment_status) then
    if new.booking_id is null then
      raise exception using errcode = '23514', message = 'A free visit must reference a booking';
    end if;

    select id into reward_id
    from public.loyalty_rewards
    where user_id = new.user_id
      and status = 'available'
      and reward_type = 'free_meetup'
      and (expires_at is null or expires_at > now())
    order by reward_sequence
    for update skip locked
    limit 1;

    if reward_id is null then
      raise exception using errcode = 'P0001', message = 'No free meetup reward is available';
    end if;

    update public.loyalty_rewards
    set status = 'redeemed',
        redeemed_booking_id = new.booking_id,
        redeemed_at = now(),
        updated_at = now()
    where id = reward_id;
  end if;

  return new;
end;
$$;

revoke all on function app_private.redeem_free_reward_for_attendance()
  from public, anon, authenticated;

drop trigger if exists attendance_05_redeem_free_reward on public.attendance;
create trigger attendance_05_redeem_free_reward
before insert or update on public.attendance
for each row execute function app_private.redeem_free_reward_for_attendance();

-- Replace the publish trigger with a status-aware version. Publishing alerts
-- all members; cancellation alerts only confirmed bookers and preserves the
-- booking record for history.
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
    on conflict (user_id, meetup_id, kind) where meetup_id is not null do nothing;
  elsif new.status = 'cancelled'
    and (tg_op = 'INSERT' or old.status is distinct from 'cancelled') then
    insert into public.notifications (user_id, kind, title, body, meetup_id, booking_id)
    select
      booking.user_id,
      'meetup_cancelled',
      'Meetup cancelled',
      left(new.title, 100) || ' has been cancelled. Your booking remains in your history.',
      new.id,
      booking.id
    from public.meetup_bookings as booking
    where booking.meetup_id = new.id
      and booking.status = 'confirmed'
    on conflict (user_id, booking_id, kind) where booking_id is not null do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists meetups_notify_published on public.meetups;
create trigger meetups_notify_published
after insert or update of status on public.meetups
for each row execute function app_private.notify_published_meetup();

-- Booking notifications are in-app and visible to administrators immediately.
-- The member also receives a confirmation/cancellation record for a coherent
-- dashboard timeline.
create or replace function app_private.notify_booking_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meetup_title text;
  member_name text;
  member_email text;
  meetup_timezone text;
  detail text;
  kind_name text;
  title_text text;
begin
  select m.title, coalesce(nullif(btrim(p.display_name), ''), 'Member'), coalesce(u.email::text, 'email unavailable'), coalesce(m.timezone, 'Europe/Moscow')
  into meetup_title, member_name, member_email, meetup_timezone
  from public.meetups m
  join auth.users u on u.id = new.user_id
  left join public.profiles p on p.id = new.user_id
  where m.id = new.meetup_id;

  if new.status = 'confirmed'
    and (tg_op = 'INSERT' or old.status <> 'confirmed') then
    kind_name := 'new_booking';
    title_text := 'New booking';
    detail := format('%s (%s) booked %s · %s.', member_name, member_email, meetup_title, to_char(new.booked_at at time zone meetup_timezone, 'Mon DD · HH24:MI'));
  elsif new.status = 'cancelled'
    and (tg_op = 'UPDATE' and old.status <> 'cancelled') then
    kind_name := 'booking_cancelled';
    title_text := 'Booking cancelled';
    detail := format('%s (%s) cancelled their booking for %s · booked %s.', member_name, member_email, meetup_title, to_char(new.booked_at at time zone meetup_timezone, 'Mon DD · HH24:MI'));
  else
    return new;
  end if;

  insert into public.notifications (user_id, kind, title, body, meetup_id, booking_id)
  select role_row.user_id, kind_name, title_text, left(detail, 1000), new.meetup_id, new.id
  from public.user_roles role_row
  where role_row.role = 'admin'
  on conflict (user_id, booking_id, kind) where booking_id is not null do nothing;

  insert into public.notifications (user_id, kind, title, body, meetup_id, booking_id)
  values (
    new.user_id,
    case when kind_name = 'new_booking' then 'booking_confirmed' else 'booking_cancelled' end,
    case when kind_name = 'new_booking' then 'Booking confirmed' else 'Booking cancelled' end,
    left(detail, 1000),
    new.meetup_id,
    new.id
  )
  on conflict (user_id, booking_id, kind) where booking_id is not null do nothing;

  return new;
end;
$$;

revoke all on function app_private.notify_booking_change() from public, anon, authenticated;
drop trigger if exists meetup_bookings_notify_change on public.meetup_bookings;
create trigger meetup_bookings_notify_change
after insert or update of status on public.meetup_bookings
for each row execute function app_private.notify_booking_change();

-- Capacity synchronization is an internal database mutation, not an admin
-- business action. Do not create a misleading admin audit row for it.
create or replace function app_private.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  before_row jsonb := case when tg_op = 'INSERT' then null else to_jsonb(old) end;
  after_row jsonb := case when tg_op = 'DELETE' then null else to_jsonb(new) end;
  target text;
begin
  if tg_table_name = 'meetups'
    and tg_op = 'UPDATE'
    and not app_private.is_admin()
    and (to_jsonb(new) - array['confirmed_booking_count'])
        is not distinct from (to_jsonb(old) - array['confirmed_booking_count']) then
    return new;
  end if;

  target := coalesce(after_row ->> 'id', before_row ->> 'id', after_row ->> 'user_id', before_row ->> 'user_id');
  insert into public.admin_audit_log (actor_user_id, action, target_table, target_id, details)
  values (
    (select auth.uid()), lower(tg_op), tg_table_name, target,
    jsonb_strip_nulls(jsonb_build_object(
      'before', before_row - array['notes', 'note'],
      'after', after_row - array['notes', 'note']
    ))
  );
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function app_private.audit_admin_change() from public, anon, authenticated;

-- Expose only the safe payment state to authenticated members/admins. RLS
-- continues to make all writes admin-only.
grant select (
  id, meetup_id, user_id, booking_id, status, recorded_by, recorded_at,
  is_paid, payment_status, paid_amount_minor, paid_currency,
  payment_recorded_at, created_at, updated_at
) on table public.attendance to authenticated;
grant select, update (payment_status, is_paid, paid_amount_minor, paid_currency)
  on table public.attendance to authenticated;
grant select, update (booking_id) on table public.notifications to authenticated;

comment on column public.attendance.payment_status is
  'Admin-controlled payment state: paid, unpaid, or free_reward. Only paid attended rows qualify for loyalty.';
comment on column public.notifications.booking_id is
  'Optional booking association used for auditable booking and cancellation alerts.';

-- status is the single publication source of truth. is_public is retained for
-- backwards-compatible writes, but a published meetup must not disappear from
-- member/public reads because an older admin client left that legacy flag off.
drop policy if exists meetups_anonymous_read on public.meetups;
create policy meetups_anonymous_read
on public.meetups for select
to anon
using (status in ('published', 'cancelled', 'completed'));

commit;
