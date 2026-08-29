/**
 * Public pages must remain useful when optional Supabase content is slow.
 * These deadlines only affect display data with authored fallbacks; protected
 * member/admin requests continue to use their existing authenticated flow.
 */

const PUBLIC_DATA_DEADLINE_MS = 1_500;

export async function withPublicFallback<T>(work: () => Promise<T>, fallback: T, deadline = PUBLIC_DATA_DEADLINE_MS): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work(),
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), deadline);
      }),
    ]);
  } catch {
    return fallback;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
