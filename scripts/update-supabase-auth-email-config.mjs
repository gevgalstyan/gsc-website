/**
 * Applies branded Auth templates, Resend SMTP settings, and Google provider settings.
 * Risk: HIGH. Run only with scoped credentials supplied through environment variables.
 */

import { authEmailConfig, productionAuthUrlConfig } from "../supabase/auth-email-config.mjs";

// ======================================================
// AUTH EMAILS / GOOGLE OAUTH — ENVIRONMENT INPUTS
// ======================================================
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const smtpPassword = process.env.RESEND_SMTP_PASSWORD;
const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID ?? "603668832594-nuaipidtu1rdouhipm2iflan0sm26c0l.apps.googleusercontent.com";
const googleClientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? "vmvsxxtaqtvaotrooafq";

if (!accessToken) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required. Create a scoped personal access token in the Supabase dashboard and provide it through the environment, never in source control.");
}

if (!smtpPassword) {
  throw new Error("RESEND_SMTP_PASSWORD is required. Provide a Resend API key through the environment, never in source control.");
}

if (!googleClientSecret) {
  throw new Error("GOOGLE_OAUTH_CLIENT_SECRET is required. Provide the secret belonging to the configured Google Web Client through the environment, never in source control.");
}

if (!googleClientId.endsWith(".apps.googleusercontent.com")) {
  throw new Error("GOOGLE_OAUTH_CLIENT_ID must be a Google OAuth client ID.");
}

// ======================================================
// SMTP / AUTH PROVIDER CONFIGURATION
// ======================================================
const smtpConfig = {
  external_email_enabled: true,
  mailer_autoconfirm: false,
  mailer_secure_email_change_enabled: true,
  smtp_admin_email: "hello@galstyansspeakingclub.ru",
  smtp_host: "smtp.resend.com",
  smtp_port: 465,
  smtp_user: "resend",
  smtp_pass: smtpPassword,
  smtp_sender_name: "Galstyan’s Speaking Club",
  external_google_enabled: true,
  external_google_client_id: googleClientId,
  external_google_secret: googleClientSecret,
};

const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  headers: {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ ...productionAuthUrlConfig, ...smtpConfig, ...authEmailConfig }),
});

if (!response.ok) {
  throw new Error(`Supabase Auth configuration update failed with HTTP ${response.status}.`);
}

console.log(`Updated production URLs, Google OAuth credentials, Resend SMTP, and ${Object.keys(authEmailConfig).length} branded Auth email settings for ${projectRef}.`);
