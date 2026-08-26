-- ============================================
-- SECURITY — RESTRICT OPTIONAL RLS EVENT HELPER
-- Risk: CRITICAL — controls who may invoke a security-definer helper.
-- ============================================

begin;

-- This SECURITY DEFINER function is an event-trigger implementation detail in
-- projects that install the optional ensure_rls event trigger. Production
-- projects without that helper should still be able to apply the migration.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    revoke execute on function public.rls_auto_enable() from public;
    revoke execute on function public.rls_auto_enable() from anon;
    revoke execute on function public.rls_auto_enable() from authenticated;

    comment on function public.rls_auto_enable() is
      'Internal ensure_rls event-trigger function. Direct execution is restricted from PUBLIC, anon, and authenticated; owner-level event-trigger execution is preserved.';
  end if;
end;
$$;

commit;
