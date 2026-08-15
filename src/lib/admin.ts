export const ADMIN_EMAILS = new Set([
  "galstyanwork@gmail.com",
  "galstyanoff@gmail.com",
  "gevgalstyan913@gmail.com",
]);

export function isAllowlistedAdminEmail(email: string | null | undefined) {
  return Boolean(email && ADMIN_EMAILS.has(email.trim().toLowerCase()));
}
