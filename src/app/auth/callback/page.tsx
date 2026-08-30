"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Suspense } from "react";

/** Static OAuth callback: Supabase stores the browser session locally. */
function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const [message, setMessage] = useState("Completing secure sign-in…");
  useEffect(() => {
    const client = getSupabaseBrowserClient();
    const next = params.get("next")?.startsWith("/") && !params.get("next")?.startsWith("//") ? params.get("next")! : "/account";
    const code = params.get("code");
    if (!client || !code) { setMessage("This sign-in link is invalid or has expired."); return; }
    client.auth.exchangeCodeForSession(code).then(({ error }: { error: Error | null }) => {
      if (error) setMessage("This sign-in link is invalid or has expired.");
      else router.replace(next);
    });
  }, [params, router]);
  return <main className="auth-page"><section className="account-card"><h1>Member access</h1><p role="status">{message}</p></section></main>;
}

export default function CallbackPage() { return <Suspense fallback={<main className="auth-page"><section className="account-card"><p>Completing secure sign-in…</p></section></main>}><AuthCallbackPage /></Suspense>; }
