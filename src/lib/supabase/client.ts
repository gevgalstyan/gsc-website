import { createBrowserClient } from "@supabase/ssr";
import { fetchWithTimeout } from "@/lib/supabase/fetch";

type BrowserClient = ReturnType<typeof createBrowserClient>;
let browserClient: BrowserClient | null | undefined;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

export function getSupabaseBrowserClient() {
  if (browserClient !== undefined) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createBrowserClient(url, key, {
    global: { fetch: fetchWithTimeout },
  });
  return browserClient;
}
