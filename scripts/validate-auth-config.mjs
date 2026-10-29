import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd(), false);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const captcha = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
if (url || key) {
  if (!url || !key) throw new Error("Configure both public Supabase build variables together.");
  let project;
  try { project = new URL(url); } catch { throw new Error("Use a valid HTTPS Supabase project origin."); }
  if (project.protocol !== "https:" || project.username || project.password || project.search || project.hash || project.pathname !== "/") throw new Error("Use an HTTPS Supabase project origin.");
  if (!key.startsWith("sb_publishable_")) throw new Error("Only a Supabase publishable key may be included in this browser build. Never use a secret or service-role key.");
}
if (process.argv.includes("--require-auth") && (!url || !key || !captcha)) throw new Error("Production email access requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and NEXT_PUBLIC_TURNSTILE_SITE_KEY.");
console.log(url && captcha ? "Public Auth build configuration is present. Live delivery, CAPTCHA, redirects and permissions still require staging tests." : "Public-only build: email access is unavailable until Supabase and Turnstile are configured.");
