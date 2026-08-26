-- ============================================
-- MEMBER / ADMIN DASHBOARD DATA AND LOYALTY
-- Risk: CRITICAL — payment, rewards, roles, audit, grants, and RLS.
-- ============================================

begin;

-- Payment qualification remains authoritative on attendance rows and is never
-- writable by members. Existing attendance defaults to unpaid until reviewed.
alter table public.attendance
  add column is_paid boolean not null default false,
  add column paid_amount_minor integer,
  add column paid_currency text,
  add column payment_recorded_at timestamptz,
  add column payment_recorded_by uuid references auth.users (id) on delete set null,
  add constraint attendance_paid_amount_nonnegative
    check (paid_amount_minor is null or paid_amount_minor >= 0),
  add constraint attendance_paid_currency_format
    check (paid_currency is null or paid_currency ~ '^[A-Z]{3}$'),
  add constraint attendance_payment_consistent
    check (
      (is_paid and payment_recorded_at is not null and payment_recorded_by is not null)
      or
      (not is_paid and paid_amount_minor is null and paid_currency is null
        and payment_recorded_at is null and payment_recorded_by is null)
    );

create index attendance_paid_user_recorded_idx
  on public.attendance (user_id, recorded_at desc)
  where status = 'attended' and is_paid = true;
create index attendance_payment_recorded_by_idx
  on public.attendance (payment_recorded_by);
create index attendance_booking_member_meetup_idx
  on public.attendance (booking_id, user_id, meetup_id);

-- ============================================
-- ATTENDANCE / PRIVATE ADMIN NOTES
-- ============================================
-- Private notes are separated from member-readable attendance and rewards.
create table public.attendance_admin_notes (
  attendance_id uuid primary key references public.attendance (id) on delete cascade,
  note text not null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_admin_notes_length check (char_length(btrim(note)) between 1 and 4000)
);

insert into public.attendance_admin_notes (attendance_id, note, updated_by)
select id, notes, recorded_by
from public.attendance
where notes is not null and btrim(notes) <> ''
on conflict (attendance_id) do nothing;

update public.attendance set notes = null where notes is not null;

create index attendance_admin_notes_updated_by_idx
  on public.attendance_admin_notes (updated_by);

create table public.special_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  reason text not null,
  description text,
  status text not null default 'available',
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  redeemed_at timestamptz,
  issued_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint special_rewards_name_length check (char_length(btrim(name)) between 1 and 120),
  constraint special_rewards_reason_length check (char_length(btrim(reason)) between 1 and 500),
  constraint special_rewards_description_length check (description is null or char_length(description) <= 2000),
  constraint special_rewards_status_allowed check (status in ('available', 'redeemed', 'cancelled', 'expired')),
  constraint special_rewards_expiry_order check (expires_at is null or expires_at > issued_at),
  constraint special_rewards_redemption_consistent check (
    (status = 'redeemed' and redeemed_at is not null)
    or (status <> 'redeemed' and redeemed_at is null)
  )
);

create index special_rewards_user_status_idx
  on public.special_rewards (user_id, status, issued_at desc);
create index special_rewards_issued_by_idx on public.special_rewards (issued_by);
create index special_rewards_updated_by_idx on public.special_rewards (updated_by);

create table public.special_reward_admin_notes (
  reward_id uuid primary key references public.special_rewards (id) on delete cascade,
  note text not null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint special_reward_admin_notes_length check (char_length(btrim(note)) between 1 and 4000)
);

create index special_reward_admin_notes_updated_by_idx
  on public.special_reward_admin_notes (updated_by);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  target_table text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint admin_audit_log_action_length check (char_length(action) between 1 and 100),
  constraint admin_audit_log_target_table_length check (char_length(target_table) between 1 and 100),
  constraint admin_audit_log_details_object check (jsonb_typeof(details) = 'object')
);

create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index admin_audit_log_actor_idx on public.admin_audit_log (actor_user_id, created_at desc);
create index admin_audit_log_target_idx on public.admin_audit_log (target_table, target_id, created_at desc);

create trigger attendance_admin_notes_set_updated_at
before update on public.attendance_admin_notes
for each row execute function app_private.set_updated_at();
create trigger special_rewards_set_updated_at
before update on public.special_rewards
for each row execute function app_private.set_updated_at();
create trigger special_reward_admin_notes_set_updated_at
before update on public.special_reward_admin_notes
for each row execute function app_private.set_updated_at();

-- Actor columns are always derived from the authenticated session, never from
-- browser-submitted UUIDs.
create function app_private.stamp_admin_managed_rows()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if actor is not null and not app_private.is_admin() then
    raise exception using errcode = '42501', message = 'Administrator access required';
  end if;

  if tg_table_name = 'meetups' then
    if tg_op = 'INSERT' then new.created_by := actor; end if;
    new.updated_by := actor;
  elsif tg_table_name = 'attendance' then
    if tg_op = 'INSERT' or new.status is distinct from old.status then
      new.recorded_by := actor;
      new.recorded_at := now();
    end if;
    if new.is_paid then
      if tg_op = 'INSERT' or new.is_paid is distinct from old.is_paid
        or new.paid_amount_minor is distinct from old.paid_amount_minor
        or new.paid_currency is distinct from old.paid_currency
      then
        new.payment_recorded_by := actor;
        new.payment_recorded_at := now();
      end if;
    else
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

revoke all on function app_private.stamp_admin_managed_rows()
  from public, anon, authenticated;

create trigger meetups_stamp_actor before insert or update on public.meetups
for each row execute function app_private.stamp_admin_managed_rows();
create trigger attendance_stamp_actor before insert or update on public.attendance
for each row execute function app_private.stamp_admin_managed_rows();
create trigger attendance_admin_notes_stamp_actor before insert or update on public.attendance_admin_notes
for each row execute function app_private.stamp_admin_managed_rows();
create trigger special_rewards_stamp_actor before insert or update on public.special_rewards
for each row execute function app_private.stamp_admin_managed_rows();
create trigger special_reward_admin_notes_stamp_actor before insert or update on public.special_reward_admin_notes
for each row execute function app_private.stamp_admin_managed_rows();

-- Existing loyalty rows are assigned a stable per-member sequence before the
-- uniqueness constraint is enabled.
alter table public.loyalty_rewards
  add column reward_sequence integer,
  add column issuance_source text not null default 'automatic',
  add column reconciliation_voided boolean not null default false,
  add constraint loyalty_rewards_issuance_source_allowed
    check (issuance_source in ('automatic', 'manual'));

with sequenced as (
  select id, row_number() over (partition by user_id order by earned_at, id)::integer as sequence
  from public.loyalty_rewards
)
update public.loyalty_rewards reward
set reward_sequence = sequenced.sequence
from sequenced
where reward.id = sequenced.id;

alter table public.loyalty_rewards
  alter column reward_sequence set not null,
  add constraint loyalty_rewards_sequence_positive check (reward_sequence > 0),
  add constraint loyalty_rewards_user_sequence_unique unique (user_id, reward_sequence);

-- Sequence uniqueness is the durable anti-duplication key. A milestone
-- attendance can legitimately shift after an audited correction, so the older
-- global attendance-id uniqueness constraint would make reconciliation brittle.
alter table public.loyalty_rewards
  drop constraint loyalty_rewards_earning_unique;

create index loyalty_rewards_attendance_member_idx
  on public.loyalty_rewards (earned_after_attendance_id, user_id);
create index loyalty_rewards_booking_member_idx
  on public.loyalty_rewards (redeemed_booking_id, user_id);

-- ============================================
-- LOYALTY / FREE MEETUP RECONCILIATION
-- ============================================
-- Serialize reward calculation per member. Every sixth paid attended visit has
-- one deterministic reward sequence. Corrections can void only unredeemed
-- automatic rewards; a correction that would invalidate a redeemed reward fails.
create function app_private.reconcile_loyalty_rewards(member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  qualifying_count integer;
  target_count integer;
  redeemed_count integer;
  sequence_number integer;
  milestone_attendance_id uuid;
begin
  perform pg_advisory_xact_lock(hashtextextended(member_id::text, 0));

  select count(*)::integer into qualifying_count
  from public.attendance
  where user_id = member_id and status = 'attended' and is_paid = true;

  target_count := qualifying_count / 6;

  select count(*)::integer into redeemed_count
  from public.loyalty_rewards
  where user_id = member_id
    and issuance_source = 'automatic'
    and status = 'redeemed';

  if redeemed_count > target_count or exists (
    select 1 from public.loyalty_rewards
    where user_id = member_id
      and issuance_source = 'automatic'
      and status = 'redeemed'
      and reward_sequence > target_count
  ) then
    raise exception using
      errcode = '23514',
      message = 'This correction would invalidate an already redeemed loyalty reward';
  end if;

  for sequence_number in 1..target_count loop
    select id into milestone_attendance_id
    from public.attendance
    where user_id = member_id and status = 'attended' and is_paid = true
    order by recorded_at, id
    offset (sequence_number * 6) - 1 limit 1;

    insert into public.loyalty_rewards (
      user_id, reward_sequence, issuance_source, status,
      earned_after_attendance_id, required_attendance_count,
      reconciliation_voided
    ) values (
      member_id, sequence_number, 'automatic', 'available',
      milestone_attendance_id, 6, false
    )
    on conflict (user_id, reward_sequence) do update
    set earned_after_attendance_id = case
          when public.loyalty_rewards.status = 'redeemed'
            then public.loyalty_rewards.earned_after_attendance_id
          else excluded.earned_after_attendance_id
        end,
        status = case
          when public.loyalty_rewards.reconciliation_voided then 'available'
          else public.loyalty_rewards.status
        end,
        reconciliation_voided = false,
        updated_at = now();
  end loop;

  update public.loyalty_rewards
  set status = 'revoked', reconciliation_voided = true, updated_at = now()
  where user_id = member_id
    and issuance_source = 'automatic'
    and reward_sequence > target_count
    and status = 'available';
end;
$$;

revoke all on function app_private.reconcile_loyalty_rewards(uuid)
  from public, anon, authenticated;

create function app_private.reconcile_loyalty_after_attendance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    perform app_private.reconcile_loyalty_rewards(old.user_id);
    return old;
  end if;
  if tg_op = 'UPDATE' and old.user_id <> new.user_id then
    perform app_private.reconcile_loyalty_rewards(old.user_id);
  end if;
  perform app_private.reconcile_loyalty_rewards(new.user_id);
  return new;
end;
$$;

revoke all on function app_private.reconcile_loyalty_after_attendance()
  from public, anon, authenticated;

create trigger attendance_reconcile_loyalty
after insert or update or delete
on public.attendance
for each row execute function app_private.reconcile_loyalty_after_attendance();

-- Preserve at least one administrator after bootstrap. Authorization continues
-- to come exclusively from public.user_roles.
create or replace function app_private.guard_user_role_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not app_private.is_admin() then
    raise exception using errcode = '42501', message = 'Only an administrator may change user roles';
  end if;

  if tg_op in ('UPDATE', 'DELETE') and old.role = 'admin'
    and (tg_op = 'DELETE' or new.role <> 'admin')
    and (select count(*) from public.user_roles where role = 'admin') <= 1
  then
    raise exception using errcode = '23514', message = 'The final administrator cannot be removed';
  end if;

  if tg_op <> 'DELETE' and (select auth.uid()) is not null then
    new.assigned_by := (select auth.uid());
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- ============================================
-- ADMIN AUDIT LOG
-- ============================================
-- Append-only audit records are written by triggers, never directly by clients.
create function app_private.audit_admin_change()
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

revoke all on function app_private.audit_admin_change()
  from public, anon, authenticated;

create trigger user_roles_audit after insert or update or delete on public.user_roles
for each row execute function app_private.audit_admin_change();
create trigger meetups_audit after insert or update or delete on public.meetups
for each row execute function app_private.audit_admin_change();
create trigger attendance_audit after insert or update or delete on public.attendance
for each row execute function app_private.audit_admin_change();
create trigger loyalty_rewards_audit after insert or update or delete on public.loyalty_rewards
for each row execute function app_private.audit_admin_change();
create trigger special_rewards_audit after insert or update or delete on public.special_rewards
for each row execute function app_private.audit_admin_change();

-- Verified Auth email is exposed only through an admin-checked RPC. No member
-- can enumerate auth.users and no provider secrets or token fields are returned.
create function public.admin_member_directory()
returns table (
  user_id uuid,
  email text,
  email_verified boolean,
  joined_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not app_private.is_admin() then
    raise exception using errcode = '42501', message = 'Administrator access required';
  end if;
  return query
  select u.id, u.email::text, u.email_confirmed_at is not null, u.created_at, u.last_sign_in_at
  from auth.users u
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_member_directory()
  from public, anon, authenticated;
grant execute on function public.admin_member_directory() to authenticated;

alter table public.attendance_admin_notes enable row level security;
alter table public.special_rewards enable row level security;
alter table public.special_reward_admin_notes enable row level security;
alter table public.admin_audit_log enable row level security;

create policy attendance_admin_notes_admin_all on public.attendance_admin_notes
for all to authenticated using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy special_rewards_read_member_or_admin on public.special_rewards
for select to authenticated using (
  user_id = (select auth.uid()) or (select app_private.is_admin())
);
create policy special_rewards_admin_insert on public.special_rewards
for insert to authenticated with check ((select app_private.is_admin()));
create policy special_rewards_admin_update on public.special_rewards
for update to authenticated using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));
create policy special_rewards_admin_delete on public.special_rewards
for delete to authenticated using ((select app_private.is_admin()));

create policy special_reward_admin_notes_admin_all on public.special_reward_admin_notes
for all to authenticated using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy admin_audit_log_admin_read on public.admin_audit_log
for select to authenticated using ((select app_private.is_admin()));

-- ============================================
-- SECURITY / ROW LEVEL SECURITY
-- ============================================
-- Equivalent combined policies avoid evaluating multiple permissive policies
-- for the member/admin split on dashboard reads.
drop policy profiles_read_own on public.profiles;
drop policy profiles_admin_read_all on public.profiles;
create policy profiles_read_member_or_admin on public.profiles
for select to authenticated using (id = (select auth.uid()) or (select app_private.is_admin()));

drop policy user_roles_read_own on public.user_roles;
drop policy user_roles_admin_read_all on public.user_roles;
create policy user_roles_read_member_or_admin on public.user_roles
for select to authenticated using (user_id = (select auth.uid()) or (select app_private.is_admin()));

drop policy meetups_member_read on public.meetups;
drop policy meetups_admin_read_all on public.meetups;
create policy meetups_member_or_admin_read on public.meetups
for select to authenticated using (
  status in ('published', 'cancelled', 'completed') or (select app_private.is_admin())
);

drop policy meetup_bookings_read_own on public.meetup_bookings;
drop policy meetup_bookings_admin_read_all on public.meetup_bookings;
create policy meetup_bookings_read_member_or_admin on public.meetup_bookings
for select to authenticated using (user_id = (select auth.uid()) or (select app_private.is_admin()));
drop policy meetup_bookings_cancel_own on public.meetup_bookings;
drop policy meetup_bookings_admin_update on public.meetup_bookings;
create policy meetup_bookings_update_member_or_admin on public.meetup_bookings
for update to authenticated
using (user_id = (select auth.uid()) or (select app_private.is_admin()))
with check (user_id = (select auth.uid()) or (select app_private.is_admin()));

drop policy attendance_read_own on public.attendance;
drop policy attendance_admin_read_all on public.attendance;
create policy attendance_read_member_or_admin on public.attendance
for select to authenticated using (user_id = (select auth.uid()) or (select app_private.is_admin()));

drop policy loyalty_rewards_read_own on public.loyalty_rewards;
drop policy loyalty_rewards_admin_read_all on public.loyalty_rewards;
create policy loyalty_rewards_read_member_or_admin on public.loyalty_rewards
for select to authenticated using (user_id = (select auth.uid()) or (select app_private.is_admin()));

drop policy question_progress_read_own on public.question_progress;
create policy question_progress_read_member_or_admin on public.question_progress
for select to authenticated using (user_id = (select auth.uid()) or (select app_private.is_admin()));
drop policy question_favorites_read_own on public.question_favorites;
create policy question_favorites_read_member_or_admin on public.question_favorites
for select to authenticated using (user_id = (select auth.uid()) or (select app_private.is_admin()));

revoke all on table public.attendance_admin_notes from anon, authenticated;
revoke all on table public.special_rewards from anon, authenticated;
revoke all on table public.special_reward_admin_notes from anon, authenticated;
revoke all on table public.admin_audit_log from anon, authenticated;

grant select, insert, update, delete on table public.attendance_admin_notes to authenticated;
grant select, insert, update, delete on table public.special_rewards to authenticated;
grant select, insert, update, delete on table public.special_reward_admin_notes to authenticated;
grant select on table public.admin_audit_log to authenticated;

-- Remove the legacy notes column from all browser reads. Admin notes are now in
-- an admin-only table; members retain access to their safe attendance history.
revoke select on table public.attendance from authenticated;
grant select (
  id, meetup_id, user_id, booking_id, status, recorded_by, recorded_at,
  is_paid, paid_amount_minor, paid_currency, payment_recorded_at,
  created_at, updated_at
) on table public.attendance to authenticated;

comment on table public.attendance_admin_notes is 'Private administrator notes for attendance records.';
comment on table public.special_rewards is 'Non-cash surprise rewards visible to the owning member.';
comment on table public.special_reward_admin_notes is 'Private administrator notes for special rewards.';
comment on table public.admin_audit_log is 'Append-only audit trail written by protected database triggers.';

commit;
