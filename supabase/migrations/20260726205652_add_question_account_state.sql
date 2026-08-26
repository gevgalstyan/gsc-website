-- ============================================
-- QUESTIONS — MEMBER PROGRESS, FAVORITES, AND REALTIME
-- Risk: CRITICAL — creates member-owned tables and RLS policies.
-- ============================================

begin;

create table public.question_progress (
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  question_id text not null,
  explored_at timestamptz not null default now(),
  primary key (user_id, question_id),
  constraint question_progress_question_id_length
    check (char_length(question_id) between 1 and 100)
);

create table public.question_favorites (
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  question_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id),
  constraint question_favorites_question_id_length
    check (char_length(question_id) between 1 and 100)
);

alter table public.question_progress enable row level security;
alter table public.question_favorites enable row level security;

create policy question_progress_read_own
on public.question_progress for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

create policy question_progress_insert_own
on public.question_progress for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

create policy question_progress_delete_own
on public.question_progress for delete
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

create policy question_favorites_read_own
on public.question_favorites for select
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

create policy question_favorites_insert_own
on public.question_favorites for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

create policy question_favorites_delete_own
on public.question_favorites for delete
to authenticated
using (
  (select auth.uid()) is not null
  and user_id = (select auth.uid())
);

revoke all on table public.question_progress from anon, authenticated;
revoke all on table public.question_favorites from anon, authenticated;

grant select, delete on table public.question_progress to authenticated;
grant insert (question_id) on table public.question_progress to authenticated;
grant select, delete on table public.question_favorites to authenticated;
grant insert (question_id) on table public.question_favorites to authenticated;

-- ============================================
-- QUESTIONS — PRIVATE REALTIME INVALIDATION
-- ============================================
-- Broadcast invalidation only. Clients refetch canonical rows instead of
-- trusting event payloads, and each private topic is tied to auth.uid().
create policy question_state_receive_own_broadcasts
on realtime.messages for select
to authenticated
using (
  extension = 'broadcast'
  and (select realtime.topic()) =
    'question-state:' || (select auth.uid())::text
);

create function app_private.broadcast_question_state_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
begin
  owner_id := coalesce(new.user_id, old.user_id);

  perform realtime.send(
    jsonb_build_object('changed', true),
    'question_state_changed',
    'question-state:' || owner_id::text,
    true
  );

  return null;
end;
$$;

revoke all on function app_private.broadcast_question_state_change()
  from public, anon, authenticated;

create trigger question_progress_broadcast_change
after insert or delete on public.question_progress
for each row execute function app_private.broadcast_question_state_change();

create trigger question_favorites_broadcast_change
after insert or delete on public.question_favorites
for each row execute function app_private.broadcast_question_state_change();

commit;
