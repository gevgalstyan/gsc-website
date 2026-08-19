import { authEmailConfig, productionAuthUrlConfig } from "../supabase/auth-email-config.mjs";

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? "vmvsxxtaqtvaotrooafq";

if (!accessToken) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required. Create a scoped personal access token in the Supabase dashboard and provide it through the environment, never in source control.");
}

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ ...productionAuthUrlConfig, ...authEmailConfig }),
});

if (!response.ok) {
  throw new Error(`Supabase Auth configuration update failed with HTTP ${response.status}.`);
}

console.log(`Updated production URL configuration and ${Object.keys(authEmailConfig).length} branded Auth email settings for ${projectRef}.`);
