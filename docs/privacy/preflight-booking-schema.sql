-- Metadata-only preflight; no user rows, credentials or Auth settings.
-- Existing booking triggers/functions before privacy pause.
CREATE OR REPLACE FUNCTION app_private.guard_booking_updates()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
  if (select auth.uid()) is not null and not app_private.is_admin() then
    if old.user_id <> (select auth.uid())
      or new.id <> old.id
      or new.user_id <> old.user_id
      or new.meetup_id <> old.meetup_id
      or new.booked_at <> old.booked_at
      or old.status <> 'confirmed'
      or new.status <> 'cancelled'
    then
      raise exception using
        errcode = '42501',
        message = 'Members may only cancel their own confirmed bookings';
    end if;
  end if;

  if new.status = 'cancelled' and old.status <> 'cancelled' then
    new.cancelled_at := now();
  elsif new.status = 'confirmed' then
    new.cancelled_at := null;
  end if;

  return new;
end;
$function$;
CREATE TRIGGER meetup_bookings_10_guard_updates BEFORE UPDATE ON public.meetup_bookings FOR EACH ROW EXECUTE FUNCTION app_private.guard_booking_updates();

CREATE OR REPLACE FUNCTION app_private.sync_booking_capacity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  meetup_status text;
  opens_at timestamptz;
  closes_at timestamptz;
  meetup_start timestamptz;
begin
  if tg_op = 'DELETE' then
    if old.status = 'confirmed' then
      update public.meetups
      set confirmed_booking_count = confirmed_booking_count - 1
      where id = old.meetup_id
        and confirmed_booking_count > 0;

      if not found then
        raise exception using
          errcode = '23514',
          message = 'Confirmed booking count is inconsistent';
      end if;
    end if;

    return old;
  end if;

  if tg_op = 'UPDATE' and new.meetup_id <> old.meetup_id then
    raise exception using
      errcode = '23514',
      message = 'A booking cannot be moved to another meetup';
  end if;

  if tg_op = 'UPDATE' and old.status = 'confirmed' and new.status = 'cancelled' then
    update public.meetups
    set confirmed_booking_count = confirmed_booking_count - 1
    where id = old.meetup_id
      and confirmed_booking_count > 0;

    if not found then
      raise exception using
        errcode = '23514',
        message = 'Confirmed booking count is inconsistent';
    end if;

    return new;
  end if;

  if new.status <> 'confirmed'
    or (tg_op = 'UPDATE' and old.status = 'confirmed')
  then
    return new;
  end if;

  update public.meetups
  set confirmed_booking_count = confirmed_booking_count + 1
  where id = new.meetup_id
    and confirmed_booking_count < capacity
  returning status, booking_opens_at, booking_closes_at, starts_at
  into meetup_status, opens_at, closes_at, meetup_start;

  if not found then
    if exists (select 1 from public.meetups where id = new.meetup_id) then
      raise exception using
        errcode = 'P0001',
        message = 'This meetup has reached capacity';
    end if;

    raise exception using
      errcode = '23503',
      message = 'Meetup does not exist';
  end if;

  if not app_private.is_admin() then
    if meetup_status <> 'published' then
      raise exception using
        errcode = 'P0001',
        message = 'This meetup is not open for booking';
    end if;

    if opens_at is not null and now() < opens_at then
      raise exception using
        errcode = 'P0001',
        message = 'Booking has not opened yet';
    end if;

    if (closes_at is not null and now() >= closes_at) or now() >= meetup_start then
      raise exception using
        errcode = 'P0001',
        message = 'Booking is closed';
      end if;
  end if;

  return new;
end;
$function$;
CREATE TRIGGER meetup_bookings_20_sync_capacity AFTER INSERT OR DELETE OR UPDATE OF status, meetup_id ON public.meetup_bookings FOR EACH ROW EXECUTE FUNCTION app_private.sync_booking_capacity();

CREATE OR REPLACE FUNCTION app_private.notify_booking_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$;
CREATE TRIGGER meetup_bookings_notify_change AFTER INSERT OR UPDATE OF status ON public.meetup_bookings FOR EACH ROW EXECUTE FUNCTION app_private.notify_booking_change();

CREATE OR REPLACE FUNCTION app_private.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;
CREATE TRIGGER meetup_bookings_set_updated_at BEFORE UPDATE ON public.meetup_bookings FOR EACH ROW EXECUTE FUNCTION app_private.set_updated_at();
-- New privacy objects were absent at preflight. Emergency rollback of this additive change only:
-- drop trigger if exists enforce_booking_privacy_pause on public.meetup_bookings;
-- drop function if exists app_private.enforce_booking_privacy_pause();
-- drop table if exists app_private.privacy_protection_control;
-- Do not execute rollback automatically; it reopens member bookings, not Auth signup.

