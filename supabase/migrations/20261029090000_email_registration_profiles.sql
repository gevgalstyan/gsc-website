-- REVIEW AND APPLY SEPARATELY: no production data/settings changes are performed by the website.
-- Preserve legacy profiles and roles. New personal fields remain nullable for legacy users.
begin;
alter table public.profiles
  add column first_name text check (first_name is null or char_length(btrim(first_name)) between 1 and 80),
  add column surname text check (surname is null or char_length(btrim(surname)) between 1 and 80),
  add column age integer check (age is null or age >= 0),
  add column age_recorded_at timestamptz,
  add column nationality text check (nationality is null or char_length(btrim(nationality)) between 1 and 100),
  add column gender text check (gender is null or gender in ('Male', 'Female', 'Prefer not to say')),
  add column email text,
  add column terms_accepted_at timestamptz,
  add column terms_version text;
comment on column public.profiles.age is 'Age snapshot at age_recorded_at; not a birth date. No eligibility/minimum-age restriction.';
comment on column public.profiles.email is 'Read-only mirror of auth.users.email, synchronized only by trusted triggers.';
update public.profiles p set email = u.email from auth.users u where p.id = u.id;

create or replace function app_private.handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  registration boolean := m ->> 'registration_version' = 'gsc-email-v1';
  name text := nullif(btrim(coalesce(m ->> 'full_name', m ->> 'name')), '');
  member_age integer;
begin
  if registration then
    if nullif(btrim(m ->> 'first_name'), '') is null or nullif(btrim(m ->> 'surname'), '') is null
      or char_length(btrim(m ->> 'first_name')) > 80 or char_length(btrim(m ->> 'surname')) > 80
      or coalesce(m ->> 'age', '') !~ '^[0-9]+$'
      or nullif(btrim(m ->> 'nationality'), '') is null
      or coalesce(m ->> 'gender', '') not in ('Male', 'Female', 'Prefer not to say')
      or m ->> 'terms_accepted' is distinct from 'true'
      or nullif(m ->> 'terms_version', '') is null then
      raise exception using errcode = '23514', message = 'Registration details are incomplete';
    end if;
    member_age := (m ->> 'age')::integer;
  end if;
  insert into public.profiles (id, display_name, avatar_url, onboarding_completed,
    first_name, surname, age, age_recorded_at, nationality, gender, email, terms_accepted_at, terms_version)
  values (new.id, left(name, 80), left(nullif(btrim(m ->> 'avatar_url'), ''), 2048), false,
    case when registration then btrim(m ->> 'first_name') end,
    case when registration then btrim(m ->> 'surname') end,
    member_age, case when registration then now() end,
    case when registration then btrim(m ->> 'nationality') end,
    case when registration then m ->> 'gender' end, new.email,
    case when registration then now() end, case when registration then m ->> 'terms_version' end)
  on conflict (id) do nothing;
  -- Never derive authorization from submitted email or user-editable metadata.
  -- Existing administrators are preserved; new role assignment is always member.
  insert into public.user_roles (user_id, role) values (new.id, 'member') on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function app_private.handle_new_auth_user() from public, anon, authenticated;

create function app_private.sync_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
revoke all on function app_private.sync_profile_email() from public, anon, authenticated;
create trigger sync_profile_email after update of email on auth.users
for each row when (old.email is distinct from new.email) execute function app_private.sync_profile_email();

create function app_private.stamp_profile_age()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.age is distinct from old.age then new.age_recorded_at := now(); end if;
  return new;
end;
$$;
revoke all on function app_private.stamp_profile_age() from public, anon, authenticated;
create trigger stamp_profile_age before update of age on public.profiles
for each row execute function app_private.stamp_profile_age();
-- Existing own-profile RLS remains in force. Email, terms records, IDs, and roles
-- are not part of this additive column-update grant.
grant update (first_name, surname, age, nationality, gender) on public.profiles to authenticated;

-- Require Auth's trusted email confirmation state. The owner MUST enable Confirm
-- email in Supabase (disabling it auto-confirms users). Never trust user metadata.
create function app_private.is_verified_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from auth.users where id = (select auth.uid()) and email_confirmed_at is not null);
$$;
revoke all on function app_private.is_verified_member() from public, anon, authenticated;
grant execute on function app_private.is_verified_member() to authenticated;

-- Retain the existing allowlist + protected-role admin rule, adding verification.
create or replace function app_private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select app_private.is_verified_member()
    and lower(coalesce((select auth.jwt() ->> 'email'), '')) in (
      'galstyanwork@gmail.com', 'galstyanoff@gmail.com', 'gevgalstyan913@gmail.com')
    and exists (select 1 from public.user_roles where user_id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function app_private.is_admin() from public, anon, authenticated;
grant execute on function app_private.is_admin() to authenticated;

do $$
declare member_table text;
begin
  foreach member_table in array array['profiles','user_roles','meetup_bookings','attendance','loyalty_rewards',
    'special_rewards','question_progress','question_favorites','question_deck_state','notifications','admin_audit_log'] loop
    execute format('create policy verified_member_required on public.%I as restrictive for all to authenticated using ((select app_private.is_verified_member())) with check ((select app_private.is_verified_member()))', member_table);
  end loop;
end;
$$;
-- Public content reads remain available. Existing admin write policies and RPCs
-- consult is_admin(), so they also require email verification.
create policy verified_avatar_read on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'profile-avatars' or (select app_private.is_verified_member()));
create policy verified_member_upload on storage.objects as restrictive for insert to authenticated
with check (bucket_id not in ('profile-avatars','site-media') or (select app_private.is_verified_member()));
create policy verified_member_storage_update on storage.objects as restrictive for update to authenticated
using (bucket_id not in ('profile-avatars','site-media') or (select app_private.is_verified_member()))
with check (bucket_id not in ('profile-avatars','site-media') or (select app_private.is_verified_member()));
create policy verified_member_storage_delete on storage.objects as restrictive for delete to authenticated
using (bucket_id not in ('profile-avatars','site-media') or (select app_private.is_verified_member()));
create policy verified_member_realtime_read on realtime.messages as restrictive for select to authenticated
using ((select app_private.is_verified_member()));
commit;
