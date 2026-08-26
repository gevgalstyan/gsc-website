-- ============================================
-- FAQ CONTENT — INDEPENDENT DRAFT ORDERING
-- Risk: CRITICAL — changes schema and publishing RPC behavior.
-- ============================================

begin;

alter table public.site_faq_items
  add column if not exists draft_sort_order integer,
  add column if not exists published_sort_order integer;

update public.site_faq_items
set draft_sort_order = coalesce(draft_sort_order, sort_order),
    published_sort_order = coalesce(published_sort_order, sort_order)
where draft_sort_order is null or published_sort_order is null;

alter table public.site_faq_items
  alter column draft_sort_order set default 0,
  alter column draft_sort_order set not null,
  alter column published_sort_order set default 0,
  alter column published_sort_order set not null;

drop index if exists public.site_faq_public_order_idx;
create index site_faq_public_order_idx
  on public.site_faq_items (published_is_enabled, published_sort_order);

create or replace function public.publish_site_page(p_page_slug text)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  previous_snapshot jsonb;
begin
  if not (select app_private.is_admin()) then raise exception 'Administrator access required'; end if;
  select jsonb_build_object(
    'content', coalesce((select jsonb_agg(jsonb_build_object('key', c.key, 'value', coalesce(c.published_value, c.value), 'is_enabled', c.published_is_enabled) order by c.sort_order, c.key) from public.site_content c where c.page_slug = p_page_slug), '[]'::jsonb),
    'faq', case when p_page_slug = 'faq' then coalesce((select jsonb_agg(jsonb_build_object('id', f.id, 'question', f.published_question, 'answer', f.published_answer, 'is_enabled', f.published_is_enabled, 'sort_order', f.published_sort_order) order by f.published_sort_order, f.id) from public.site_faq_items f), '[]'::jsonb) else '[]'::jsonb end
  ) into previous_snapshot;
  insert into public.site_content_revisions (page_slug, action, snapshot, changed_by) values (p_page_slug, 'publish', previous_snapshot, (select auth.uid()));
  update public.site_content set published_value = coalesce(draft_value, value), value = coalesce(draft_value, value), published_is_enabled = is_enabled, published_by = (select auth.uid()), published_at = now() where page_slug = p_page_slug;
  if p_page_slug = 'faq' then
    update public.site_faq_items set published_question = draft_question, published_answer = draft_answer, published_is_enabled = is_enabled, published_sort_order = draft_sort_order, sort_order = draft_sort_order, published_by = (select auth.uid()), published_at = now();
  end if;
end;
$$;

create or replace function public.discard_site_page_drafts(p_page_slug text)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if not (select app_private.is_admin()) then raise exception 'Administrator access required'; end if;
  update public.site_content set draft_value = coalesce(published_value, value), is_enabled = published_is_enabled, updated_by = (select auth.uid()), updated_at = now() where page_slug = p_page_slug;
  if p_page_slug = 'faq' then
    update public.site_faq_items set draft_question = published_question, draft_answer = published_answer, is_enabled = published_is_enabled, draft_sort_order = published_sort_order, updated_by = (select auth.uid()), updated_at = now();
  end if;
end;
$$;

create or replace function public.restore_site_revision(p_revision_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare selected_revision public.site_content_revisions%rowtype;
begin
  if not (select app_private.is_admin()) then raise exception 'Administrator access required'; end if;
  select * into selected_revision from public.site_content_revisions where id = p_revision_id;
  if selected_revision.id is null then raise exception 'Revision not found'; end if;
  update public.site_content c set draft_value = restored.value, is_enabled = restored.is_enabled, updated_by = (select auth.uid()), updated_at = now()
  from (select item ->> 'key' as key, item ->> 'value' as value, coalesce((item ->> 'is_enabled')::boolean, true) as is_enabled from jsonb_array_elements(selected_revision.snapshot -> 'content') item) restored where c.key = restored.key;
  if selected_revision.page_slug = 'faq' then
    update public.site_faq_items f set draft_question = restored.question, draft_answer = restored.answer, is_enabled = restored.is_enabled, draft_sort_order = restored.sort_order, updated_by = (select auth.uid()), updated_at = now()
    from (select (item ->> 'id')::uuid as id, item ->> 'question' as question, item ->> 'answer' as answer, coalesce((item ->> 'is_enabled')::boolean, true) as is_enabled, coalesce((item ->> 'sort_order')::integer, 0) as sort_order from jsonb_array_elements(selected_revision.snapshot -> 'faq') item) restored where f.id = restored.id;
  end if;
  insert into public.site_content_revisions (page_slug, action, snapshot, changed_by) values (selected_revision.page_slug, 'restore', selected_revision.snapshot, (select auth.uid()));
end;
$$;

commit;
