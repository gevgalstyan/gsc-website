begin;

drop policy if exists site_content_admin_write on public.site_content;
create policy site_content_admin_insert on public.site_content
for insert to authenticated with check ((select app_private.is_admin()));
create policy site_content_admin_update on public.site_content
for update to authenticated using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));
create policy site_content_admin_delete on public.site_content
for delete to authenticated using ((select app_private.is_admin()));

drop policy if exists site_faq_admin_write on public.site_faq_items;
create policy site_faq_admin_insert on public.site_faq_items
for insert to authenticated with check ((select app_private.is_admin()));
create policy site_faq_admin_update on public.site_faq_items
for update to authenticated using ((select app_private.is_admin()))
with check ((select app_private.is_admin()));
create policy site_faq_admin_delete on public.site_faq_items
for delete to authenticated using ((select app_private.is_admin()));

create index if not exists site_content_updated_by_idx on public.site_content (updated_by);
create index if not exists site_content_published_by_idx on public.site_content (published_by);
create index if not exists site_faq_updated_by_idx on public.site_faq_items (updated_by);
create index if not exists site_faq_published_by_idx on public.site_faq_items (published_by);
create index if not exists site_revisions_changed_by_idx on public.site_content_revisions (changed_by);
create index if not exists media_assets_uploaded_by_idx on public.media_assets (uploaded_by);

commit;
