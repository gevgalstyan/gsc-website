-- OPERATOR ONLY, after explicit Tatnet installation/account-creation approval.
-- Create the email/password user through Auth first, verify their mailbox and set
-- a password via the protected Auth flow. Never paste a password/hash here.
-- Replace ONLY the nil UUID below with the new user's UUID from Tatnet Studio.
-- This file creates no Auth account, does not change credentials, and is not an RPC.
begin;
do $bootstrap$
declare requested_id uuid := '00000000-0000-0000-0000-000000000000';
begin
 if requested_id='00000000-0000-0000-0000-000000000000'::uuid then raise exception 'Replace the placeholder UUID'; end if;
 if to_regclass('public.one_gsc_administrator') is null then raise exception 'Clean Tatnet installation marker missing'; end if;
 if not exists(select 1 from auth.users where id=requested_id
   and lower(email)='galstyanwork@gmail.com' and email_confirmed_at is not null
   and coalesce(encrypted_password,'')<>'') then
  raise exception 'Expected verified email/password account not found';
 end if;
 if not exists(select 1 from public.profiles where id=requested_id) then raise exception 'Profile trigger did not provision the account'; end if;
 if exists(select 1 from public.user_roles where role='admin' and user_id<>requested_id) then raise exception 'A different administrator already exists'; end if;
 update public.user_roles set role='admin' where user_id=requested_id;
 if not found then raise exception 'Member role missing; inspect provisioning'; end if;
 if (select count(*) from public.user_roles where role='admin')<>1 then raise exception 'Exactly one administrator required'; end if;
end $bootstrap$;
commit;
-- Verify using a fresh real sign-in and /admin/, not the SQL owner's privileges.
