import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const needsSession = pathname.startsWith("/account")
    || pathname.startsWith("/admin")
    || pathname.startsWith("/auth/")
    || pathname.startsWith("/api/meetups/");

  // Public pages do not need an auth refresh. Keeping this network request out
  // of the public path prevents a slow auth service from blanking the site.
  return needsSession ? updateSession(request) : NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
