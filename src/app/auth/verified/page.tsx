"use client";
import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeAuthDestination } from "@/lib/auth-redirect";
import styles from "@/components/email-auth.module.css";
function VerifiedEmail() {
  const params = useSearchParams(); const [state, setState] = useState<"checking" | "verified" | "error">("checking");
  useEffect(() => {
    let active = true;
    void (async () => { try { const result = await getSupabaseBrowserClient()?.auth.getUser(); if (active) setState(result?.data.user?.email_confirmed_at && !result.error ? "verified" : "error"); } catch { if (active) setState("error"); } })();
    return () => { active = false; };
  }, []);
  return <main className={styles.page}><section className={styles.panel}><Image className={styles.logo} src="/gsc-logo.jpg" alt="Galstyan’s Speaking Club" width={62} height={62} /><span className={styles.eyebrow}>GSC member space</span><h1>{state === "verified" ? "Email verified" : state === "checking" ? "Checking your email…" : "Verification needed"}</h1><p className={styles.intro} role="status">{state === "verified" ? "You’re all set. Welcome to Galstyan’s Speaking Club!" : state === "checking" ? "Confirming your secure session." : "We couldn’t confirm a verified session. Log in or request another verification email."}</p><Link className={styles.primary} href={state === "verified" ? safeAuthDestination(params.get("next"), "/account/") : "/login/"}>{state === "verified" ? "Open my member dashboard" : "Log In"}</Link></section></main>;
}
export default function Page() { return <Suspense fallback={<main className={styles.page}>Checking verification…</main>}><VerifiedEmail /></Suspense>; }
