import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {supabaseFixture} from '../helpers/supabase-fixture.mjs';
const schema=await readFile('supabase/tatnet/install.sql','utf8');
const bootstrap=await readFile('supabase/tatnet/bootstrap-admin.sql','utf8');
const admin='11111111-1111-4111-8111-111111111111',member='22222222-2222-4222-8222-222222222222',other='33333333-3333-4333-8333-333333333333',pending='44444444-4444-4444-8444-444444444444';
async function fixture(){const db=new PGlite();await db.exec(supabaseFixture);await db.exec(schema);return db;}
async function owner(db){await db.exec('reset role');await db.query("select set_config('test.uid','',false),set_config('test.email','',false)");}
async function as(db,id,email='fixture@example.invalid'){await owner(db);await db.query("select set_config('test.uid',$1,false),set_config('test.email',$2,false)",[id,email]);await db.exec('set role authenticated');}
async function user(db,id,email,verified=true,metadata={}){await owner(db);await db.query('insert into auth.users(id,email,email_confirmed_at,encrypted_password,raw_user_meta_data) values($1,$2,$3,$4,$5)',[id,email,verified?new Date().toISOString():null,'synthetic-placeholder-not-a-real-password-hash',metadata]);}
async function bootstrapAdmin(db){await user(db,admin,'galstyanwork@gmail.com');await db.exec(bootstrap.replace('00000000-0000-0000-0000-000000000000',admin));}
const reject=async(p)=>assert.rejects(p,{code:'42501'});

test('clean install contains only schema/config, all app tables RLS, minimal privileges and fail-closed pause',async()=>{
 const db=await fixture();try{
 assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,0);
 for(const t of ['profiles','user_roles','meetups','meetup_bookings','attendance','loyalty_rewards','question_progress','notifications','site_content','site_faq_items','site_content_public','site_faq_public'])assert.equal((await db.query(`select count(*)::int n from public.${t}`)).rows[0].n,0);
 assert.equal((await db.query("select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','app_private') and c.relkind='r' and not c.relrowsecurity")).rows[0].n,0);
 assert.equal((await db.query('select paused from app_private.privacy_protection_control')).rows[0].paused,true);
 assert.deepEqual((await db.query('select id,public from storage.buckets order by id')).rows,[{id:'profile-avatars',public:false},{id:'site-media',public:true}]);
 for(const role of ['anon','authenticated'])for(const table of ['profiles','user_roles','meetups','notifications','site_content'])for(const priv of ['TRUNCATE','TRIGGER','REFERENCES'])assert.equal((await db.query('select has_table_privilege($1,$2,$3) allowed',[role,'public.'+table,priv])).rows[0].allowed,false);
 for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_table_privilege($1,'app_private.privacy_protection_control','UPDATE') allowed",[role])).rows[0].allowed,false);
 await db.exec('create function public.synthetic_permission_probe() returns boolean language sql as $$select true$$');
 for(const role of ['anon','authenticated'])assert.equal((await db.query("select has_function_privilege($1,'public.synthetic_permission_probe()','EXECUTE') allowed",[role])).rows[0].allowed,false);
 await assert.rejects(db.exec(schema),/Auth must be empty|public schema must be empty|app_private already exists/);await db.exec('rollback');
 }finally{await db.close();}
});
test('installer refuses existing users or preexisting Storage policies without modifying them',async()=>{
 for(const mode of ['users','policy']){const db=new PGlite();try{await db.exec(supabaseFixture);if(mode==='users')await db.query('insert into auth.users(id,email) values($1,$2)',[member,'fixture@example.invalid']);else await db.exec('create policy existing_platform_policy on storage.objects for select to anon using(true)');await assert.rejects(db.exec(schema),/Auth must be empty|Storage\/Realtime policies/);await db.exec('rollback');assert.equal((await db.query("select count(*)::int n from pg_tables where schemaname='public'")).rows[0].n,0);if(mode==='users')assert.equal((await db.query('select count(*)::int n from auth.users')).rows[0].n,1);}finally{await db.close();}}
});
test('verified owner bootstrap is explicit, unique, repeatable and metadata cannot create an admin',async()=>{
 const db=await fixture();try{
 await assert.rejects(db.exec(bootstrap),/placeholder UUID/);await db.exec('rollback');
 await user(db,member,'fixture@example.invalid',true,{role:'admin',app_metadata:{role:'admin'}});
 assert.equal((await db.query('select role from public.user_roles where user_id=$1',[member])).rows[0].role,'member');
 await assert.rejects(db.exec(bootstrap.replace('00000000-0000-0000-0000-000000000000',member)),/Expected verified/);await db.exec('rollback');
 await user(db,admin,'galstyanwork@gmail.com',false);
 await assert.rejects(db.exec(bootstrap.replace('00000000-0000-0000-0000-000000000000',admin)),/Expected verified/);await db.exec('rollback');
 await db.query('update auth.users set email_confirmed_at=now() where id=$1',[admin]);
 const applied=bootstrap.replace('00000000-0000-0000-0000-000000000000',admin);await db.exec(applied);await db.exec(applied);
 assert.equal((await db.query("select count(*)::int n from public.user_roles where role='admin'")).rows[0].n,1);
 await as(db,member);await reject(db.query("update public.user_roles set role='admin' where user_id=$1",[member]));
 await reject(db.exec('select * from public.admin_member_directory()'));await reject(db.exec("select public.admin_publish_announcement('Spoof','Denied',null)"));
 await as(db,admin,'galstyanwork@gmail.com');assert.equal((await db.query('select app_private.is_admin() allowed')).rows[0].allowed,true);assert.equal((await db.query('select * from public.admin_member_directory()')).rows.length,2);
 await reject(db.query("update public.user_roles set role='admin' where user_id=$1",[member]));
 }finally{await db.close();}
});
test('own/other profiles, optional personal editor and private notes remain scoped; unverified users denied',async()=>{
 const db=await fixture();try{
 await bootstrapAdmin(db);await user(db,member,'member@example.invalid');await user(db,other,'other@example.invalid');await user(db,pending,'pending@example.invalid',false);
 await as(db,member);assert.equal((await db.query('select * from public.profiles')).rows.length,1);assert.equal((await db.query('update public.profiles set display_name=$1 where id=$2 returning id',['Spoof',other])).rows.length,0);
 await db.exec("update public.profiles set first_name='Synthetic',surname='Fixture',age=25,nationality='Other / not listed',gender='Prefer not to say'");
 await reject(db.exec("update public.profiles set email='spoof@example.invalid'"));assert.equal((await db.query('select * from public.attendance_admin_notes')).rows.length,0);assert.equal((await db.query('select * from public.admin_audit_log')).rows.length,0);
 await as(db,pending);assert.equal((await db.query('select * from public.profiles')).rows.length,0);await reject(db.exec("insert into public.question_progress(question_id) values('Synthetic-1')"));
 }finally{await db.close();}
});
test('CMS drafts never reach public tables; publish/discard/restore and anonymous published reads work',async()=>{
 const db=await fixture();try{
 await bootstrapAdmin(db);await user(db,member,'member@example.invalid');await as(db,admin,'galstyanwork@gmail.com');
 await db.exec("insert into public.site_content(key,value,draft_value,page_slug,section_slug,content_type,is_public,published_is_enabled) values('home.synthetic','Private draft','Private draft','home','hero','text',true,false)");
 await db.exec("insert into public.site_faq_items(draft_question,draft_answer,published_is_enabled) values('Synthetic question?','Private answer',false)");
 await db.exec("select public.publish_site_page('home');select public.publish_site_page('faq')");
 await db.exec("update public.site_content set draft_value='Unpublished secret';update public.site_faq_items set draft_answer='Unpublished answer'");
 await owner(db);await db.exec('set role anon');
 await reject(db.exec('select draft_value from public.site_content'));await reject(db.exec('select draft_answer from public.site_faq_items'));
 assert.equal((await db.query('select value from public.site_content_public')).rows[0].value,'Private draft');assert.equal((await db.query('select answer from public.site_faq_public')).rows[0].answer,'Private answer');
 await reject(db.exec("update public.site_content_public set value='Overwrite'"));
 await as(db,member);assert.equal((await db.query('select * from public.site_content')).rows.length,0);assert.equal((await db.query('select * from public.site_faq_items')).rows.length,0);await assert.rejects(db.exec("select public.publish_site_page('home')"),/Administrator access required/);
 await as(db,admin,'galstyanwork@gmail.com');await db.exec("select public.discard_site_page_drafts('home')");assert.equal((await db.query('select draft_value from public.site_content')).rows[0].draft_value,'Private draft');
 const revision=(await db.query("select id from public.site_content_revisions where page_slug='home' limit 1")).rows[0].id;await db.query('select public.restore_site_revision($1)',[revision]);
 await db.exec("update public.site_content set published_is_enabled=false;update public.site_faq_items set published_is_enabled=false");
 await owner(db);await db.exec('set role anon');assert.equal((await db.query('select * from public.site_content_public')).rows.length,0);assert.equal((await db.query('select * from public.site_faq_public')).rows.length,0);
 }finally{await db.close();}
});
test('notifications allow recipient read_at only and guarded admin announcements',async()=>{
 const db=await fixture();try{
 await bootstrapAdmin(db);await user(db,member,'member@example.invalid');await user(db,other,'other@example.invalid');await as(db,admin,'galstyanwork@gmail.com');
 await db.exec("select public.admin_publish_announcement('Synthetic','Message','/account/')");
 await as(db,member);const rows=(await db.query('select * from public.notifications')).rows;assert.equal(rows.length,1);
 await db.query('update public.notifications set read_at=now() where id=$1',[rows[0].id]);await reject(db.exec("update public.notifications set body='Spoof'"));await reject(db.exec("update public.notifications set target_url='/admin/'"));await reject(db.exec("insert into public.notifications(user_id,kind,title,body) values(auth.uid(),'announcement','Spoof','Denied')"));
 await owner(db);await db.exec('set role anon');await reject(db.exec('select * from public.notifications'));
 }finally{await db.close();}
});
test('private avatars support own upsert/admin read without exposing other members; public media read only',async()=>{
 const db=await fixture();try{
 await bootstrapAdmin(db);await user(db,member,'member@example.invalid');await user(db,other,'other@example.invalid');await as(db,member);
 const path=member+'/avatar.webp';await db.query("insert into storage.objects(bucket_id,name,owner) values('profile-avatars',$1,$2)",[path,member]);await db.query('update storage.objects set name=$1 where name=$1',[path]);
 await reject(db.query("insert into storage.objects(bucket_id,name) values('profile-avatars',$1)",[other+'/avatar.webp']));await as(db,other);assert.equal((await db.query('select * from storage.objects')).rows.length,0);
 await as(db,admin,'galstyanwork@gmail.com');assert.equal((await db.query('select * from storage.objects')).rows.length,1);
 await db.exec("insert into storage.objects(bucket_id,name) values('site-media','synthetic.jpg')");await owner(db);await db.exec('set role anon');assert.equal((await db.query('select * from storage.objects')).rows.length,1);await reject(db.exec("insert into storage.objects(bucket_id,name) values('site-media','spoof.jpg')"));
 }finally{await db.close();}
});
test('private Realtime uses own topic, latest-write-wins and no cross-user question access',async()=>{
 const db=await fixture();try{
 await user(db,member,'member@example.invalid');await user(db,other,'other@example.invalid');await as(db,member);
 await db.exec("insert into public.question_progress(question_id,last_viewed_at) values('Synthetic-1','2026-10-02')");await db.exec("update public.question_progress set last_viewed_at='2026-10-01'");assert.equal(new Date((await db.query('select last_viewed_at from public.question_progress')).rows[0].last_viewed_at).getUTCDate(),2);
 await owner(db);const messages=(await db.query('select * from realtime.test_broadcasts')).rows;assert.ok(messages.some(x=>x.topic==='question-state:'+member&&x.private));
 await db.query("insert into realtime.messages(extension,topic) values('broadcast',$1),('broadcast',$2)",['question-state:'+member,'question-state:'+other]);
 // Fixture realtime.topic() models the requested channel, not individual row topic.
 await as(db,member);await db.query("select set_config('test.topic',$1,false)",['question-state:'+other]);assert.equal((await db.query('select * from realtime.messages')).rows.length,0);
 await db.query("select set_config('test.topic',$1,false)",['question-state:'+member]);assert.ok((await db.query('select * from realtime.messages')).rows.length>0);
 await as(db,other);assert.equal((await db.query('select * from public.question_progress')).rows.length,0);await reject(db.query("insert into public.question_favorites(user_id,question_id) values($1,'Synthetic-1')",[member]));
 }finally{await db.close();}
});
test('booking pause, own cancellation, capacity, payment preservation and reward redemption remain coherent',async()=>{
 const db=await fixture();try{
 await bootstrapAdmin(db);await user(db,member,'member@example.invalid');await user(db,other,'other@example.invalid');await as(db,admin,'galstyanwork@gmail.com');
 const meetup=(await db.query("insert into public.meetups(title,starts_at,ends_at,location_name,capacity,status,is_public) values('Synthetic meetup',now()+interval '1 day',now()+interval '1 day 2 hours','Fixture',1,'published',true) returning id")).rows[0].id;
 await as(db,member);await reject(db.query('insert into public.meetup_bookings(meetup_id) values($1)',[meetup]));
 await owner(db);await db.exec('update app_private.privacy_protection_control set paused=false');await as(db,member);await db.query('insert into public.meetup_bookings(meetup_id) values($1)',[meetup]);
 await as(db,other);await assert.rejects(db.query('insert into public.meetup_bookings(meetup_id) values($1)',[meetup]));
 await owner(db);await db.exec('update app_private.privacy_protection_control set paused=true');await as(db,member);await db.query("update public.meetup_bookings set status='cancelled' where meetup_id=$1",[meetup]);await assert.rejects(db.query("update public.meetup_bookings set status='confirmed' where meetup_id=$1",[meetup]));
 await as(db,admin,'galstyanwork@gmail.com');
 for(let i=0;i<6;i++){const m=(await db.query("insert into public.meetups(title,starts_at,ends_at,location_name,capacity,status,is_public) values($1,now()+interval '1 day',now()+interval '1 day 2 hours','Fixture',12,'published',true) returning id",['Synthetic '+i])).rows[0].id;await db.query("insert into public.attendance(meetup_id,user_id,status,payment_status,is_paid,paid_currency,paid_amount_minor) values($1,$2,'attended','paid',true,'RUB',50000)",[m,member]);}
 assert.equal((await db.query("select count(*)::int n from public.loyalty_rewards where user_id=$1 and status='available'",[member])).rows[0].n,1);
 await as(db,member);assert.equal((await db.query("update public.attendance set payment_status='unpaid' returning id")).rows.length,0);
 await as(db,admin,'galstyanwork@gmail.com');assert.equal((await db.query("select count(*)::int n from public.attendance where user_id=$1 and payment_status='paid' and paid_amount_minor=50000",[member])).rows[0].n,6);
 const paid=(await db.query('select meetup_id from public.attendance where user_id=$1 limit 1',[member])).rows[0];
 await db.query("insert into public.attendance(meetup_id,user_id,status,payment_status,is_paid) values($1,$2,'attended','unpaid',false) on conflict(meetup_id,user_id) do nothing",[paid.meetup_id,member]);
 assert.equal((await db.query('select payment_status from public.attendance where meetup_id=$1 and user_id=$2',[paid.meetup_id,member])).rows[0].payment_status,'paid');
 const booking=(await db.query("update public.meetup_bookings set status='confirmed' where meetup_id=$1 returning id",[meetup])).rows[0].id;
 const free=(await db.query("insert into public.attendance(meetup_id,user_id,booking_id,status,payment_status) values($1,$2,$3,'attended','free_reward') returning id",[meetup,member,booking])).rows[0].id;
 assert.equal((await db.query("select count(*)::int n from public.loyalty_rewards where user_id=$1 and status='redeemed' and redeemed_booking_id=$2",[member,booking])).rows[0].n,1);
 await assert.rejects(db.query("update public.attendance set payment_status='paid',paid_currency='RUB',paid_amount_minor=50000 where id=$1",[free]),/redeemed free visit cannot be changed/);

 }finally{await db.close();}
});

test('anonymous public catalogs exclude drafts and private meetups without private-helper grants',async()=>{
 const db=await fixture();try{
 await bootstrapAdmin(db);await as(db,admin,'galstyanwork@gmail.com');
 await db.exec("insert into public.managed_questions(id,prompt,translation,category,difficulty,is_published) values('55555555-5555-4555-8555-555555555555','Public question','Translation','General','Intermediate',true),('66666666-6666-4666-8666-666666666666','Private question','Translation','General','Intermediate',false)");
 await db.exec("insert into public.meetups(title,starts_at,ends_at,location_name,capacity,status,is_public) values('Public',now()+interval '1 day',now()+interval '2 days','Fixture',12,'published',true),('Private',now()+interval '1 day',now()+interval '2 days','Fixture',12,'published',false)");
 await owner(db);await db.exec('set role anon');
 assert.deepEqual((await db.query('select id from public.managed_questions')).rows,[{id:'55555555-5555-4555-8555-555555555555'}]);
 assert.deepEqual((await db.query('select title from public.meetups')).rows,[{title:'Public'}]);
 await reject(db.exec('select app_private.is_admin()'));
 }finally{await db.close();}
});
