import assert from "node:assert/strict";
import { test } from "node:test";
import { readFile } from "node:fs/promises";
import { authEmails, authEmailConfig } from "../../supabase/auth-email-config.mjs";
test("paste-ready HTML, text, and subjects match the canonical email definitions", async () => {
  assert.equal(authEmails.length,7);
  for (const email of authEmails) {
    assert.equal(await readFile(`supabase/templates/${email.file}.html`,"utf8"),email.html);
    assert.equal(await readFile(`supabase/templates/${email.file}.txt`,"utf8"),email.text);
    assert.ok(email.subject); assert.match(email.html,/with \.Data/); assert.match(email.html,/Hi there,/);
    assert.match(email.html,/max-width:600px/); assert.match(email.html,/#ff5a1f/);
    assert.doesNotMatch(email.html,/<script|\.ConfirmationURL|fonts.googleapis|\.Password|\.AccessToken/i);
    if (email.type) {
      assert.match(email.html,/\.SiteURL.*\/auth\/confirm\/\?token_hash={{ \.TokenHash }}/);
      assert.match(email.html,new RegExp(`type=${email.type}&amp;next=`));
    }
  }
  assert.ok(Object.keys(authEmailConfig).every(key => /^mailer_(subjects|templates)_/.test(key)));
});
test("security mail avoids promotion and reauthentication keeps Supabase's code mechanism", () => {
  for (const email of authEmails.filter(email => email.id !== "confirmation")) assert.doesNotMatch(email.html,/Why join us|Every 7th/);
  const reauth=authEmails.find(email => email.id === "reauthentication");
  assert.match(reauth.html,/{{ \.Token }}/); assert.doesNotMatch(reauth.html,/TokenHash/);
});
