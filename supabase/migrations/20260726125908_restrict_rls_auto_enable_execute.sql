begin;

-- This SECURITY DEFINER function is an event-trigger implementation detail.
-- It must not be callable directly through PostgREST RPC by application roles.
revoke execute on function public.rls_auto_enable() from public;
revoke execute on function public.rls_auto_enable() from anon;
revoke execute on function public.rls_auto_enable() from authenticated;

-- The postgres owner retains its inherent EXECUTE privilege, so the enabled
-- ensure_rls event trigger can continue enabling RLS on newly created tables.
comment on function public.rls_auto_enable() is
  'Internal ensure_rls event-trigger function. Direct execution is restricted from PUBLIC, anon, and authenticated; owner-level event-trigger execution is preserved.';

commit;
