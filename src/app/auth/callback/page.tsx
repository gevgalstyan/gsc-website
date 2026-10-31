"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeAuthDestination } from "@/lib/auth-redirect";
import { authLinkFailure } from "@/lib/auth-link";
import { EmailLinkConfirmation } from "@/components/email-link-confirmation";
import styles from "@/components/email-auth.module.css";

function BrowserCallback() {
  const params = useSearchParams();
  // Token-hash links work on either static route, without a browser-local PKCE verifier.
  const [link] = useState(() => ({ tokenHash: params.get("token_hash"), type: params.get("type") ?? "", next: params.get("next"), code: params.get("code"), error: params.get("error_code") ?? params.get("error") }));
  return link.tokenHash !== null ? <EmailLinkConfirmation tokenHash={link.tokenHash} type={link.type} next={link.next} /> : <SessionCallback link={link} />;
}
function SessionCallback({ link }: { link: { next: string | null; code: string | null; error: string | null } }) {
  const started = useRef(false);
  const [message, setMessage] = useState("Completing secure sign-in…");
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token"); const refreshToken = hash.get("refresh_token");
    const errorCode = link.error ?? hash.get("error_code") ?? hash.get("error");
    const recovery = hash.get("type") === "recovery";
    const next = safeAuthDestination(link.next, recovery ? "/reset-password/" : "/account/");
    window.history.replaceState({}, "", window.location.pathname);
    void (async () => {
      try {
        const client = getSupabaseBrowserClient();
        if (!client) { setMessage("Member access is unavailable in this browser. Allow storage for this site or try another browser."); return; }
        if (errorCode) { setMessage(authLinkFailure(errorCode)); return; }
        if ((accessToken && !refreshToken) || (!accessToken && refreshToken)) { setMessage("This link is incomplete. Open the full link from your email or request a fresh email."); return; }
        let result;
        if (link.code) {
          result = await client.auth.exchangeCodeForSession(link.code);
        } else if (accessToken && refreshToken) {
          result = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        } else {
          // An authenticated member may return here, but an empty link is not evidence of verification.
          setMessage("This page has no sign-in details. Log in if your email is already verified, or request a fresh email."); return;
        }
        if (result.error) { setMessage(authLinkFailure(result.error.code, result.error.status)); return; }
        if (!result.data.session) { setMessage("The link did not establish a session. Please log in or request a fresh email."); return; }
        // Ask Auth for the trusted current user; do not rely solely on stored session claims.
        const verified = await client.auth.getUser();
        if (verified.error || !verified.data.user?.email_confirmed_at) { setMessage("We could not confirm a verified account. Log in or request a new verification email."); return; }
        window.location.replace(next.startsWith("/reset-password") || recovery ? "/reset-password/" : `/auth/verified/?next=${encodeURIComponent(next)}`);
      } catch { setMessage("We couldn’t complete sign-in. Check your connection and request a fresh email if needed."); }
    })();
  }, [link]);
  return <main className={styles.page}><section className={styles.panel}><h1>Secure member access</h1><p className={styles.intro} role="status">{message}</p><Link className={styles.textButton} href="/login/">Log In</Link><Link className={styles.textButton} href="/forgot-password/">Request a new password reset link</Link><Link className={styles.textButton} href="/verify-email/">Request a new verification email</Link></section></main>;
}
export default function Page() { return <Suspense fallback={<main>Completing secure sign-in…</main>}><BrowserCallback /></Suspense>; }
