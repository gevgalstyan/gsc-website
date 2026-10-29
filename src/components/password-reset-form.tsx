"use client";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthPasswordInput } from "./auth-password-input";
import styles from "./email-auth.module.css";
export function PasswordResetForm() {
  const [status, setStatus] = useState("Checking your secure link…");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lock = useRef(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const client = getSupabaseBrowserClient();
        const result = await client?.auth.getUser();
        if (!active) return;
        if (!result?.data.user?.email_confirmed_at || result.error) { setStatus("This reset link is invalid or expired. Please request a new one."); return; }
        setReady(true); setStatus("");
      } catch { if (active) setStatus("We couldn’t check your link. Please try again or request a new one."); }
    })();
    return () => { active = false; };
  }, []);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (lock.current) return;
    const form = new FormData(event.currentTarget); const password = String(form.get("password") ?? "");
    const nextErrors: Record<string, string> = {};
    if (password.length < 8) nextErrors.password = "Use at least 8 characters.";
    if (password !== form.get("confirmation")) nextErrors.confirmation = "Passwords do not match.";
    setErrors(nextErrors); if (Object.keys(nextErrors).length) return;
    lock.current = true; setBusy(true); setStatus("");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error();
      const { error } = await client.auth.updateUser({ password });
      if (error) throw error;
      await client.auth.signOut({ scope: "local" });
      setDone(true); setStatus("Your password has been updated. You can now log in with your new password.");
    } catch { setStatus("We couldn’t update your password. The link may have expired; request a new reset email and try again."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <>{ready && !done && <form className={styles.form} onSubmit={submit} noValidate aria-busy={busy}><fieldset disabled={busy}><AuthPasswordInput name="password" label="New password" error={errors.password} /><AuthPasswordInput name="confirmation" label="Confirm password" error={errors.confirmation} /></fieldset><button className={styles.primary} disabled={busy}>{busy ? "Updating…" : "Update password"}</button></form>}{status && <p className={done ? styles.success : styles.notice} role="status">{status}</p>}<Link className={styles.textButton} href={done ? "/login/" : "/forgot-password/"}>{done ? "Log In" : "Request a new reset link"}</Link></>;
}
