import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import ts from 'typescript';
const toModule=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
test('actual SDK transport blocks signup/OTP/booking bodies before fetch, permits login and cancellation',async()=>{
 const guard=toModule(await readFile('src/lib/privacy-protection.ts','utf8'));
 const source=(await readFile('src/lib/supabase/fetch.ts','utf8')).replace('"@/lib/privacy-protection"',JSON.stringify(guard));
 const {fetchWithTimeout}=await import(toModule(source));const original=globalThis.fetch;let calls=0;
 globalThis.fetch=async()=>{calls++;return new Response('{}',{status:200});};
 try{
  for(const path of ['/auth/v1/signup','/auth/v1/otp','/rest/v1/meetup_bookings'])assert.equal((await fetchWithTimeout(`https://example.invalid${path}`,{method:'POST',body:'never-transmitted'})).status,403);
  assert.equal(calls,0);
  assert.equal((await fetchWithTimeout(new Request('https://example.invalid/auth/v1/signup',{method:'POST',body:'never-transmitted'}))).status,403);
  assert.equal(calls,0);
  for(const [path,method] of [['/auth/v1/token','POST'],['/auth/v1/recover','POST'],['/rest/v1/meetup_bookings','PATCH']])assert.equal((await fetchWithTimeout(`https://example.invalid${path}`,{method})).status,200);
  assert.equal(calls,3);
 }finally{globalThis.fetch=original;}
});
