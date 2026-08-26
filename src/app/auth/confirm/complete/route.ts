/** Verifies Supabase email tokens submitted by the branded confirmation page. */

import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const confirmationTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

// ======================================================
// EMAIL/PASSWORD AUTH — TOKEN CONFIRMATION
// ======================================================
export async function POST(request: Request) {
  const formData = await request.formData();
  const tokenHash = String(formData.get("token_hash") ?? "").trim();
  const rawType = String(formData.get("type") ?? "").trim() as EmailOtpType;
  const requestedNext = String(formData.get("next") ?? "").trim();
  const next = requestedNext.startsWith("/") && !requestedNext.startsWith("//")
    ? requestedNext
    : rawType === "recovery"
      ? "/reset-password"
      : "/account";
  const origin = new URL(request.url).origin;

  if (!/^[A-Za-z0-9_-]{20,}$/.test(tokenHash) || !confirmationTypes.has(rawType)) {
    return NextResponse.redirect(new URL("/?authError=callback", origin), 303);
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/?authError=configuration", origin), 303);
  }

  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType });
  if (error) {
    return NextResponse.redirect(new URL("/?authError=callback", origin), 303);
  }

  return NextResponse.redirect(new URL(next, origin), 303);
}
