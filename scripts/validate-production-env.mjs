import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd(), false);
const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) throw new Error(`Missing production build variables: ${missing.join(", ")}`);
const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL must be an HTTPS project origin.");
}
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
// Public builds must never embed service-role or secret API keys.
if (!key.startsWith("sb_publishable_")) {
  throw new Error("Use a Supabase sb_publishable_ key for the public production build.");
}
for (const name of ["NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "NEXT_PUBLIC_TELEGRAM_AUTH_ENABLED"]) {
  if (process.env[name] && !["true", "false"].includes(process.env[name])) {
    throw new Error(`${name} must be true or false.`);
  }
}
console.log("Production public Supabase configuration is present; live authentication still requires staging verification.");
