import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host")?.split(":")[0];
  if (hostname === "www.galstyansspeakingclub.ru") {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.hostname = "galstyansspeakingclub.ru";
    return NextResponse.redirect(canonicalUrl, 308);
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
