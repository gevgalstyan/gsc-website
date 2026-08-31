/** Branded, no-index confirmation screen for Supabase email verification links. */

"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeAuthDestination } from "@/lib/auth-redirect";
import { authenticatedLandingDestination } from "@/lib/profile-onboarding";

// ======================================================
// EMAIL/PASSWORD AUTH — CONFIRMATION LINK VALIDATION
// ======================================================
const confirmationTypes = new Set([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

const copyByType: Record<string, { title: string; description: string; action: string }> = {
  signup: {
    title: "Confirm your email",
    description: "One final step activates your Galstyan’s Speaking Club member profile.",
    action: "Confirm my email",
  },
  invite: {
    title: "Accept your invitation",
    description: "Confirm the invitation to open your Galstyan’s Speaking Club member profile.",
    action: "Accept invitation",
  },
  magiclink: {
    title: "Continue to your account",
    description: "Use this secure one-time link to sign in to your member profile.",
    action: "Sign in securely",
  },
  recovery: {
    title: "Reset your password",
    description: "Confirm this request, then choose a new password for your account.",
    action: "Continue to password reset",
  },
  email_change: {
    title: "Confirm your new email",
    description: "Confirm this change to update the email address on your member profile.",
    action: "Confirm email change",
  },
  email: {
    title: "Confirm your email",
    description: "Confirm this address to continue securely.",
    action: "Confirm my email",
  },
};

function ConfirmAuthEmailPage() {
  const params = useSearchParams();
  const tokenHash = params.get("token_hash")?.trim() ?? "";
  const type = params.get("type")?.trim() ?? "";
  const requestedNext = params.get("next")?.trim() ?? "";
  const next = type === "recovery"
    ? safeAuthDestination(requestedNext, "/reset-password")
    : safeAuthDestination(requestedNext);
  const valid = /^[A-Za-z0-9_-]{20,}$/.test(tokenHash) && confirmationTypes.has(type);
  const copy = copyByType[type] ?? copyByType.email;
  async function confirm() {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email" });
    const destination = !error && type !== "recovery" && data.user
      ? await authenticatedLandingDestination(client, data.user.id, next)
      : next;
    window.location.replace(error ? "/?authError=callback" : destination);
  }

  return (
    <main className="auth-page">
      <section className="account-card auth-confirm-card">
        <Image
          className="auth-confirm-logo"
          src="/gsc-logo.jpg"
          alt="Galstyan’s Speaking Club"
          width={64}
          height={64}
          priority
        />
        <span className="eyebrow">GSC member space</span>
        <h1>{valid ? copy.title : "This link is not valid"}</h1>
        {valid ? (
          <>
            <p>{copy.description}</p>
            <button className="button button-primary" type="button" onClick={confirm}>{copy.action}</button>
            <small>This extra click protects one-time links from email security scanners.</small>
          </>
        ) : (
          <>
            <p>The link is incomplete or has expired. Return to the club and request a new email.</p>
            <Link className="button button-primary" href="/?auth=login">Return to member access</Link>
          </>
        )}
      </section>
    </main>
  );
}

export default function ConfirmPage() {
  return <Suspense fallback={<main className="auth-page"><section className="account-card"><p>Loading secure confirmation…</p></section></main>}><ConfirmAuthEmailPage /></Suspense>;
}
