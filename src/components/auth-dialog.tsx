"use client";
import { LockKeyhole, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/auth-redirect";
type Mode = "login" | "register" | "forgot";
type Notice = { kind: "error" | "success"; text: string } | null;
const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";
const telegramEnabled = process.env.NEXT_PUBLIC_TELEGRAM_AUTH_ENABLED === "true";

export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("login"); const [notice, setNotice] = useState<Notice>(null); const [loading, setLoading] = useState(false); const [googleLoading, setGoogleLoading] = useState(false);
  const dialogRef = useRef<HTMLElement>(null); const closeRef = useRef<HTMLButtonElement>(null); const router = useRouter();
  function close() { setNotice(null); setLoading(false); setGoogleLoading(false); onClose(); }
  useEffect(() => {
    if (!open) return; const previous = document.activeElement as HTMLElement | null; const overflow = document.body.style.overflow; document.body.style.overflow = "hidden"; closeRef.current?.focus();
    function onKey(event: KeyboardEvent) { if (event.key === "Escape") return close(); if (event.key !== "Tab" || !dialogRef.current) return; const items = dialogRef.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])'); if (!items.length) return; const first = items[0], last = items[items.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
    window.addEventListener("keydown", onKey); return () => { document.body.style.overflow = overflow; window.removeEventListener("keydown", onKey); previous?.focus(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  function changeMode(next: Mode) { setMode(next); setNotice(null); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setNotice(null); setLoading(true); const form = new FormData(event.currentTarget); const email = String(form.get("email") ?? "").trim(); const password = String(form.get("password") ?? ""); const client = getSupabaseBrowserClient();
    if (!client) { setLoading(false); setNotice({ kind: "error", text: "Member access is being configured. Please join us on Telegram for announcements." }); return; }
    if (mode === "forgot") { const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: authCallbackUrl("/reset-password") }); setLoading(false); setNotice(error ? { kind: "error", text: error.message } : { kind: "success", text: "If an account exists, a password-reset email is on its way." }); return; }
    if (password.length < 8) { setLoading(false); setNotice({ kind: "error", text: "Use at least 8 characters for your password." }); return; }
    if (mode === "register") { const displayName = String(form.get("display_name") ?? "").trim(); const { data, error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: authCallbackUrl(), data: { full_name: displayName } } }); setLoading(false); setNotice(error ? { kind: "error", text: error.message } : data.session ? { kind: "success", text: "Account created. Opening your profile…" } : { kind: "success", text: "Check your email to confirm your account." }); if (data.session) setTimeout(() => { close(); router.push("/account"); router.refresh(); }, 500); return; }
    const { error } = await client.auth.signInWithPassword({ email, password }); setLoading(false); if (error) return setNotice({ kind: "error", text: error.message }); close(); router.push("/account"); router.refresh();
  }
  async function googleLogin() {
    setLoading(true); setGoogleLoading(true); setNotice(null); const client = getSupabaseBrowserClient();
    if (!client) { setLoading(false); setGoogleLoading(false); setNotice({ kind: "error", text: "Member access is being configured. Please join us on Telegram for announcements." }); return; }
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: authCallbackUrl(), skipBrowserRedirect: true },
    });
    if (error || !data.url) { setLoading(false); setGoogleLoading(false); setNotice({ kind: "error", text: error?.message ?? "Google login could not be opened. Please try again." }); return; }
    window.location.assign(data.url);
  }
  if (!open) return null; const title = mode === "login" ? "Welcome back" : mode === "register" ? "Join the club" : "Reset password";
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><section ref={dialogRef} className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-description"><button ref={closeRef} className="dialog-close" onClick={close} aria-label="Close"><X /></button><div className="auth-mark"><LockKeyhole /></div><span className="eyebrow">GSC member space</span><h2 id="auth-title">{title}</h2><p id="auth-description" className="muted">{mode === "forgot" ? "Enter your email and we’ll send a secure reset link." : "Your member profile, protected by Supabase."}</p>{mode !== "forgot" && <div className="auth-tabs" role="tablist" aria-label="Authentication mode"><button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Login</button><button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Register</button></div>}<form onSubmit={submit} aria-busy={loading}>{mode === "register" && <label>Display name<input name="display_name" autoComplete="name" maxLength={80} required /></label>}<label>Email address<input name="email" type="email" autoComplete="email" required /></label>{mode !== "forgot" && <label>Password<input name="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} required /></label>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Login" : mode === "register" ? "Create account" : "Send reset link"}</button></form>{mode === "login" && <button className="auth-text-button" type="button" onClick={() => changeMode("forgot")}>Forgot password?</button>}{mode === "forgot" && <button className="auth-text-button" type="button" onClick={() => changeMode("login")}>Back to login</button>}{googleEnabled && <button className="google-button" disabled={loading} onClick={googleLogin}>{googleLoading ? "Opening Google…" : "Continue with Google"}</button>}{telegramEnabled && <button className="google-button" disabled title="Telegram OIDC integration is not yet available">Continue with Telegram</button>}{notice && <div className={`form-status ${notice.kind}`} role="status" aria-live="polite">{notice.text}</div>}<p className="privacy-note">By continuing, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p></section></div>;
}
