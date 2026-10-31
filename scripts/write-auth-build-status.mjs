import nextEnv from "@next/env";
import { writeFile } from "node:fs/promises";
nextEnv.loadEnvConfig(process.cwd(), false);
await writeFile("out/auth-build-status.json", JSON.stringify({
  schema_version: 1,
  mode: process.env.GSC_AUTH_BUILD_MODE === "test" ? "test" : "production",
  supabase_configured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()),
  turnstile_configured: Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim()),
}, null, 2) + "\n");
console.log("Wrote non-secret Auth build status for deployment diagnostics.");
