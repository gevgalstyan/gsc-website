import { authEmailConfig, productionAuthUrlConfig } from "../supabase/auth-email-config.mjs";

const accessToken = process.env.SUPABASE_ACCESS_TOKEN;
const smtpPassword = process.env.RESEND_SMTP_PASSWORD;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? "vmvsxxtaqtvaotrooafq";

if (!accessToken) {
  throw new Error("SUPABASE_ACCESS_TOKEN is required. Create a scoped personal access token in the Supabase dashboard and provide it through the environment, never in source control.");
}

if (!smtpPassword) {
  throw new Error("RESEND_SMTP_PASSWORD is required. Provide a Resend API key through the environment, never in source control.");
}

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

console.log(`Updated production URLs, Resend SMTP, and ${Object.keys(authEmailConfig).length} branded Auth email settings for ${projectRef}.`);
