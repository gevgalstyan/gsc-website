/** Browser-safe profile completion and authenticated landing decisions. */

import type { SupabaseClient } from "@supabase/supabase-js";

export type OnboardingProfile = { onboarding_completed: boolean | null } | null;

/**
 * Legacy profiles are marked complete by the migration. New auth users receive
 * an explicit false value, so an identity-provider display name never skips the
 * welcome step by itself.
 */
export function isProfileOnboardingComplete(profile: OnboardingProfile) {
  return profile?.onboarding_completed === true;
}

export async function authenticatedLandingDestination(
  client: SupabaseClient,
  userId: string,
  requestedDestination = "/",
) {
  // An explicit, already-validated internal destination takes precedence.
  if (requestedDestination !== "/") return requestedDestination;

  const { data, error } = await client
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  // A missing profile is a recoverable first-login state. Do not strand a new
  // member on an empty dashboard if the auth bootstrap raced their first load.
  if (!error && !isProfileOnboardingComplete(data)) return "/onboarding/";
  return "/";
}
