import { test } from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
test("real Supabase SDK rejects a callback code in a clean browser before any network exchange", async () => {
  let calls = 0;
  const client = createClient("https://gsc-auth-test.supabase.co","sb_publishable_test", {
    global: {fetch: async () => { calls++; throw new Error("No real requests permitted"); }},
    auth: { flowType:"pkce", persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
  });
  const {data,error}=await client.auth.exchangeCodeForSession("fake-code-not-valid");
  assert.equal(data.session,null); assert.equal(error?.code,"pkce_code_verifier_not_found"); assert.equal(calls,0);
});
