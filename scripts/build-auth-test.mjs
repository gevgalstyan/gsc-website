// Builds an isolated-backend browser test artifact. NEVER deploy this out/.
import { spawnSync } from "node:child_process";
const result = spawnSync("npm", ["run", "build"], { stdio: "inherit", env: {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: "https://gsc-auth-test.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_browser-test-only",
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
} });
process.exit(result.status ?? 1);
