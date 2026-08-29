"use client";

/** Human-readable recovery UI for a failed private account render. */

export default function AccountError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="dashboard-shell"><section className="member-route-error" role="alert">
    <p className="dashboard-kicker">Member space</p>
    <h1>We couldn’t load your account right now.</h1>
    <p>Your data is safe. Please try again in a moment.</p>
    <button className="button button-primary" type="button" onClick={reset}>Try again</button>
  </section></main>;
}
