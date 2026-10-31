import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
// These fixtures model Supabase-managed schemas. No network/database connection.
const fixture = `
create role anon; create role authenticated; create role service_role bypassrls; create role supabase_admin;
create schema auth; create schema storage; create schema realtime;
create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb default '{}', email_confirmed_at timestamptz, created_at timestamptz default now(), last_sign_in_at timestamptz);
create table auth.identities(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users(id), provider text);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',current_setting('test.email',true)) $$;
create function auth.role() returns text language sql stable as $$ select current_user::text $$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid,owner_id text);
alter table storage.objects enable row level security;
create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
create table realtime.messages(id bigint, extension text, topic text);
alter table realtime.messages enable row level security;
create function realtime.topic() returns text language sql stable as $$ select ''::text $$;
create function realtime.send(jsonb,text,text,boolean) returns void language plpgsql as $$ begin return; end $$;
grant usage on schema auth,storage,realtime to anon,authenticated;
grant select,insert,update,delete on storage.objects to authenticated;
grant select on realtime.messages to authenticated;
`;
test("migration preserves legacy admins, stores requested fields, and enforces own verified access", async () => {
  const db = new PGlite();
  try {
    await db.exec(fixture);
    const files = (await readdir("supabase/migrations")).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files.filter((f) => !f.startsWith("20261029"))) {
      try { await db.exec(await readFile(`supabase/migrations/${file}`, "utf8")); }
      catch (error) { throw new Error(`Baseline migration ${file}: ${error.message}`); }
    }
    const admin = "11111111-1111-1111-1111-111111111111", member = "22222222-2222-2222-2222-222222222222", other = "33333333-3333-3333-3333-333333333333";
    await db.query("insert into auth.users(id,email,email_confirmed_at) values ($1,'galstyanwork@gmail.com',now())", [admin]);
    await db.query("insert into auth.identities(user_id,provider) values ($1,'google')",[admin]);
    await db.query("select set_config('test.uid',$1,false),set_config('test.email','galstyanwork@gmail.com',false)",[admin]);
    for (let index = 0; index < 6; index++) {
      const meetup = (await db.query("insert into public.meetups(title,starts_at,ends_at,location_name,capacity,status,is_public) values ($1,now()+interval '1 day',now()+interval '1 day 2 hours','Club',12,'published',true) returning id",[`Legacy meetup ${index}`])).rows[0].id;
      const booking = (await db.query("insert into public.meetup_bookings(meetup_id,user_id) values ($1,$2) returning id",[meetup,admin])).rows[0].id;
      await db.query("insert into public.attendance(meetup_id,user_id,booking_id,status,is_paid,payment_status,paid_amount_minor,paid_currency) values ($1,$2,$3,'attended',true,'paid',50000,'RUB')",[meetup,admin,booking]);
    }
    await db.query("select set_config('test.uid','',false)");
    const history = async () => {
      const snapshot = {};
      for (const table of ['meetup_bookings','attendance','loyalty_rewards']) snapshot[table] = (await db.query(`select * from public.${table} order by id`)).rows;
      return snapshot;
    };
    const preservedHistory = await history();
    assert.ok(preservedHistory.loyalty_rewards.length > 0);
    const migration = await readFile("supabase/migrations/20261029090000_email_registration_profiles.sql", "utf8");
    await db.exec(migration);
    assert.deepEqual(await history(),preservedHistory);
    assert.equal((await db.query("select role from public.user_roles where user_id=$1", [admin])).rows[0].role, "admin");
    const metadata = { registration_version: "gsc-email-v1", first_name: "Ani", surname: "Test", full_name: "Ani Test", age: 0, nationality: "Armenia", gender: "Prefer not to say", terms_accepted: true, terms_version: "2026-10-29", role: "admin" };
    await db.query("insert into auth.users(id,email,raw_user_meta_data) values ($1,'galstyanoff@gmail.com',$2)", [member, metadata]);
    await db.query("insert into auth.users(id,email,email_confirmed_at) values ($1,'other@example.invalid',now())", [other]);
    const profile = (await db.query("select * from public.profiles where id=$1", [member])).rows[0];
    assert.equal(profile.age, 0); assert.equal(profile.first_name, "Ani"); assert.equal(profile.surname, "Test"); assert.ok(profile.terms_accepted_at); assert.equal(profile.email, "galstyanoff@gmail.com");
    assert.equal((await db.query("select role from public.user_roles where user_id=$1", [member])).rows[0].role, "member");
    async function asMember(id, email) { await db.exec("reset role"); await db.query("select set_config('test.uid',$1,false),set_config('test.email',$2,false)",[id,email]); await db.exec("set role authenticated"); }
    await asMember(member, "galstyanoff@gmail.com");
    assert.equal((await db.query("select * from public.profiles")).rows.length, 0);
    await assert.rejects(db.exec("insert into public.question_progress(question_id) values ('test-question')"));
    await db.exec("reset role"); await db.query("update auth.users set email_confirmed_at=now() where id=$1",[member]);
    await asMember(member, "galstyanoff@gmail.com");
    assert.equal((await db.query("select * from public.profiles")).rows.length, 1);
    assert.equal((await db.query("update public.profiles set first_name='Spoofed' where id=$1 returning id", [other])).rows.length, 0);
    await db.exec("update public.profiles set first_name='Updated',age=1");
    assert.equal((await db.query("select first_name from public.profiles")).rows[0].first_name, "Updated");
    await assert.rejects(db.exec("update public.profiles set email='spoof@example.invalid'"));
    await assert.rejects(db.exec("update public.profiles set terms_accepted_at=now()"));
    assert.equal((await db.query("update public.user_roles set role='admin' returning user_id")).rows.length, 0);
    assert.equal((await db.query("select role from public.user_roles where user_id=$1",[member])).rows[0].role, "member");
    await assert.rejects(db.query("insert into public.user_roles(user_id,role) values ($1,'admin')",[other]));
    assert.equal((await db.query("select app_private.is_admin() as allowed")).rows[0].allowed, false);
    await assert.rejects(db.query("select * from public.admin_member_directory()"), { code: "42501" });
    await assert.rejects(db.query("select public.admin_publish_announcement('Spoof','Not allowed',null)"), { code: "42501" });
    assert.equal((await db.query("select * from public.admin_audit_log")).rows.length, 0);
    assert.equal((await db.query("select * from public.attendance where user_id=$1",[admin])).rows.length, 0);
    assert.equal((await db.query("update public.meetups set title='Spoof' returning id")).rows.length, 0);
    assert.equal((await db.query("select * from public.meetup_bookings where user_id=$1",[admin])).rows.length,0);
    assert.equal((await db.query("select * from public.loyalty_rewards where user_id=$1",[admin])).rows.length,0);
    assert.equal((await db.query("update public.attendance set status='no_show' returning id")).rows.length,0);
    await assert.rejects(db.query("insert into public.notifications(user_id,kind,title,body) values ($1,'announcement','Spoof','Denied')",[other]),{code:"42501"});
    await db.exec("reset role"); await db.query("select set_config('test.uid','',false)");
    await db.query("update auth.users set email='changed@example.invalid' where id=$1", [member]);
    assert.equal((await db.query("select email from public.profiles where id=$1",[member])).rows[0].email,"changed@example.invalid");
    await asMember(admin, "galstyanwork@gmail.com");
    assert.equal((await db.query("select app_private.is_admin() as allowed")).rows[0].allowed, true);
    assert.equal((await db.query("select * from public.admin_member_directory()")).rows.length, 3);
    await db.exec("reset role"); await db.query("select set_config('test.uid','',false)");
    const operation = await readFile("supabase/operations/assign-reviewed-administrators.sql", "utf8");
    await assert.rejects(db.exec(operation), /replace all reviewed UUID placeholders/); await db.exec("rollback");
    await db.query("update auth.users set email='galstyanoff@gmail.com' where id=$1",[member]);
    await db.query("update auth.users set email='gevgalstyan913@gmail.com' where id=$1",[other]);
    const reviewed = operation.replaceAll("REPLACE_WORK_UUID",admin).replaceAll("REPLACE_GEV_UUID",other).replaceAll("REPLACE_OFF_UUID",member);
    // Invalid UUID/email mapping rolls back the entire transaction.
    await assert.rejects(db.exec(reviewed.replaceAll(other,"44444444-4444-4444-4444-444444444444")), /must match/); await db.exec("rollback");
    await db.exec(reviewed); // default preview rolls back
    assert.equal((await db.query("select role from public.user_roles where user_id=$1",[member])).rows[0].role,"member");
    await db.exec(reviewed.replace(/rollback;\s*$/, "commit;"));
    assert.equal((await db.query("select count(*)::int as count from public.user_roles where role='admin'")).rows[0].count,3);
    assert.equal((await db.query("select count(*)::int as count from public.profiles")).rows[0].count,3);
    assert.deepEqual(await history(),preservedHistory);
    const inspected = await db.exec(await readFile("supabase/operations/inspect-administrator-accounts.sql","utf8"));
    assert.equal(inspected[0].rows.length,3);
    assert.deepEqual(inspected[0].rows.find((row) => row.existing_user_id === admin).providers,['google']);
    await asMember(other,"gevgalstyan913@gmail.com");
    assert.equal((await db.query("select app_private.is_admin() as allowed")).rows[0].allowed,true);
  } finally { await db.close(); }
});
