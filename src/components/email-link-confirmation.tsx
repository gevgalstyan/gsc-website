"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeAuthDestination } from "@/lib/auth-redirect";
import { authLinkFailure, isEmailLinkType, validTokenHash } from "@/lib/auth-link";
import styles from "./email-auth.module.css";

/** No verification on mount: email-preview GETs must never consume a one-time token. */
export function EmailLinkConfirmation({ tokenHash, type, next }: { tokenHash: string; type: string; next: string | null }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const lock = useRef(false);
  const recovery = type === "recovery" || type === "invite";
  const valid = validTokenHash(tokenHash) && isEmailLinkType(type);
  useEffect(() => { window.history.replaceState({}, "", window.location.pathname); }, []);
  async function confirm() {
    if (!valid || !isEmailLinkType(type) || lock.current || finished) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) { setMessage("Member access is unavailable in this browser. Allow storage for this site or try another browser."); return; }
      const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
      if (error) { setMessage(authLinkFailure(error.code, error.status)); return; }
      // Secure email changes may require confirmation from BOTH addresses.
      if (type === "email_change" && !data.session) {
        setFinished(true); setMessage("Your confirmation was recorded. If another confirmation is required, open the email sent to your other address. Otherwise, log in with your confirmed address."); return;
      }
      if (!data.session || !data.user?.email_confirmed_at) { setMessage("We could not establish a verified session. Log in if you already verified your email, or request a fresh email."); return; }
      window.location.replace(recovery ? "/reset-password/" : `/auth/verified/?next=${encodeURIComponent(safeAuthDestination(next, "/account/"))}`);
    } catch { setMessage("We couldn’t reach the verification service. Check your connection and try again. Your email may already be verified; you can also try logging in."); }
    finally { lock.current = false; setBusy(false); }
  }
  const heading = !valid ? "Verification link incomplete" : type === "recovery" ? "Reset your password" : type === "email_change" ? "Confirm email change" : type === "invite" ? "Accept your invitation" : type === "magiclink" ? "Sign in securely" : "Verify your email";
  return <main className={styles.page}><section className={styles.panel}>
    <Image className={styles.logo} src="/gsc-logo.jpg" alt="Galstyan’s Speaking Club" width={62} height={62} />
    <span className={styles.eyebrow}>GSC member space</span><h1>{heading}</h1>
    <p className={styles.intro}>{valid ? "Confirm below to continue securely. Opening or previewing this page does not use your one-time link." : "The link is missing valid verification details. Copy the complete link from your email, or request a fresh email."}</p>
    {valid && !finished && <button type="button" className={styles.primary} disabled={busy} onClick={() => void confirm()}>{busy ? "Verifying…" : type === "recovery" ? "Continue to reset password" : type === "email_change" ? "Confirm email change" : type === "magiclink" ? "Sign In" : type === "invite" ? "Accept invitation" : "Verify Email"}</button>}
    {message && <p className={styles.notice} role="status">{message}</p>}
    <Link className={styles.textButton} href={recovery ? "/forgot-password/" : "/verify-email/"}>{recovery ? "Request a new reset email" : "Request a new verification email"}</Link>
    <Link className={styles.textButton} href="/login/">Log In</Link>
  </section></main>;
}
