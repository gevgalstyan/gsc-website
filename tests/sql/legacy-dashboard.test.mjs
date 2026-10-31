import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile,readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
// Reuse the managed-schema fixture, not any live project/database.
const source=await readFile("tests/sql/email-registration.test.mjs","utf8");
const fixture=source.match(/const fixture = `([\s\S]*?)`;/)?.[1];
test("legacy dashboard query fails only on optional fields while existing RLS still authorizes profiles",async()=>{
 const db=new PGlite();try{
  await db.exec(fixture);
  for(const file of (await readdir("supabase/migrations")).filter(file=>file.endsWith(".sql")&&!file.startsWith("20261029")).sort())await db.exec(await readFile(`supabase/migrations/${file}`,"utf8"));
  const admin="11111111-1111-1111-1111-111111111111",member="22222222-2222-2222-2222-222222222222";
  await db.query("insert into auth.users(id,email,email_confirmed_at) values ($1,'galstyanwork@gmail.com',now()),($2,'member@example.invalid',now())",[admin,member]);
  async function asUser(id,email){await db.exec("reset role");await db.query("select set_config('test.uid',$1,false),set_config('test.email',$2,false)",[id,email]);await db.exec("set role authenticated");}
  await asUser(admin,"galstyanwork@gmail.com");
  await assert.rejects(db.query("select id,display_name,first_name from public.profiles"),{code:"42703"});
  assert.equal((await db.query("select id,display_name,avatar_path,avatar_url,telegram_username,english_level,created_at from public.profiles")).rows.length,2);
  assert.equal((await db.query("select * from public.admin_member_directory()")).rows.length,2);
  await asUser(member,"member@example.invalid");
  assert.equal((await db.query("select id,display_name from public.profiles")).rows.length,1);
  assert.equal((await db.query("select id from public.profiles where id=$1",[admin])).rows.length,0);
  await assert.rejects(db.query("select * from public.admin_member_directory()"),{code:"42501"});
  assert.equal((await db.query("update public.user_roles set role='admin' returning user_id")).rows.length,0);
  await db.query("insert into storage.objects(bucket_id,name,owner) values ('profile-avatars',$1,$2)",[`${member}/avatar.webp`,member]);
  await assert.rejects(db.query("insert into storage.objects(bucket_id,name,owner) values ('profile-avatars',$1,$2)",[`${admin}/avatar.webp`,member]),{code:"42501"});
  await db.exec("reset role");assert.equal((await db.query("select count(*)::int n from public.profiles")).rows[0].n,2);
 }finally{await db.close();}
});
