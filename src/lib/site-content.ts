import { createClient } from "@/lib/supabase/server";

export async function getPublicContent() {
  const supabase = await createClient();
  if (!supabase) return {} as Record<string, string>;
  try {
    const { data, error } = await supabase.from("site_content").select("key,value").eq("is_public", true);
    if (error || !data) return {} as Record<string, string>;
    return Object.fromEntries(data.map((row) => [row.key, row.value]));
  } catch {
    return {} as Record<string, string>;
  }
}
