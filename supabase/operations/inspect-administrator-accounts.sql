-- READ ONLY. Run privately in the production Supabase SQL editor as project owner.
-- Review actual UUIDs, identities, and roles before considering any role change.
-- Do not paste result rows into public issues or pull requests.
with requested(email) as (values
  ('galstyanwork@gmail.com'), ('gevgalstyan913@gmail.com'), ('galstyanoff@gmail.com')
)
select r.email as requested_email, u.id as existing_user_id,
  u.email_confirmed_at is not null as email_verified,
  ur.role as existing_role, p.id is not null as has_profile,
  (select array_agg(distinct i.provider) from auth.identities i where i.user_id = u.id) as providers,
  (select count(*) from public.meetup_bookings b where b.user_id = u.id) as bookings,
  (select count(*) from public.attendance a where a.user_id = u.id) as attendance_records,
  (select count(*) from public.loyalty_rewards l where l.user_id = u.id) as loyalty_rewards
from requested r
left join auth.users u on lower(u.email) = r.email
left join public.user_roles ur on ur.user_id = u.id
left join public.profiles p on p.id = u.id
order by r.email, u.id;
