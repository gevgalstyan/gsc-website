/** Retry only a known schema mismatch; never hide authorization or network failures. */
export const BASE_PROFILE_COLUMNS = "id,display_name,avatar_path,avatar_url,telegram_username,english_level,created_at";
export const PERSONAL_PROFILE_COLUMNS = "first_name,surname,age,nationality,gender,email";
export function missingProfileColumns(error: { code?: string } | null | undefined) {
  return error?.code === "42703" || error?.code === "PGRST204";
}
export function dataLoadExplanation(error: { code?: string } | null | undefined) {
  if (missingProfileColumns(error)) return "The database schema is missing fields requested by this page. Ask the owner to review the profile migration.";
  if (error?.code === "42501" || error?.code === "PGRST301") return "The database denied access. Verify your session and administrator role; permissions have not been bypassed.";
  if (error?.code === "42P01" || error?.code === "PGRST205") return "A required database table is unavailable. Ask the owner to check applied migrations.";
  return "The service could not load this data. Check your connection and retry. If it continues, contact the club.";
}
