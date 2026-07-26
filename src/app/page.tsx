import { HomePage } from "@/components/home-page";
import { createClient } from "@/lib/supabase/server";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  return <HomePage initialAuthOpen={typeof params.auth === "string" && !claims?.claims?.sub} authenticated={Boolean(claims?.claims?.sub)} />;
}
