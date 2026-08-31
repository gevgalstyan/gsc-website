-- Explicit first-login onboarding without changing the treatment of legacy members.
begin;

alter table public.profiles
  add column if not exists onboarding_completed boolean;

-- Accounts created before this change already had access to the member area.
-- Preserve that established behavior instead of unexpectedly forcing them through setup.
update public.profiles
set onboarding_completed = true
where onboarding_completed is null;

alter table public.profiles
  alter column onboarding_completed set default false,
  alter column onboarding_completed set not null;

grant update (onboarding_completed) on table public.profiles to authenticated;

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

  insert into public.profiles (id, display_name, avatar_url, onboarding_completed)
  values (
    new.id,
    case when metadata_name is null then null else left(metadata_name, 80) end,
    case when metadata_avatar is null then null else left(metadata_avatar, 2048) end,
    false
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, case when allowed_admin then 'admin' else 'member' end)
  on conflict (user_id) do update set role = excluded.role;

  return new;
end;
$$;

revoke all on function app_private.handle_new_auth_user() from public, anon, authenticated;

commit;
