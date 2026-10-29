// Builds an isolated-backend browser test artifact. NEVER deploy this out/.
import { spawnSync } from "node:child_process";
const fixture = process.env.GSC_AUTH_TEST_FIXTURE;
if (fixture && !["missing-captcha", "missing-supabase"].includes(fixture)) throw new Error("Unknown Auth test fixture.");
const result = spawnSync("npm", ["run", "build"], { stdio: "inherit", env: {
  ...process.env,
  GSC_AUTH_BUILD_MODE: "test",
  NEXT_PUBLIC_SUPABASE_URL: fixture === "missing-supabase" ? "" : "https://gsc-auth-test.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: fixture === "missing-supabase" ? "" : "sb_publishable_browser-test-only",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: fixture === "missing-captcha" ? "" : "1x00000000000000000000AA",
} });
process.exit(result.status ?? 1);
