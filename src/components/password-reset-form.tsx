"use client";

/** Lets a recovery-session user choose and save a new Supabase Auth password. */
import { FormEvent, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// ======================================================
// EMAIL/PASSWORD AUTH — PASSWORD RECOVERY
// ======================================================
export function PasswordResetForm() {
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error" | "success"; message?: string }>({ kind: "idle" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (password.length < 8) return setStatus({ kind: "error", message: "Use at least 8 characters." });
    if (password !== confirmation) return setStatus({ kind: "error", message: "Passwords do not match." });
    setStatus({ kind: "loading" });
    const client = getSupabaseBrowserClient();
    if (!client) return setStatus({ kind: "error", message: "Password reset is temporarily unavailable." });
    const { error } = await client.auth.updateUser({ password });
    if (error) return setStatus({ kind: "error", message: "We couldn’t update your password. Please request a new reset link and try again." });
    setStatus({ kind: "success", message: "Password updated. Returning to the club…" });
    setTimeout(() => window.location.replace("/"), 700);
  }
  return <form className="account-form" onSubmit={submit} aria-busy={status.kind === "loading"}><label>New password<input name="password" type="password" minLength={8} autoComplete="new-password" required /></label><label>Confirm password<input name="confirmation" type="password" minLength={8} autoComplete="new-password" required /></label><button className="button button-primary" disabled={status.kind === "loading"}>{status.kind === "loading" ? "Updating…" : "Update password"}</button>{status.message && <p className={`form-status ${status.kind}`} role="status">{status.message}</p>}</form>;
}
