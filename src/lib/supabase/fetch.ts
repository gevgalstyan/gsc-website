/** Timeout-aware network transport shared by browser and server Supabase clients. */

// ======================================================
// SUPABASE NETWORK SAFETY
// ======================================================
// Mobile wake-up, token refresh, and an upsert can legitimately take more than
// one radio round-trip. The previous 3.5s cap turned healthy slow requests into
// aborted queue entries; twelve seconds is still bounded without being brittle.
const SUPABASE_REQUEST_TIMEOUT = 12_000;

/**
 * Supabase requests must not be able to hold a page or an auth control open
 * forever. The abort also prevents a stalled mobile connection from keeping
 * the browser in a pending state after the UI has already rendered.
 */
export function fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT);
  const abortUpstream = () => controller.abort();

  if (init.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener("abort", abortUpstream, { once: true });
  }

  return fetch(input, { ...init, signal: controller.signal }).finally(() => {
    clearTimeout(timeout);
    init.signal?.removeEventListener("abort", abortUpstream);
  });
}
