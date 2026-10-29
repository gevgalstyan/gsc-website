import assert from "node:assert/strict";
import { test } from "node:test";
import { authConfigurationErrors, publicAuthSettingsErrors, managementAuthSettingsErrors } from "../../scripts/auth-configuration.mjs";
const valid = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "0x4AAAA-real-widget-example" };
test("the default production gate requires all three public build variables", () => {
  for (const name of Object.keys(valid)) assert.ok(authConfigurationErrors({ ...valid, [name]: "" }).some((error) => error.includes(name)));
  assert.deepEqual(authConfigurationErrors(valid), []);
});
test("production rejects published CAPTCHA test keys and the mocked backend", () => {
  assert.ok(authConfigurationErrors({ ...valid, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" }).length);
  assert.ok(authConfigurationErrors({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "https://gsc-auth-test.supabase.co" }).length);
  assert.deepEqual(authConfigurationErrors({ ...valid, NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA" }, { testBuild: true }), []);
});
test("credential values and malformed URLs are never included in diagnostics", () => {
  const sentinel = "sb_secret_SENSITIVE_TEST_VALUE";
  const errors = authConfigurationErrors({ ...valid, NEXT_PUBLIC_SUPABASE_URL: "invalid-PRIVATE-URL", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: sentinel });
  assert.ok(errors.length); assert.ok(!JSON.stringify(errors).includes(sentinel)); assert.ok(!JSON.stringify(errors).includes("PRIVATE-URL"));
});
test("public inspection detects disabled signup, auto-confirm, and disabled email", () => {
  assert.equal(publicAuthSettingsErrors({ disable_signup: true, mailer_autoconfirm: true, external: { email: false } }).length, 3);
  assert.deepEqual(publicAuthSettingsErrors({ disable_signup: false, mailer_autoconfirm: false, external: { email: true } }), []);
});
test("management inspection requires redirects, SMTP and server-side Turnstile configuration", () => {
  assert.equal(managementAuthSettingsErrors({}).length, 4);
  assert.deepEqual(managementAuthSettingsErrors({ site_url: "https://galstyansspeakingclub.ru", uri_allow_list: "https://galstyansspeakingclub.ru/auth/callback/**", security_captcha_enabled: true, security_captcha_provider: "turnstile", security_captcha_secret: "SENSITIVE", smtp_host: "example.invalid", smtp_user: "SENSITIVE", smtp_pass: "SENSITIVE", smtp_admin_email: "example@example.invalid" }), []);
  assert.ok(!JSON.stringify(managementAuthSettingsErrors({ smtp_pass: "SENSITIVE" })).includes("SENSITIVE"));
});
