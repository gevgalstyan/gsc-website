import { NextResponse } from "next/server";

/** Lightweight deployment health check: deliberately avoids auth and database work. */
export function GET() {
  return NextResponse.json(
    { status: "ok", service: "galstyans-speaking-club" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
