begin;

-- Internal helpers are intentionally kept outside the exposed public schema.
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  telegram_username text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length
    check (display_name is null or char_length(display_name) between 1 and 80),
  constraint profiles_avatar_url_length
    check (avatar_url is null or char_length(avatar_url) <= 2048),
  constraint profiles_telegram_username_format
    check (
      telegram_username is null
      or telegram_username ~ '^[A-Za-z0-9_]{5,32}$'
    )
);

create table public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'member',
  assigned_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_roles_role_allowed check (role in ('member', 'admin'))
);

create table public.meetups (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Moscow',
  location_name text not null,
  address text,
  capacity smallint not null,
  price_minor integer not null default 0,
  currency text not null default 'RUB',
  status text not null default 'draft',
  is_public boolean not null default false,
  booking_opens_at timestamptz,
  booking_closes_at timestamptz,
  confirmed_booking_count smallint not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetups_title_length
    check (char_length(btrim(title)) between 1 and 160),
  constraint meetups_description_length
    check (char_length(description) <= 5000),
  constraint meetups_location_name_length
    check (char_length(btrim(location_name)) between 1 and 240),
  constraint meetups_address_length
    check (address is null or char_length(address) <= 500),
  constraint meetups_timezone_length
    check (char_length(btrim(timezone)) between 1 and 100),
  constraint meetups_capacity_range check (capacity between 1 and 100),
  constraint meetups_price_nonnegative check (price_minor >= 0),
  constraint meetups_currency_format check (currency ~ '^[A-Z]{3}$'),
  constraint meetups_status_allowed
    check (status in ('draft', 'published', 'cancelled', 'completed')),
  constraint meetups_drafts_are_private
    check (status <> 'draft' or is_public = false),
  constraint meetups_confirmed_booking_count_valid
    check (
      confirmed_booking_count >= 0
      and confirmed_booking_count <= capacity
    ),
  constraint meetups_time_order check (ends_at > starts_at),
  constraint meetups_booking_window_order
    check (
      booking_opens_at is null
      or booking_closes_at is null
      or booking_opens_at < booking_closes_at
    ),
  constraint meetups_booking_closes_before_start
    check (booking_closes_at is null or booking_closes_at <= starts_at)
);

create table public.meetup_bookings (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups (id) on delete restrict,
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  status text not null default 'confirmed',
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meetup_bookings_status_allowed
    check (status in ('confirmed', 'cancelled')),
  constraint meetup_bookings_cancellation_consistent
    check (
      (status = 'confirmed' and cancelled_at is null)
      or (status = 'cancelled' and cancelled_at is not null)
    ),
  constraint meetup_bookings_id_user_unique unique (id, user_id),
  constraint meetup_bookings_id_user_meetup_unique
    unique (id, user_id, meetup_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  meetup_id uuid not null references public.meetups (id) on delete restrict,
  user_id uuid not null references auth.users (id) on delete cascade,
  booking_id uuid,
  status text not null default 'attended',
  notes text,
  recorded_by uuid references auth.users (id) on delete set null,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint attendance_status_allowed
    check (status in ('attended', 'no_show', 'excused')),
  constraint attendance_notes_length
    check (notes is null or char_length(notes) <= 2000),
  constraint attendance_meetup_user_unique unique (meetup_id, user_id),
  constraint attendance_booking_unique unique (booking_id),
  constraint attendance_id_user_unique unique (id, user_id),
  constraint attendance_booking_matches_member_and_meetup
    foreign key (booking_id, user_id, meetup_id)
    references public.meetup_bookings (id, user_id, meetup_id)
    on delete restrict
);

create table public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_type text not null default 'free_meetup',
  status text not null default 'available',
  earned_after_attendance_id uuid not null,
  redeemed_booking_id uuid,
  required_attendance_count smallint not null default 6,
  earned_at timestamptz not null default now(),
  redeemed_at timestamptz,
  expires_at timestamptz,
  issued_by uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint loyalty_rewards_type_allowed
    check (reward_type in ('free_meetup')),
  constraint loyalty_rewards_required_attendance_count
    check (required_attendance_count = 6),
  constraint loyalty_rewards_status_allowed
    check (status in ('available', 'redeemed', 'revoked', 'expired')),
  constraint loyalty_rewards_redemption_consistent
    check (
      (
        status = 'redeemed'
        and redeemed_booking_id is not null
        and redeemed_at is not null
      )
      or (
        status <> 'redeemed'
        and redeemed_booking_id is null
        and redeemed_at is null
      )
    ),
  constraint loyalty_rewards_expiry_order
    check (expires_at is null or expires_at > earned_at),
  constraint loyalty_rewards_notes_length
    check (notes is null or char_length(notes) <= 2000),
  constraint loyalty_rewards_earning_unique unique (earned_after_attendance_id),
  constraint loyalty_rewards_redemption_unique unique (redeemed_booking_id),
  constraint loyalty_rewards_attendance_matches_member
    foreign key (earned_after_attendance_id, user_id)
    references public.attendance (id, user_id)
    on delete restrict,
  constraint loyalty_rewards_booking_matches_member
    foreign key (redeemed_booking_id, user_id)
    references public.meetup_bookings (id, user_id)
    on delete restrict
);

-- Foreign-key and common-filter indexes.
create index user_roles_admin_idx
  on public.user_roles (user_id)
  where role = 'admin';

create index user_roles_assigned_by_idx
  on public.user_roles (assigned_by);

create index meetups_status_starts_at_idx
  on public.meetups (status, starts_at);
create index meetups_created_by_idx on public.meetups (created_by);
create index meetups_updated_by_idx on public.meetups (updated_by);

create unique index meetup_bookings_one_confirmed_per_member_idx
  on public.meetup_bookings (meetup_id, user_id)
  where status = 'confirmed';
create index meetup_bookings_user_status_idx
  on public.meetup_bookings (user_id, status, booked_at desc);
create index meetup_bookings_meetup_status_idx
  on public.meetup_bookings (meetup_id, status);

create index attendance_user_status_idx
  on public.attendance (user_id, status, recorded_at desc);
create index attendance_meetup_status_idx
  on public.attendance (meetup_id, status);
create index attendance_recorded_by_idx on public.attendance (recorded_by);

create index loyalty_rewards_user_status_idx
  on public.loyalty_rewards (user_id, status, earned_at desc);
create index loyalty_rewards_issued_by_idx
  on public.loyalty_rewards (issued_by);

-- Generic timestamp maintenance.
create function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function app_private.set_updated_at()
  from public, anon, authenticated;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function app_private.set_updated_at();

create trigger user_roles_set_updated_at
before update on public.user_roles
for each row execute function app_private.set_updated_at();

create trigger meetups_set_updated_at
before update on public.meetups
for each row execute function app_private.set_updated_at();

create trigger meetup_bookings_set_updated_at
before update on public.meetup_bookings
for each row execute function app_private.set_updated_at();

create trigger attendance_set_updated_at
before update on public.attendance
for each row execute function app_private.set_updated_at();

create trigger loyalty_rewards_set_updated_at
before update on public.loyalty_rewards
for each row execute function app_private.set_updated_at();

-- Authorization reads protected role data, never user-editable metadata.
create function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
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

-- Every new auth user receives a profile and the non-privileged member role.
create function app_private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  metadata_name text;
  metadata_avatar text;
begin
  metadata_name := nullif(
    btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')),
    ''
  );
  metadata_avatar := nullif(btrim(new.raw_user_meta_data ->> 'avatar_url'), '');

  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    case when metadata_name is null then null else left(metadata_name, 80) end,
    case when metadata_avatar is null then null else left(metadata_avatar, 2048) end
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'member')
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke all on function app_private.handle_new_auth_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function app_private.handle_new_auth_user();

-- Backfill identities that existed before this migration. Email is deliberately
-- not required: auth.users.id remains the identity source for every provider,
-- including Telegram OIDC.
insert into public.profiles (id, display_name, avatar_url)
select
  auth_user.id,
  case
    when nullif(
      btrim(
        coalesce(
          auth_user.raw_user_meta_data ->> 'full_name',
          auth_user.raw_user_meta_data ->> 'name'
        )
      ),
      ''
    ) is null then null
    else left(
      nullif(
        btrim(
          coalesce(
            auth_user.raw_user_meta_data ->> 'full_name',
            auth_user.raw_user_meta_data ->> 'name'
          )
        ),
        ''
      ),
      80
    )
  end,
  case
    when nullif(btrim(auth_user.raw_user_meta_data ->> 'avatar_url'), '') is null
      then null
    else left(
      nullif(btrim(auth_user.raw_user_meta_data ->> 'avatar_url'), ''),
      2048
    )
  end
from auth.users as auth_user
on conflict (id) do nothing;

insert into public.user_roles (user_id, role)
select id, 'member'
from auth.users
on conflict (user_id) do nothing;

-- Defense in depth: authenticated role changes require an existing admin.
create function app_private.guard_user_role_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not app_private.is_admin() then
    raise exception using
      errcode = '42501',
      message = 'Only an administrator may change user roles';
  end if;

  if tg_op <> 'DELETE' and (select auth.uid()) is not null then
    new.assigned_by := (select auth.uid());
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function app_private.guard_user_role_changes()
  from public, anon, authenticated;

create trigger user_roles_guard_changes
before insert or update or delete on public.user_roles
for each row execute function app_private.guard_user_role_changes();

-- Members may only turn their own confirmed booking into a cancellation.
create function app_private.guard_booking_updates()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function app_private.guard_booking_updates()
  from public, anon, authenticated;

create trigger meetup_bookings_10_guard_updates
before update on public.meetup_bookings
for each row execute function app_private.guard_booking_updates();

-- Maintain a database-enforced confirmed-booking counter. This runs after the
-- booking row and its unique constraint are settled, then atomically updates the
-- meetup. That lock order avoids cancellation/rebooking deadlocks while the
-- meetup check constraint prevents capacity reductions below the confirmed count.
create function app_private.sync_booking_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
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
$$;

revoke all on function app_private.sync_booking_capacity()
  from public, anon, authenticated;

create trigger meetup_bookings_20_sync_capacity
after insert or update of status, meetup_id or delete
on public.meetup_bookings
for each row execute function app_private.sync_booking_capacity();

-- RLS is mandatory on every public table.
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.meetups enable row level security;
alter table public.meetup_bookings enable row level security;
alter table public.attendance enable row level security;
alter table public.loyalty_rewards enable row level security;

create policy profiles_read_own
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy profiles_admin_read_all
on public.profiles for select
to authenticated
using ((select app_private.is_admin()));

create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy user_roles_read_own
on public.user_roles for select
to authenticated
using (user_id = (select auth.uid()));

create policy user_roles_admin_read_all
on public.user_roles for select
to authenticated
using ((select app_private.is_admin()));

create policy user_roles_admin_insert
on public.user_roles for insert
to authenticated
with check ((select app_private.is_admin()));

create policy user_roles_admin_update
on public.user_roles for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy user_roles_admin_delete
on public.user_roles for delete
to authenticated
using ((select app_private.is_admin()));

create policy meetups_anonymous_read
on public.meetups for select
to anon
using (
  is_public = true
  and status in ('published', 'cancelled', 'completed')
);

create policy meetups_member_read
on public.meetups for select
to authenticated
using (status in ('published', 'cancelled', 'completed'));

create policy meetups_admin_read_all
on public.meetups for select
to authenticated
using ((select app_private.is_admin()));

create policy meetups_admin_insert
on public.meetups for insert
to authenticated
with check ((select app_private.is_admin()));

create policy meetups_admin_update
on public.meetups for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy meetups_admin_delete
on public.meetups for delete
to authenticated
using ((select app_private.is_admin()));

create policy meetup_bookings_read_own
on public.meetup_bookings for select
to authenticated
using (user_id = (select auth.uid()));

create policy meetup_bookings_admin_read_all
on public.meetup_bookings for select
to authenticated
using ((select app_private.is_admin()));

create policy meetup_bookings_create_own
on public.meetup_bookings for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'confirmed'
);

create policy meetup_bookings_cancel_own
on public.meetup_bookings for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy meetup_bookings_admin_update
on public.meetup_bookings for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy meetup_bookings_admin_delete
on public.meetup_bookings for delete
to authenticated
using ((select app_private.is_admin()));

create policy attendance_read_own
on public.attendance for select
to authenticated
using (user_id = (select auth.uid()));

create policy attendance_admin_read_all
on public.attendance for select
to authenticated
using ((select app_private.is_admin()));

create policy attendance_admin_insert
on public.attendance for insert
to authenticated
with check ((select app_private.is_admin()));

create policy attendance_admin_update
on public.attendance for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy attendance_admin_delete
on public.attendance for delete
to authenticated
using ((select app_private.is_admin()));

create policy loyalty_rewards_read_own
on public.loyalty_rewards for select
to authenticated
using (user_id = (select auth.uid()));

create policy loyalty_rewards_admin_read_all
on public.loyalty_rewards for select
to authenticated
using ((select app_private.is_admin()));

create policy loyalty_rewards_admin_insert
on public.loyalty_rewards for insert
to authenticated
with check ((select app_private.is_admin()));

create policy loyalty_rewards_admin_update
on public.loyalty_rewards for update
to authenticated
using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));

create policy loyalty_rewards_admin_delete
on public.loyalty_rewards for delete
to authenticated
using ((select app_private.is_admin()));

-- Explicit grants complement RLS and keep the browser client least-privileged.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.user_roles from anon, authenticated;
revoke all on table public.meetups from anon, authenticated;
revoke all on table public.meetup_bookings from anon, authenticated;
revoke all on table public.attendance from anon, authenticated;
revoke all on table public.loyalty_rewards from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url, telegram_username)
  on table public.profiles to authenticated;

grant select on table public.user_roles to authenticated;
grant insert (user_id, role) on table public.user_roles to authenticated;
grant update (role) on table public.user_roles to authenticated;
grant delete on table public.user_roles to authenticated;

grant select on table public.meetups to anon, authenticated;
grant insert (
  title,
  description,
  starts_at,
  ends_at,
  timezone,
  location_name,
  address,
  capacity,
  price_minor,
  currency,
  status,
  is_public,
  booking_opens_at,
  booking_closes_at,
  created_by,
  updated_by
) on table public.meetups to authenticated;
grant update (
  title,
  description,
  starts_at,
  ends_at,
  timezone,
  location_name,
  address,
  capacity,
  price_minor,
  currency,
  status,
  is_public,
  booking_opens_at,
  booking_closes_at,
  updated_by
) on table public.meetups to authenticated;
grant delete on table public.meetups to authenticated;

grant select, delete on table public.meetup_bookings to authenticated;
grant insert (meetup_id) on table public.meetup_bookings to authenticated;
grant update (status) on table public.meetup_bookings to authenticated;

grant select, insert, update, delete
  on table public.attendance to authenticated;

grant select, insert, update, delete
  on table public.loyalty_rewards to authenticated;

comment on table public.profiles is
  'Member-facing profile data. Authorization must never depend on these fields.';
comment on table public.user_roles is
  'Protected authorization source for member/admin roles.';
comment on table public.meetups is
  'Scheduled speaking-club meetups and booking capacity.';
comment on table public.meetup_bookings is
  'Auditable member bookings; cancellation preserves booking history.';
comment on table public.attendance is
  'Admin-recorded meetup attendance used as the loyalty source of truth.';
comment on table public.loyalty_rewards is
  'Admin-issued reward ledger derived from qualifying attendance.';

commit;
