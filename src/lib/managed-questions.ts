import { createClient } from "@/lib/supabase/server";
import { categories, type Question } from "@/lib/questions";

const difficultyMap = { Beginner: "beginner", Intermediate: "intermediate", Advanced: "advanced" } as const;

export async function getManagedQuestions(): Promise<Question[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase.from("managed_questions").select("id,prompt,translation,category,difficulty").eq("is_published", true).order("created_at", { ascending: false });
  if (error || !data) return [];
  return data
    .filter((row) => categories.includes(row.category as (typeof categories)[number]) && row.difficulty in difficultyMap)
    .map((row) => ({
      id: `managed-${row.id}`,
      category: row.category as Question["category"],
      text: row.prompt,
      difficulty: difficultyMap[row.difficulty as keyof typeof difficultyMap],
      ...(row.translation ? { translations: { ru: row.translation } } : {}),
    }));
}
