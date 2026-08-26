-- ============================================
-- MEETUP BOOKING — CAPACITY GUARD COMPATIBILITY
-- Risk: CRITICAL — protects booking-capacity trigger updates.
-- ============================================

begin;

-- The generic updated_at trigger runs before this guard. Ignore that automatic
-- bookkeeping field when the booking trigger changes only the capacity count.
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
    if tg_table_name <> 'meetups'
      or tg_op <> 'UPDATE'
      or (to_jsonb(new) - array['confirmed_booking_count', 'updated_at'])
         is distinct from (to_jsonb(old) - array['confirmed_booking_count', 'updated_at']) then
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
    and (to_jsonb(new) - array['confirmed_booking_count', 'updated_at'])
        is not distinct from (to_jsonb(old) - array['confirmed_booking_count', 'updated_at']) then
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

commit;
