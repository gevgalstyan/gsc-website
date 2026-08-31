"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const debugAuth = process.env.NODE_ENV === "development";
function logCallback(event: string, detail?: unknown) {
  if (debugAuth) console.debug("[gsc:oauth-callback]", event, detail ?? "");
}

function destination(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
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
    const next = destination(params.get("next"));
    logCallback("loaded", { path: window.location.pathname, codePresent: Boolean(code), exchangeStarted: Boolean(code) });

    void (async () => {
      if (!client) { setMessage("Member access is not configured."); return; }

      const before = await client.auth.getSession();
      logCallback("session-before", { exists: Boolean(before.data.session) });
      if (!code) {
        if (before.data.session) {
          logCallback("redirect-existing-session");
          window.location.replace(next);
        } else {
          setMessage("This sign-in link is invalid or has expired.");
        }
        return;
      }

      const { data, error } = await client.auth.exchangeCodeForSession(code);
      logCallback("exchange-complete", { success: !error, hasSession: Boolean(data.session), error: error?.message });
      const after = await client.auth.getSession();
      logCallback("session-after", { exists: Boolean(after.data.session) });

      // A successful exchange can establish storage before a transient return
      // error is observed. A usable session always wins over the expired-code UI.
      if (!error || data.session || after.data.session) {
        window.history.replaceState({}, "", window.location.pathname);
        window.location.replace(next);
        return;
      }
      setMessage("This sign-in link is invalid or has expired.");
    })();
  // Params are read once: an OAuth code must never be exchanged twice.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <main className="auth-page"><section className="account-card"><h1>Member access</h1><p role="status">{message}</p></section></main>;
}

export default function CallbackPage() {
  return <Suspense fallback={<main className="auth-page"><section className="account-card"><p>Completing secure sign-in…</p></section></main>}><AuthCallbackPage /></Suspense>;
}
