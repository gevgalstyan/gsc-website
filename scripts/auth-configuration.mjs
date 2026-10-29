/** Pure, value-redacting checks shared by the build gate and read-only diagnostics. */
export const AUTH_VARIABLES = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_TURNSTILE_SITE_KEY"];
export function authConfigurationErrors(env, { testBuild = false } = {}) {
  const errors = [];
  for (const name of AUTH_VARIABLES) if (!env[name]?.trim() && !testBuild) errors.push(`Missing ${name}. Set it in the build environment and rebuild the static site.`);
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const captcha = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();
  if (url || key) {
    if (!url || !key) errors.push("Configure both public Supabase build variables together.");
    if (url) {
      try {
        const parsed = new URL(url);
        if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) errors.push("Use an HTTPS Supabase project origin without credentials, path or query.");
        if (!testBuild && parsed.hostname === "gsc-auth-test.supabase.co") errors.push("The mocked Auth backend must not be used in a production build.");
      } catch { errors.push("Use a valid HTTPS Supabase project origin."); }
    }
    if (key && !key.startsWith("sb_publishable_")) errors.push("Use a public Supabase publishable key, never a secret or service-role key.");
    if (!testBuild && key === "sb_publishable_browser-test-only") errors.push("The mocked publishable key must not be used in a production build.");
  }
  if (!testBuild && captcha && /^[123]x0+(AA|AB|BB|FF)$/.test(captcha)) errors.push("A Cloudflare Turnstile test site key cannot protect production registration. Use the real widget's public site key.");
  return errors;
}

export function publicAuthSettingsErrors(settings) {
  const errors = [];
  if (settings.disable_signup !== false) errors.push("Supabase signup is disabled or its status could not be verified.");
  if (settings.mailer_autoconfirm !== false) errors.push("Enable Confirm email in Supabase Auth. Auto-confirmed users do not receive a verification email.");
  if (settings.external?.email !== true) errors.push("Enable the Supabase email/password provider, or verify its status in the Dashboard.");
  return errors;
}
export function managementAuthSettingsErrors(settings) {
  const errors = [];
  if (settings.site_url?.replace(/\/$/, "") !== "https://galstyansspeakingclub.ru") errors.push("Set the Supabase Auth Site URL to the canonical production origin.");
  if (!settings.uri_allow_list?.includes("https://galstyansspeakingclub.ru/auth/callback")) errors.push("Allow the production Auth callback URL and its recovery query variant.");
  if (settings.security_captcha_enabled !== true || settings.security_captcha_provider !== "turnstile" || !settings.security_captcha_secret) errors.push("Enable Cloudflare Turnstile in Supabase Auth and configure its secret in Supabase only.");
  if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass || !settings.smtp_admin_email) errors.push("Custom SMTP is missing or cannot be verified. Supabase's default email service restricts recipients and is not sufficient for open club registration.");
  return errors;
}
