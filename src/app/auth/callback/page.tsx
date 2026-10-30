"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeAuthDestination } from "@/lib/auth-redirect";
import Link from "next/link";
import styles from "@/components/email-auth.module.css";

const debugAuth = process.env.NODE_ENV === "development";
function logCallback(event: string, detail?: unknown) {
  if (debugAuth) console.debug("[gsc:oauth-callback]", event, detail ?? "");
}

type LegacyHashSession = {
  accessToken: string;
  refreshToken: string;
};

type LegacyHashCallback = {
  hasCredentials: boolean;
  hasError: boolean;
  session: LegacyHashSession | null;
};

/**
 * Read a pre-PKCE implicit-flow callback without ever logging its credentials.
 * The caller immediately removes the fragment from the browser URL.
 */
function readLegacyHashCallback(): LegacyHashCallback {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  return {
    hasCredentials: Boolean(accessToken || refreshToken),
    hasError: params.has("error") || params.has("error_code"),
    session: accessToken && refreshToken ? { accessToken, refreshToken } : null,
  };
}

function cleanCallbackUrl() {
  // Keep `next` only long enough to calculate the safe destination. Tokens
  // and one-time codes must not remain in browser history or the address bar.
  window.history.replaceState({}, "", window.location.pathname);
}

/**
 * Static OAuth callback. The authorization code is single-use, therefore this
 * component intentionally guards the exchange across React rerenders/remounts.
 */
function AuthCallbackPage() {
  const params = useSearchParams();
  const started = useRef(false);
  const [message, setMessage] = useState("Completing secure sign-in…");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const client = getSupabaseBrowserClient();
    const code = params.get("code");
    const next = safeAuthDestination(params.get("next"), "/account/");
    const legacyHashCallback = readLegacyHashCallback();
    // A fragment is never useful to the rendered callback page. Remove it as
    // soon as it has been read, even if an existing session ultimately wins.
    cleanCallbackUrl();
    logCallback("loaded", {
      path: window.location.pathname,
      codePresent: Boolean(code),
      legacyHashSessionPresent: Boolean(legacyHashCallback.session),
    });

    void (async () => {
      try {
        if (!client) { setMessage("Member access is not configured."); return; }
        if (params.has("error") || params.has("error_code") || legacyHashCallback.hasError) { setMessage("This sign-in link is invalid or has expired."); return; }

        const before = await client.auth.getSession();
        logCallback("session-before", { exists: Boolean(before.data.session) });

        let session = before.data.session;
        if (legacyHashCallback.session) {
          logCallback("legacy-hash-recovery-started");
          const { data, error } = await client.auth.setSession({
            access_token: legacyHashCallback.session.accessToken,
            refresh_token: legacyHashCallback.session.refreshToken,
          });
          const afterLegacyRecovery = await client.auth.getSession();
          if (error || !data.session) { setMessage("This sign-in link is invalid or has expired."); return; }
          session = data.session ?? afterLegacyRecovery.data.session;
          logCallback("legacy-hash-recovery-complete", {
            success: !error,
            hasSession: Boolean(session),
          });
        }

        if (!code) {
          if (session?.user.email_confirmed_at) {
            logCallback("redirect-existing-session");
            cleanCallbackUrl();
            window.location.replace(next.startsWith("/reset-password") ? "/reset-password/" : `/auth/verified/?next=${encodeURIComponent(next)}`);
          } else {
            setMessage("This sign-in link is invalid or has expired.");
          }
          return;
        }

        logCallback("pkce-exchange-started");
        const { data, error } = await client.auth.exchangeCodeForSession(code);
        logCallback("exchange-complete", { success: !error, hasSession: Boolean(data.session), errorCode: error?.code });
        const after = await client.auth.getSession();
        logCallback("session-after", { exists: Boolean(after.data.session) });

        // An existing session must never hide an invalid or expired one-time code.
        if (!error && data.session && after.data.session) {
          cleanCallbackUrl();
          const userId = (data.session ?? after.data.session)?.user.id;
          if (!(data.session ?? after.data.session)?.user.email_confirmed_at) { await client.auth.signOut({ scope: "local" }); setMessage("Verify your email before accessing the member area."); return; }
          window.location.replace(userId ? next.startsWith("/reset-password") ? "/reset-password/" : `/auth/verified/?next=${encodeURIComponent(next)}` : "/login/");
          return;
        }
        setMessage("This sign-in link is invalid or has expired.");
      } catch { setMessage("We couldn’t complete sign-in. Please request a new email and try again."); }
    })();
  // Params are read once: an OAuth code must never be exchanged twice.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <main className={styles.page}><section className={styles.panel}><h1>Secure member access</h1><p className={styles.intro} role="status">{message}</p><Link className={styles.textButton} href="/login/">Log In</Link><Link className={styles.textButton} href="/forgot-password/">Request a new password reset link</Link><Link className={styles.textButton} href="/verify-email/">Request a new verification email</Link></section></main>;
}

export default function CallbackPage() {
  return <Suspense fallback={<main className="auth-page"><section className="account-card"><p>Completing secure sign-in…</p></section></main>}><AuthCallbackPage /></Suspense>;
}
