-- Explicit final permission contract. No blanket ALL/TRUNCATE/TRIGGER grants.
revoke all on schema app_private from public,anon,authenticated;
grant usage on schema app_private to authenticated;
revoke create on schema public from public,anon,authenticated;
grant usage on schema public to anon,authenticated;
revoke all on all tables in schema public from public,anon,authenticated;
revoke all on all tables in schema app_private from public,anon,authenticated;
-- Revoke column grants too; a table-level REVOKE does not remove these.
do $$ declare t record; begin
 for t in select table_schema,table_name,string_agg(quote_ident(column_name),',') as cols
          from information_schema.columns where table_schema in ('public','app_private')
          group by table_schema,table_name loop
  execute format('revoke all privileges (%s) on %I.%I from public,anon,authenticated',t.cols,t.table_schema,t.table_name);
 end loop;
end $$;
revoke all on all functions in schema app_private from public,anon,authenticated;
grant execute on function app_private.is_admin(),app_private.is_verified_member() to authenticated;
revoke all on function public.admin_member_directory(),public.admin_publish_announcement(text,text,text),
 public.publish_site_page(text),public.discard_site_page_drafts(text),public.restore_site_revision(uuid)
 from public,anon,authenticated;
grant execute on function public.admin_member_directory(),public.admin_publish_announcement(text,text,text),
 public.publish_site_page(text),public.discard_site_page_drafts(text),public.restore_site_revision(uuid) to authenticated;

grant select on public.profiles,public.user_roles,public.meetup_bookings,public.attendance,
 public.loyalty_rewards,public.special_rewards,public.question_progress,public.question_favorites,
 public.question_deck_state,public.notifications,public.admin_audit_log to authenticated;
grant update(display_name,avatar_path,telegram_username,english_level,onboarding_completed,
 first_name,surname,age,nationality,gender) on public.profiles to authenticated;
-- Roles are assigned ONLY by the owner-run bootstrap; no client role mutations.
grant select on public.meetups,public.managed_questions to anon,authenticated;
grant insert(title,description,starts_at,ends_at,timezone,location_name,address,capacity,
 price_minor,currency,status,is_public,booking_opens_at,booking_closes_at,category,image_url),
 update(title,description,starts_at,ends_at,timezone,location_name,address,capacity,
 price_minor,currency,status,is_public,booking_opens_at,booking_closes_at,category,image_url),delete
 on public.meetups to authenticated;
grant insert(meetup_id),update(status) on public.meetup_bookings to authenticated;
grant insert,update,delete on public.attendance,public.special_rewards,public.managed_questions to authenticated;
grant select,insert,update,delete on public.attendance_admin_notes,public.special_reward_admin_notes to authenticated;
grant insert,update,delete on public.question_progress,public.question_favorites,public.question_deck_state to authenticated;
grant update(read_at) on public.notifications to authenticated;
grant select,insert,update,delete on public.site_content,public.site_faq_items,public.site_content_revisions,public.media_assets to authenticated;
grant select on public.site_content_public,public.site_faq_public to anon,authenticated;
-- These are Supabase-managed tables. Grant data operations only; policies scope buckets.
grant select,insert,update,delete on storage.objects to authenticated;
grant select on storage.objects to anon;
grant select on realtime.messages to authenticated;
