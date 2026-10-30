-- NOT an automatic migration. Approval and inspection of existing accounts required.
-- Run inspect-administrator-accounts.sql first. Replace EACH placeholder with the
-- corresponding existing, verified auth.users UUID. Never create replacement users.
-- Run privately as the project owner in Supabase SQL Editor, without an end-user JWT.
-- Default ROLLBACK is a preview. Change it to COMMIT only after explicit approval.
begin;
do $$
declare
  account record;
  actual_email text;
  verified_at timestamptz;
begin
  if current_user not in ('postgres', 'supabase_admin') or auth.uid() is not null then
    raise exception 'Run as project owner without an end-user session';
  end if;
  for account in select * from (values
    ('REPLACE_WORK_UUID', 'galstyanwork@gmail.com'),
    ('REPLACE_GEV_UUID', 'gevgalstyan913@gmail.com'),
    ('REPLACE_OFF_UUID', 'galstyanoff@gmail.com')
  ) as reviewed(user_id, email) loop
    if account.user_id like 'REPLACE_%' then
      raise exception 'Inspect existing users and replace all reviewed UUID placeholders first';
    end if;
    select lower(email), email_confirmed_at into actual_email, verified_at
      from auth.users where id = account.user_id::uuid for update;
    if not found or actual_email is distinct from account.email or verified_at is null then
      raise exception 'Reviewed UUID must match the existing verified account; no accounts changed';
    end if;
    insert into public.user_roles(user_id, role)
      values (account.user_id::uuid, 'admin')
      on conflict (user_id) do update set role = 'admin'
      where public.user_roles.role <> 'admin';
  end loop;
end;
$$;
select u.id, u.email, r.role from auth.users u
join public.user_roles r on r.user_id = u.id
where lower(u.email) in ('galstyanwork@gmail.com', 'gevgalstyan913@gmail.com', 'galstyanoff@gmail.com');
rollback;
