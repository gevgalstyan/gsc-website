-- ============================================
-- QUESTIONS — CROSS-DEVICE ACCOUNT STATE
-- Risk: CRITICAL — extends member-owned question state and RLS policies.
-- ============================================

begin;

-- Keep explored progress monotonic while allowing devices to update the latest
-- time a question was viewed. The primary key still prevents duplicate progress.
alter table public.question_progress
  add column if not exists last_viewed_at timestamptz;

update public.question_progress
set last_viewed_at = explored_at
where last_viewed_at is null;

alter table public.question_progress
  alter column last_viewed_at set default now(),
  alter column last_viewed_at set not null;

-- Favorites are now a conflict-safe state row instead of relying only on
-- insert/delete presence. This lets the latest deliberate toggle win.
alter table public.question_favorites
  add column if not exists is_favorite boolean,
  add column if not exists favorite_updated_at timestamptz;

update public.question_favorites
set
  is_favorite = coalesce(is_favorite, true),
  favorite_updated_at = coalesce(favorite_updated_at, created_at)
where is_favorite is null or favorite_updated_at is null;

alter table public.question_favorites
  alter column is_favorite set default true,
  alter column is_favorite set not null,
  alter column favorite_updated_at set default now(),
  alter column favorite_updated_at set not null;

create index if not exists question_progress_user_last_viewed_idx
  on public.question_progress (user_id, last_viewed_at desc);

create index if not exists question_favorites_active_user_idx
  on public.question_favorites (user_id, favorite_updated_at desc)
  where is_favorite;

create table if not exists public.question_deck_state (
  user_id uuid primary key default auth.uid()
    references auth.users (id) on delete cascade,
  current_question_id text,
  category_filter text not null default 'all',
  difficulty_filter text not null default 'all',
  favorites_only boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint question_deck_state_question_id_length
    check (current_question_id is null or char_length(current_question_id) between 1 and 100),
  constraint question_deck_state_category_length
    check (char_length(category_filter) between 1 and 120),
  constraint question_deck_state_difficulty_length
    check (char_length(difficulty_filter) between 1 and 40)
);

alter table public.question_deck_state enable row level security;

drop policy if exists question_progress_update_own on public.question_progress;
create policy question_progress_update_own
on public.question_progress for update
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
)
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

drop policy if exists question_favorites_update_own on public.question_favorites;
create policy question_favorites_update_own
on public.question_favorites for update
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
)
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

drop policy if exists question_deck_state_read_member_or_admin on public.question_deck_state;
create policy question_deck_state_read_member_or_admin
on public.question_deck_state for select
to authenticated
using (user_id = (select auth.uid()) or (select app_private.is_admin()));

drop policy if exists question_deck_state_insert_own on public.question_deck_state;
create policy question_deck_state_insert_own
on public.question_deck_state for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

drop policy if exists question_deck_state_update_own on public.question_deck_state;
create policy question_deck_state_update_own
on public.question_deck_state for update
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
)
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

drop policy if exists question_deck_state_delete_own on public.question_deck_state;
create policy question_deck_state_delete_own
on public.question_deck_state for delete
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

revoke all on table public.question_deck_state from anon, authenticated;
grant select, delete on table public.question_deck_state to authenticated;
grant insert (current_question_id, category_filter, difficulty_filter, favorites_only, updated_at)
  on table public.question_deck_state to authenticated;
grant update (current_question_id, category_filter, difficulty_filter, favorites_only, updated_at)
  on table public.question_deck_state to authenticated;

grant update (last_viewed_at) on table public.question_progress to authenticated;
grant insert (question_id, last_viewed_at) on table public.question_progress to authenticated;
grant update (is_favorite, favorite_updated_at) on table public.question_favorites to authenticated;
grant insert (question_id, is_favorite, favorite_updated_at) on table public.question_favorites to authenticated;

drop trigger if exists question_progress_broadcast_change on public.question_progress;
create trigger question_progress_broadcast_change
after insert or update or delete on public.question_progress
for each row execute function app_private.broadcast_question_state_change();

drop trigger if exists question_favorites_broadcast_change on public.question_favorites;
create trigger question_favorites_broadcast_change
after insert or update or delete on public.question_favorites
for each row execute function app_private.broadcast_question_state_change();

drop trigger if exists question_deck_state_broadcast_change on public.question_deck_state;
create trigger question_deck_state_broadcast_change
after insert or update or delete on public.question_deck_state
for each row execute function app_private.broadcast_question_state_change();

comment on table public.question_deck_state is
  'Latest member question-deck continuation state for cross-device resume.';
comment on column public.question_progress.last_viewed_at is
  'Latest account-backed view time for this question; explored_at remains the first exploration time.';
comment on column public.question_favorites.is_favorite is
  'Latest favorite toggle state. False rows preserve conflict ordering across devices.';
comment on column public.question_favorites.favorite_updated_at is
  'Client action time used to resolve favorite toggle conflicts.';

commit;
