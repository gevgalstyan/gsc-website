/** Browser-only Supabase client for interactive auth, uploads, and member mutations. */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { fetchWithTimeout } from "@/lib/supabase/fetch";

type BrowserClient = SupabaseClient;
let browserClient: BrowserClient | null | undefined;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

// ======================================================
// SUPABASE BROWSER CLIENT
// ======================================================
export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    browserClient = null;
    return browserClient;
  }

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
      storage: window.localStorage,
    },
  });
  return browserClient;
}
