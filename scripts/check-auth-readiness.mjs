/** Read-only inspection. Never prints credential values or sends verification emails. */
import nextEnv from "@next/env";
import { readFile } from "node:fs/promises";
import { AUTH_VARIABLES, authConfigurationErrors, publicAuthSettingsErrors, managementAuthSettingsErrors } from "./auth-configuration.mjs";
nextEnv.loadEnvConfig(process.cwd(), false);
let failed = false;
const report = (messages) => { for (const message of messages) console.log(`ACTION: ${message}`); if (messages.length) failed = true; };
for (const name of AUTH_VARIABLES) console.log(`${name}: ${process.env[name]?.trim() ? "present" : "MISSING"}`);
report(authConfigurationErrors(process.env));
let url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
let key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
if ((!url || !key) && process.argv.includes("--repository-public-config")) {
  const repository = JSON.parse(await readFile("vercel.json", "utf8"));
  url = repository.env?.NEXT_PUBLIC_SUPABASE_URL; key = repository.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  console.log("Using repository public settings for a READ-ONLY comparison. This does not configure the Timeweb build.");
}
async function inspect(label, endpoint, headers) {
  try {
    const response = await fetch(endpoint, { headers, redirect: "error", signal: AbortSignal.timeout(15000) });
    if (!response.ok) { report([`${label}: HTTP ${response.status}; settings remain unverified.`]); return null; }
    try { return await response.json(); }
    catch { report([`${label}: response was not valid JSON; check deployed routes and static-host fallback rules. Settings remain unverified.`]); return null; }
  } catch (error) {
    const denied = /403|forbidden/i.test(String(error.cause?.message ?? ""));
    report([`${label}: ${denied ? "proxy/network access denied" : "network/TLS request failed"}; settings remain unverified. No credentials were printed.`]);
    return null;
  }
}
let project;
try { project = new URL(url); } catch { /* already reported */ }
if (project?.protocol === "https:" && !project.username && !project.password && project.pathname === "/" && key?.startsWith("sb_publishable_")) {
  const settings = await inspect("Public Supabase Auth settings", `${project.origin}/auth/v1/settings`, { apikey: key });
  if (settings) { console.log("Public Supabase Auth settings: retrieved."); report(publicAuthSettingsErrors(settings)); }
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  const reference = project.hostname.match(/^([a-z0-9]+)\.supabase\.co$/)?.[1];
  if (token && reference) {
    const settings = await inspect("Supabase management settings", `https://api.supabase.com/v1/projects/${reference}/config/auth`, { Authorization: `Bearer ${token}` });
    if (settings) { console.log("Management settings: retrieved; credential values are redacted."); report(managementAuthSettingsErrors(settings)); }
  } else report(["SMTP, CAPTCHA secret/provider, Site URL and redirect settings require Dashboard inspection or an existing securely configured management credential. No usable management credential is available to this check."]);
}
const deployment = await inspect("Live Auth build status", "https://galstyansspeakingclub.ru/auth-build-status.json", {});
if (deployment?.schema_version === 1) {
  if (deployment.mode !== "production" || deployment.supabase_configured !== true || deployment.turnstile_configured !== true) report(["The deployed static artifact is not a fully configured production Auth build. Rebuild with all three real public variables, then deploy only after approval."]);
  else console.log("Deployed artifact reports production Auth configuration; live verification is still required.");
} else if (deployment) report(["Live artifact has no recognized Auth build status. Inspect the deployed build directly."]);
console.log("NOT VERIFIED: actual email receipt, real CAPTCHA challenge/rejection, and deployed database permissions. This command makes no writes.");
process.exitCode = failed ? 1 : 0;
