/** Default closed. This application guard supplements, never replaces, provider/RLS enforcement. */
export function isPrivacyProtectionEnabled(value: string | undefined) {
  return value !== "disabled";
}
export const privacyProtectionEnabled = isPrivacyProtectionEnabled(process.env.NEXT_PUBLIC_PRIVACY_PROTECTION_MODE);
/** Used at the shared SDK transport boundary, before a request body leaves the browser. */
export function privacyRequestBlocked(pathname: string, method: string, enabled = privacyProtectionEnabled) {
  if (!enabled) return false;
  const path = pathname.replace(/\/+$/, "");
  return (path.endsWith("/auth/v1/signup") || path.endsWith("/auth/v1/otp")) || (path.endsWith("/rest/v1/meetup_bookings") && ["POST","PUT"].includes(method.toUpperCase()));
}
