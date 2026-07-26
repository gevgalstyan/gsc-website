-- Private, per-member profile photos. The public profile stores only a stable
-- object path; short-lived signed URLs are generated when the account loads.

alter table public.profiles
  add column avatar_path text;

alter table public.profiles
  add constraint profiles_avatar_path_owned_file
  check (
    avatar_path is null
    or avatar_path = id::text || '/avatar.webp'
  );

comment on column public.profiles.avatar_url is
  'Identity-provider avatar URL used only as a cosmetic fallback.';

comment on column public.profiles.avatar_path is
  'Stable private Storage object path for a member-uploaded avatar. Never store signed URLs here.';

-- Members can edit the stable path but can no longer replace the provider URL.
revoke update (avatar_url) on table public.profiles from authenticated;
grant update (display_name, telegram_username, avatar_path)
  on table public.profiles to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'profile-avatars',
  'profile-avatars',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- The exact object name prevents path traversal and prevents members from
-- accumulating unrelated files. Upsert requires SELECT, INSERT, and UPDATE.
create policy profile_avatars_select_own
on storage.objects for select
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name = (select auth.uid())::text || '/avatar.webp'
);

create policy profile_avatars_insert_own
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name = (select auth.uid())::text || '/avatar.webp'
);

create policy profile_avatars_update_own
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name = (select auth.uid())::text || '/avatar.webp'
)
with check (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name = (select auth.uid())::text || '/avatar.webp'
);

create policy profile_avatars_delete_own
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name = (select auth.uid())::text || '/avatar.webp'
);
