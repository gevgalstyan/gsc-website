"use client";

import { Check, LockKeyhole, Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { socialLinks } from "@/lib/site-data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const MEMBER_ACCOUNTS_ENABLED = false;
const telegramUrl = socialLinks.find((social) => social.label === "Telegram")?.href ?? "";

export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const dialogRef = useRef<HTMLElement>(null);
  const configured = isSupabaseConfigured();

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMessage("");
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  function close() {
    setMessage("");
    onClose();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(configured
      ? "Supabase is configured. Live authentication will be enabled with the Phase 2 database and callback routes."
      : "Demo mode: your details were not sent or stored. Connect Supabase to enable accounts.");
  }

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <section ref={dialogRef} className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="dialog-close" onClick={close} aria-label="Close"><X /></button>
        <div className="auth-mark"><LockKeyhole /></div>
        <span className="eyebrow">GSC member space</span>
        {!MEMBER_ACCOUNTS_ENABLED ? (
          <div className="auth-coming-soon">
            <h2 id="auth-title">Member accounts are coming soon</h2>
            <p className="auth-coming-soon-lead">We’re preparing profiles, attendance tracking, badges and meetup rewards.</p>
            <p className="muted">For now, join the community through Telegram.</p>
            <a className="button button-primary auth-telegram-button" href={telegramUrl} target="_blank" rel="noopener noreferrer">
              <Send aria-hidden="true" /> Join on Telegram
            </a>
            <p className="auth-account-note">No account is required yet.</p>
          </div>
        ) : (
          <>
            <h2 id="auth-title">{mode === "login" ? "Welcome back" : "Join the club"}</h2>
            <p className="muted">{mode === "login" ? "Continue your speaking journey." : "Create your profile and be first to book."}</p>
            <div className="auth-tabs" role="tablist">
              <button role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Login</button>
              <button role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
            </div>
            <form onSubmit={submit}>
              {mode === "register" && <label>Full name<input name="name" autoComplete="name" placeholder="Your name" required /></label>}
              <label>Email address<input name="email" type="email" autoComplete="email" placeholder="you@example.com" required /></label>
              <label>Password<input name="password" type="password" minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" required /></label>
              <button className="button button-primary" type="submit">{mode === "login" ? "Continue" : "Create demo account"}</button>
            </form>
            <button className="google-button" onClick={() => setMessage("Google sign-in will activate after Supabase OAuth is configured.")}>Continue with Google</button>
            {message && <div className="demo-note" role="status"><Check />{message}</div>}
            <p className="privacy-note">No credentials are stored in demo mode. By continuing, you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.</p>
          </>
        )}
      </section>
    </div>
  );
}
