/** Browser-only Supabase client for interactive auth, uploads, and member mutations. */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "@/lib/supabase/fetch";

type BrowserClient = SupabaseClient;
let browserClient: BrowserClient | null | undefined;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  );
}

// ======================================================
// SUPABASE BROWSER CLIENT
// ======================================================
export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !key) {
    browserClient = null;
    return browserClient;
  }

  // Safari/content blockers may deny storage access. Fail closed instead of
  // crashing the form or silently creating a non-persistent member session.
  let storage: Storage;
  try { storage = window.localStorage; storage.getItem("gsc:storage-check"); }
  catch { return null; }

  // Static hosting has no server cookie bridge. Keep the one canonical client
  // in browser localStorage. OAuth is always PKCE; the callback performs the
  // code exchange explicitly so no SDK instance can consume it twice.
  browserClient = createClient(url, key, {
    global: { fetch: fetchWithTimeout },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
      storage,
    },
  });
  return browserClient;
}
