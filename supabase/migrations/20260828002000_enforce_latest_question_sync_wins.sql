-- ============================================
-- QUESTIONS — CONFLICT-SAFE MULTI-DEVICE MERGE
-- Risk: CRITICAL — prevents stale queued device writes from overwriting newer state.
-- ============================================

begin;

create or replace function app_private.keep_latest_question_progress_view()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.last_viewed_at := greatest(old.last_viewed_at, new.last_viewed_at);
  return new;
end;
$$;

create or replace function app_private.keep_latest_question_favorite_toggle()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.favorite_updated_at < old.favorite_updated_at then
    return old;
  end if;
  return new;
end;
$$;

create or replace function app_private.keep_latest_question_deck_state()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

drop trigger if exists question_progress_keep_latest_view on public.question_progress;
create trigger question_progress_keep_latest_view
before update on public.question_progress
for each row execute function app_private.keep_latest_question_progress_view();

drop trigger if exists question_favorites_keep_latest_toggle on public.question_favorites;
create trigger question_favorites_keep_latest_toggle
before update on public.question_favorites
for each row execute function app_private.keep_latest_question_favorite_toggle();

drop trigger if exists question_deck_state_keep_latest_state on public.question_deck_state;
create trigger question_deck_state_keep_latest_state
before update on public.question_deck_state
for each row execute function app_private.keep_latest_question_deck_state();

comment on function app_private.keep_latest_question_progress_view() is
  'Keeps question_progress.last_viewed_at monotonic during multi-device upserts.';
comment on function app_private.keep_latest_question_favorite_toggle() is
  'Prevents stale queued favorite toggles from overwriting newer member favorite state.';
comment on function app_private.keep_latest_question_deck_state() is
  'Prevents stale queued continuation state from overwriting newer member deck state.';

commit;
