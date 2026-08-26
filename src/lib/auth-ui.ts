import type { ViewerRole } from "@/lib/viewer";

export type AuthCtaKind = "join" | "profile" | "meetup";

export function resolveAuthCta(
  kind: AuthCtaKind,
  role: ViewerRole,
  options: {
    loggedOutLabel?: string;
    loggedOutHref?: string;
    adminDestination?: "account" | "admin";
  } = {},
) {
  if (role === "loggedOut") {
    const defaults = kind === "meetup"
      ? { label: "Sign in to book", href: "/?auth=login" }
      : kind === "profile"
        ? { label: "Create your profile", href: "/?auth=register" }
        : { label: "Join the club", href: "/?auth=register" };
    return {
      label: options.loggedOutLabel || defaults.label,
      href: options.loggedOutHref || defaults.href,
    };
  }

  if (kind === "meetup") {
    return role === "admin"
      ? { label: "Manage meetups", href: "/admin" }
      : { label: "Book my place", href: "/meetups" };
  }

  if (role === "admin" && options.adminDestination === "admin") {
    return { label: "Admin dashboard", href: "/admin" };
  }

  return kind === "profile"
    ? { label: "View my profile", href: "/account#settings" }
    : { label: "View my dashboard", href: "/account" };
}
