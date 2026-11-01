"use client";
import { useBrowserViewer } from "@/hooks/use-browser-viewer";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { authCallbackUrl, safeAuthDestination } from "@/lib/auth-redirect";
import { TERMS_VERSION, validEmail, validateRegistration, type RegistrationFields } from "@/lib/registration";
import { AuthCaptcha, CAPTCHA_SITE_KEY, AUTH_UNAVAILABLE_MESSAGE } from "./auth-captcha";
import { AuthPasswordInput } from "./auth-password-input";
import { AuthProfileFields } from "./auth-profile-fields";
import styles from "./email-auth.module.css";
export type AuthMode = "login" | "register" | "forgot" | "verify";
const cooldownKey = "gsc:email-resend-after";
function authError(code?: string, status?: number) {
  if (status && status >= 500) return "The authentication service could not complete this request. No email delivery has been confirmed. Please try again later or contact the club.";
  if (code === "unexpected_failure" || code === "email_send_failed") return "The email service could not complete this request. Please contact the club or try again later.";
  if (code === "captcha_failed") return "The security check failed. Please complete it again and retry.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit") return "Too many requests. Please wait a minute before trying again.";
  if (code === "email_address_not_authorized" || code === "email_provider_disabled" || code === "signup_disabled") return "Email access is unavailable right now. Please contact the club for help.";
  if (code === "email_not_confirmed") return "Please verify your email before logging in. You can request a new verification email below.";
  return "We couldn’t complete that request. Check your details and try again. If you already have an account, log in or reset your password.";
}
export function EmailAuthForm({ initialMode = "login", headingLevel = 1 }: { initialMode?: AuthMode; headingLevel?: 1 | 2 }) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const viewer = useBrowserViewer();
  const configurationReady = isSupabaseConfigured() && Boolean(CAPTCHA_SITE_KEY);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState<"signup" | "recovery" | null>(null);
  const [notice, setNotice] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [token, setToken] = useState("");
  const [captchaRound, setCaptchaRound] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const deadline = useRef(0);
  const [canResend, setCanResend] = useState(false);
  useEffect(() => {
    try { deadline.current = Number(sessionStorage.getItem(cooldownKey)) || 0; } catch { /* private browsing */ }
    const tick = () => setSeconds(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)));
    tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer);
  }, []);
  function coolDown() {
    deadline.current = Date.now() + 60000; setSeconds(60);
    try { sessionStorage.setItem(cooldownKey, String(deadline.current)); } catch { /* memory fallback */ }
  }
  function resetCaptcha() { setToken(""); setCaptchaRound((round) => round + 1); }
  function changeMode(next: AuthMode) { if (lock.current) return; setMode(next); setSent(null); setNotice(""); setErrors({}); setCanResend(false); resetCaptcha(); }
  function destination() { return safeAuthDestination(new URLSearchParams(window.location.search).get("next"), "/account/"); }
  async function request(resend = false, form?: FormData) {
    if (lock.current || !configurationReady) return;
    setNotice(""); setErrors({});
    const address = (form ? String(form.get("email") ?? "") : email).trim();
    setEmail(address);
    const password = String(form?.get("password") ?? "");
    let validation: Record<string, string> = validEmail(address) ? {} : { email: "Enter a valid email address." };
    const details = { first_name: String(form?.get("first_name") ?? "").trim(), surname: String(form?.get("surname") ?? "").trim(), age: String(form?.get("age") ?? "").trim(), nationality: String(form?.get("nationality") ?? ""), gender: String(form?.get("gender") ?? "") };
    if (!resend && mode === "register") validation = validateRegistration({ ...details, email: address, password, confirmation: String(form?.get("confirmation") ?? ""), agreement: form?.get("agreement") === "on" } satisfies RegistrationFields);
    if (!resend && mode === "login" && !password) validation.password = "Enter your password.";
    if (Object.keys(validation).length) { setErrors(validation); setNotice("Please check the highlighted fields."); return; }
    if ((resend || mode === "forgot" || mode === "verify") && seconds > 0) { setNotice(`Please wait ${seconds} seconds before requesting another email.`); return; }
    const client = getSupabaseBrowserClient();
    if (!client) { setNotice("Member access needs browser storage. Allow storage for this site, or try another browser."); return; }
    if (!CAPTCHA_SITE_KEY || !token) { setNotice("Please complete the security check before continuing."); return; }
    lock.current = true; setBusy(true);
    try {
      if (resend || mode === "forgot" || mode === "verify") {
        coolDown();
        const recovery = sent === "recovery" || (!resend && mode === "forgot");
        const result = recovery
          ? await client.auth.resetPasswordForEmail(address, { redirectTo: authCallbackUrl("/reset-password/"), captchaToken: token })
          : await client.auth.resend({ type: "signup", email: address, options: { emailRedirectTo: authCallbackUrl(destination()), captchaToken: token } });
        if (result.error) { setNotice(authError(result.error.code, result.error.status)); return; }
        setSent(recovery ? "recovery" : "signup"); setNotice("If this address is eligible, a new email is on its way. Check your spam folder too."); return;
      }
      if (mode === "register") {
        const { data, error } = await client.auth.signUp({ email: address, password, options: { captchaToken: token, emailRedirectTo: authCallbackUrl(destination()), data: { ...details, age: Number(details.age), full_name: `${details.first_name} ${details.surname}`.slice(0, 80), terms_accepted: true, terms_version: TERMS_VERSION, registration_version: "gsc-email-v1" } } });
        if (error) { setNotice(authError(error.code, error.status)); return; }
        if (!data.user?.id) { setNotice("The sign-up service returned an incomplete response. Please try again or contact the club."); return; }
        // Never retain a signup session if confirmation was accidentally disabled.
        if (data.session) {
          await client.auth.signOut({ scope: "local" });
          setNotice("Email verification is unavailable right now. No verification email has been sent. Please contact the club before continuing.");
          return;
        }
        setSent("signup"); coolDown(); return;
      }
      const { data, error } = await client.auth.signInWithPassword({ email: address, password, options: { captchaToken: token } });
      if (error) { setNotice(authError(error.code, error.status)); setCanResend(error.code === "email_not_confirmed"); return; }
      if (!data.user?.email_confirmed_at) { await client.auth.signOut({ scope: "local" }); setNotice("Verify your email before accessing the member area."); setCanResend(true); return; }
      window.location.replace(destination());
    } catch { setNotice("We couldn’t reach the sign-in service. Check your connection and try again."); }
    finally { lock.current = false; setBusy(false); resetCaptcha(); }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); void request(mode === "verify", new FormData(event.currentTarget)); }
  const title = sent ? "Request received" : mode === "register" ? "Join the club" : mode === "forgot" ? "Forgot your password?" : mode === "verify" ? "Resend verification email" : "Welcome back";
  if ((initialMode === "login" || initialMode === "register") && viewer.authLoading) return <div className={styles.panel}><p role="status">Checking member access…</p></div>;
  if ((initialMode === "login" || initialMode === "register") && viewer.role !== "loggedOut") return <div className={styles.panel}><h1>You’re already signed in</h1><p className={styles.intro}>Your member space is ready.</p><Link className={styles.primary} href="/account/">Open my dashboard</Link></div>;
  return <div className={styles.panel}>
    <Image className={styles.logo} src="/gsc-logo.jpg" alt="Galstyan’s Speaking Club" width={62} height={62} />
    <span className={styles.eyebrow}>GSC member space</span><Heading id="auth-title">{title}</Heading>
    <p id="auth-description" className={styles.intro}>{sent ? `Your request was received. If ${email} is eligible, check your inbox and spam folder for a ${sent === "signup" ? "verification" : "password reset"} link. For privacy, this response does not confirm that an account was created or an email was sent.` : mode === "register" ? "Real conversations start here. Create your member account." : mode === "forgot" ? "We’ll send a secure link to help you choose a new password." : mode === "verify" ? "Enter your email and complete the security check to request a fresh verification link." : "Your community, meetups, and member profile await."}</p>
    {!configurationReady && <p className={styles.notice} role="status">{AUTH_UNAVAILABLE_MESSAGE} <Link href="/contact/">Contact the club</Link></p>}
    {!sent && <form key={mode} onSubmit={submit} noValidate className={styles.form} aria-busy={busy}>
      <fieldset disabled={busy || !configurationReady}>
        {mode === "register" && <AuthProfileFields errors={errors} />}
        <div className={styles.field}><label htmlFor="auth-email">Email address</label><input id="auth-email" name="email" type="email" autoComplete="email" required defaultValue={email} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "auth-email-error" : undefined} />{errors.email && <small id="auth-email-error" className={styles.error}>{errors.email}</small>}</div>
        {(mode === "register" || mode === "login") && <AuthPasswordInput name="password" label="Password" autoComplete={mode === "login" ? "current-password" : "new-password"} error={errors.password} />}
        {mode === "register" && <><AuthPasswordInput name="confirmation" label="Confirm password" error={errors.confirmation} /><label className={styles.agreement}><input name="agreement" type="checkbox" required aria-invalid={Boolean(errors.agreement)} aria-describedby={errors.agreement ? "auth-agreement-error" : undefined} /><span>I agree to the <Link href="/terms/#current-policy" target="_blank" rel="noreferrer">Terms of Service</Link> and <Link href="/privacy/#current-policy" target="_blank" rel="noreferrer">Privacy Policy</Link>.</span></label>{errors.agreement && <small id="auth-agreement-error" className={styles.error}>{errors.agreement}</small>}</>}
      </fieldset>
      {configurationReady && <AuthCaptcha key={captchaRound} onToken={setToken} />}
      <button className={styles.primary} type="submit" disabled={busy || !configurationReady || !token}>{busy ? "Please wait…" : mode === "register" ? "Sign Up" : mode === "login" ? "Log In" : mode === "verify" ? "Send verification email" : "Send reset link"}</button>
    </form>}
    {sent && <><p className={styles.notice}>Already joined with Google or another provider? Use <Link href="/forgot-password/">Forgot password</Link> for your existing account. This keeps your profile and club history together. Do not create a replacement account.</p><p className={styles.notice}>Links are private and single-use. Open only the most recent email.</p>{configurationReady && <AuthCaptcha key={captchaRound} onToken={setToken} />}<button className={styles.primary} type="button" onClick={() => void request(true)} disabled={busy || !configurationReady || seconds > 0 || !token}>{busy ? "Sending…" : seconds ? `Resend in ${seconds}s` : sent === "signup" ? "Resend verification email" : "Resend reset email"}</button><button type="button" className={styles.textButton} onClick={() => changeMode(mode)} disabled={busy}>Use a different email</button></>}
    {canResend && !sent && <button type="button" className={styles.textButton} onClick={() => void request(true)} disabled={busy || !configurationReady || seconds > 0 || !token}>{seconds ? `Resend in ${seconds}s` : "Resend verification email"}</button>}
    {notice && <p className={styles.notice} role="status" aria-live="polite">{notice}</p>}
    <nav className={styles.links} aria-label="Member access">{mode !== "login" || sent ? <button type="button" onClick={() => changeMode("login")} disabled={busy}>Back to Log In</button> : <><button type="button" onClick={() => changeMode("register")} disabled={busy}>New here? Sign Up</button><button type="button" onClick={() => changeMode("forgot")} disabled={busy}>Forgot password?</button><button type="button" onClick={() => changeMode("verify")} disabled={busy}>Need a new verification link?</button></>}</nav>
    <p className={styles.footer}>Secure email access · Galstyan’s Speaking Club</p>
  </div>;
}
