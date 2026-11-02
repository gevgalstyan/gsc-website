-- REVIEW ONLY. Not an automatic migration. Apply only with owner approval after backup/preflight.
-- Does NOT configure Supabase Auth. disable_signup=true is a separate required operation.
begin;
create table if not exists app_private.privacy_protection_control (
  singleton boolean primary key default true check(singleton),
  paused boolean not null default true
);
revoke all on app_private.privacy_protection_control from public,anon,authenticated;
insert into app_private.privacy_protection_control(singleton,paused) values(true,true)
on conflict(singleton) do update set paused=true;
create or replace function app_private.enforce_booking_privacy_pause()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if not coalesce((select paused from app_private.privacy_protection_control where singleton),true)
     or app_private.is_admin() then return new; end if;
  if tg_op='UPDATE' then
    if new.user_id=auth.uid() and old.user_id=auth.uid()
       and old.status='confirmed' and new.status='cancelled'
       and (to_jsonb(new)-array['status','cancelled_at','updated_at']) =
           (to_jsonb(old)-array['status','cancelled_at','updated_at'])
    then return new; end if;
  end if;
  raise exception 'New bookings are temporarily paused' using errcode='42501';
end;
$$;
revoke all on function app_private.enforce_booking_privacy_pause() from public,anon,authenticated;
drop trigger if exists enforce_booking_privacy_pause on public.meetup_bookings;
create trigger enforce_booking_privacy_pause before insert or update on public.meetup_bookings
for each row execute function app_private.enforce_booking_privacy_pause();
commit;
-- Never disable RLS. Existing RLS still controls ownership and cancellation.
-- Reopening requires a separate approved UPDATE of the singleton plus Auth/UI rollout.
