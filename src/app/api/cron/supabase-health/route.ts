/** Secret-protected health check used by scheduled production monitoring. */

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function json(body: { status: "healthy" | "unhealthy"; timestamp: string }, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}

// ======================================================
// API ROUTES — SUPABASE HEALTH CHECK
// ======================================================
export async function GET(request: Request) {
  const timestamp = new Date().toISOString();
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return json({ status: "unhealthy", timestamp }, 401);
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await supabase.from("meetups").select("id").limit(1);
    return error ? json({ status: "unhealthy", timestamp }, 503) : json({ status: "healthy", timestamp });
  } catch {
    return json({ status: "unhealthy", timestamp }, 503);
  }
}
