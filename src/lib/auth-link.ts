/** Classify Auth links without logging credentials or guessing absent credentials. */
export const EMAIL_LINK_TYPES = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;
export type EmailLinkType = typeof EMAIL_LINK_TYPES[number];
export function isEmailLinkType(value: string): value is EmailLinkType {
  return EMAIL_LINK_TYPES.some((type) => type === value);
}
export function validTokenHash(value: string) { return /^[A-Za-z0-9_-]{20,512}$/.test(value); }
export function authLinkFailure(code?: string, status?: number) {
  if (code === "pkce_code_verifier_not_found" || code === "bad_code_verifier") return "This link needs the browser where you started signing up or resetting your password. Open it there, or request a fresh email. Clearing browser storage or switching from a mail app to Safari can also cause this.";
  if (code === "otp_expired" || code === "flow_state_expired" || code === "flow_state_not_found") return "This link has expired or has already been used. If you already verified your email, log in. Otherwise, request a fresh email and open only the newest link.";
  if (code === "access_denied") return "The sign-in request was not approved. Try again or request a fresh email.";
  if (status && status >= 500) return "The sign-in service is temporarily unavailable. Please try again later. We could not confirm the result.";
  return "We could not complete this link. It may be incomplete, no longer valid, or already used. Request a fresh email, or log in if you have already verified your account.";
}
