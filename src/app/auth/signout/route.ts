/** Clears the current Supabase session and returns the visitor to the homepage. */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ======================================================
// SESSION MANAGEMENT — LOGOUT
// ======================================================
export async function POST(request: Request) {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
