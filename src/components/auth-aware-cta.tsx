/** Reusable CTA renderer for logged-out visitors, members, and administrators. */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { resolveAuthCta, type AuthCtaKind } from "@/lib/auth-ui";
import type { ViewerRole } from "@/lib/viewer";

// ======================================================
// AUTHENTICATION — SMART CTA SYSTEM
// ======================================================
export function AuthAwareCta({
  kind,
  role,
  className = "button button-primary",
  loggedOutLabel,
  loggedOutHref,
  adminDestination,
  onLoggedOutAuth,
}: {
  kind: AuthCtaKind;
  role: ViewerRole;
  className?: string;
  loggedOutLabel?: string;
  loggedOutHref?: string;
  adminDestination?: "account" | "admin";
  onLoggedOutAuth?: () => void;
}) {
  const cta = resolveAuthCta(kind, role, { loggedOutLabel, loggedOutHref, adminDestination });
  if (role === "loggedOut" && onLoggedOutAuth) {
    return <button className={className} type="button" onClick={onLoggedOutAuth}>{cta.label} <ArrowRight /></button>;
  }
  return <Link className={className} href={cta.href}>{cta.label} <ArrowRight /></Link>;
}
