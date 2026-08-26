/** Branded, no-index confirmation screen for Supabase email verification links. */

import Image from "next/image";
import Link from "next/link";

export const metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

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

export default async function ConfirmAuthEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string; next?: string }>;
}) {
  const params = await searchParams;
  const tokenHash = params.token_hash?.trim() ?? "";
  const type = params.type?.trim() ?? "";
  const requestedNext = params.next?.trim() ?? "";
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : type === "recovery"
      ? "/reset-password"
      : "/account";
  const valid = /^[A-Za-z0-9_-]{20,}$/.test(tokenHash) && confirmationTypes.has(type);
  const copy = copyByType[type] ?? copyByType.email;

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
            <form action="/auth/confirm/complete" method="post">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="next" value={next} />
              <button className="button button-primary" type="submit">{copy.action}</button>
            </form>
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
