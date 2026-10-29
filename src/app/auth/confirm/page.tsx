"use client";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeAuthDestination } from "@/lib/auth-redirect";
import styles from "@/components/email-auth.module.css";
const types = new Set(["signup", "invite", "magiclink", "recovery", "email_change", "email"]);
function ConfirmEmail() {
  const params = useSearchParams();
  // Capture once, then remove one-time credentials from browser history.
  const [link] = useState(() => ({ token: params.get("token_hash") ?? "", type: params.get("type") ?? "", next: safeAuthDestination(params.get("next"), "/account/") }));
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const lock = useRef(false);
  const valid = /^[A-Za-z0-9_-]{20,}$/.test(link.token) && types.has(link.type);
  useEffect(() => { window.history.replaceState({}, "", window.location.pathname); }, []);
  async function confirm() {
    if (!valid || lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) { setMessage("Member access is being configured. Please try again later."); return; }
      const { data, error } = await client.auth.verifyOtp({ token_hash: link.token, type: link.type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email" });
      if (error || !data.session || !data.user?.email_confirmed_at) { setMessage("This verification link is invalid or expired. Request a new email below."); return; }
      window.location.replace(link.type === "recovery" ? "/reset-password/" : `/auth/verified/?next=${encodeURIComponent(link.next)}`);
    } catch { setMessage("We couldn’t verify your email. Check your connection and try again."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <main className={styles.page}><section className={styles.panel}><Image className={styles.logo} src="/gsc-logo.jpg" alt="Galstyan’s Speaking Club" width={62} height={62} /><span className={styles.eyebrow}>GSC member space</span><h1>{valid ? link.type === "recovery" ? "Reset your password" : "Verify your email" : "Verification link not valid"}</h1><p className={styles.intro}>{valid ? "Confirm below to continue securely. This extra click protects your one-time link from email scanners." : "The link is incomplete or expired. Please request a fresh email."}</p>{valid && <button type="button" className={styles.primary} disabled={busy} onClick={() => void confirm()}>{busy ? "Verifying…" : link.type === "recovery" ? "Continue to reset password" : "Verify Email"}</button>}{message && <p className={styles.notice} role="status">{message}</p>}<Link className={styles.textButton} href={link.type === "recovery" ? "/forgot-password/" : "/verify-email/"}>Request a new email / Log In</Link></section></main>;
}
export default function Page() { return <Suspense fallback={<main className={styles.page}>Loading secure verification…</main>}><ConfirmEmail /></Suspense>; }
