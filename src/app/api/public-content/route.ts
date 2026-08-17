import { NextResponse } from "next/server";
import { getPublishedMeetups } from "@/lib/public-content";
import { getPublicContent } from "@/lib/site-content";

export const revalidate = 60;

export async function GET() {
  const [meetups, content] = await Promise.all([
    getPublishedMeetups(),
    getPublicContent(),
  ]);

  return NextResponse.json(
    { meetups, content },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
