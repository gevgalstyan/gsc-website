import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
test('database pause denies direct inserts/reactivation, preserves history, ownership and admin operations',async()=>{
 const db=new PGlite();try{
 await db.exec(`create role anon; create role authenticated; create schema app_private;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
 create function app_private.is_admin() returns boolean language sql stable as $$ select coalesce(current_setting('test.admin',true),'')='true' $$;
 create table public.meetup_bookings(id int primary key,user_id uuid,status text,cancelled_at timestamptz,updated_at timestamptz,booked_at timestamptz);
 insert into public.meetup_bookings values(1,'22222222-2222-2222-2222-222222222222','confirmed',null,now(),now()),(2,'33333333-3333-3333-3333-333333333333','confirmed',null,now(),now());
 alter table public.meetup_bookings enable row level security;
 create policy own on public.meetup_bookings to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
 grant usage on schema auth,app_private to authenticated;grant select,insert,update on public.meetup_bookings to authenticated;`);
 const snapshot=(await db.query('select * from public.meetup_bookings order by id')).rows;
 await db.exec(await readFile('supabase/operations/privacy-protection-review.sql','utf8'));
 assert.deepEqual((await db.query('select * from public.meetup_bookings order by id')).rows,snapshot);
 await db.exec(`select set_config('test.uid','22222222-2222-2222-2222-222222222222',false);set role authenticated;`);
 assert.equal((await db.query('select * from public.meetup_bookings')).rows.length,1);
 await assert.rejects(db.exec(`insert into public.meetup_bookings(id,user_id,status) values(3,auth.uid(),'confirmed')`),{code:'42501'});
 await assert.rejects(db.exec(`update app_private.privacy_protection_control set paused=false`),{code:'42501'});
 await db.exec(`update public.meetup_bookings set status='cancelled',cancelled_at=now() where id=1`);
 await assert.rejects(db.exec(`update public.meetup_bookings set status='confirmed',cancelled_at=null where id=1`),{code:'42501'});
 assert.equal((await db.query(`update public.meetup_bookings set status='cancelled',cancelled_at=now() where id=2 returning id`)).rows.length,0);
 await db.exec(`reset role;select set_config('test.admin','true',false);update public.meetup_bookings set status='confirmed',cancelled_at=null where id=1`);
 assert.equal((await db.query(`select count(*)::int n from public.meetup_bookings`)).rows[0].n,2);
 }finally{await db.close();}
});
