"use client";

/** A compact, locally dismissible first-member checklist. It never changes member data. */

import Link from "next/link";
import { CheckCircle2, X } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";

type MemberOnboardingProps = {
  userId: string;
  profileComplete: boolean;
  hasExploredQuestions: boolean;
  hasBookedMeetup: boolean;
  hasAttendedMeetup: boolean;
};

export function MemberOnboarding({
  userId,
  profileComplete,
  hasExploredQuestions,
  hasBookedMeetup,
  hasAttendedMeetup,
}: MemberOnboardingProps) {
  const storageKey = `gsc-member-onboarding-dismissed:${userId}`;
  const [dismissedByUser, setDismissedByUser] = useState(false);
  const storedDismissal = useSyncExternalStore(
    () => () => undefined,
    () => window.localStorage.getItem(storageKey) === "true",
    () => false,
  );
  const dismissed = dismissedByUser || storedDismissal;

  const steps = useMemo(() => [
    { label: "Complete your profile", href: "#settings", complete: profileComplete },
    { label: "Browse conversation questions", href: "/questions", complete: hasExploredQuestions },
    { label: "Explore upcoming meetups", href: "/meetups", complete: hasBookedMeetup },
    { label: "Join your first meetup", href: "/meetups", complete: hasAttendedMeetup },
  ], [hasAttendedMeetup, hasBookedMeetup, hasExploredQuestions, profileComplete]);
  const completed = steps.filter((step) => step.complete).length;

  if (dismissed || completed === steps.length) return null;

  function dismiss() {
    window.localStorage.setItem(storageKey, "true");
    setDismissedByUser(true);
  }

  return <section className="member-onboarding" aria-labelledby="member-onboarding-title">
    <div className="member-onboarding-heading">
      <div>
        <p className="dashboard-kicker">Getting started</p>
        <h2 id="member-onboarding-title">Make your member space yours</h2>
        <p>{completed} of {steps.length} essentials complete. Pick up wherever feels useful.</p>
      </div>
      <button type="button" onClick={dismiss} aria-label="Dismiss getting started checklist"><X size={18} /></button>
    </div>
    <ul>
      {steps.map((step) => <li key={step.label} className={step.complete ? "complete" : undefined}>
        <CheckCircle2 aria-hidden="true" size={18} />
        {step.complete ? <span>{step.label}</span> : <Link href={step.href}>{step.label}</Link>}
      </li>)}
    </ul>
  </section>;
}
