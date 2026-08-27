import { QuestionDeck } from "@/components/question-deck";
import { PublicPageShell } from "@/components/public-page-shell";
import { questions, type CategoryFilter, type DifficultyFilter } from "@/lib/questions";
import { getManagedQuestions } from "@/lib/managed-questions";
import { editablePageMetadata, getPublicContent } from "@/lib/site-content";
import type { InitialQuestionSyncState } from "@/lib/question-sync";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export const generateMetadata = () => editablePageMetadata("questions", "English Conversation Questions", "Explore Galstyan’s Speaking Club’s conversation-question library by category and English level, with random prompts, translations, favorites, and progress.", "/questions");

export default async function QuestionsPage() {
  const [managedQuestions, content, initialSyncState] = await Promise.all([getManagedQuestions(), getPublicContent(), getInitialQuestionSyncState()]);
  return <PublicPageShell eyebrow="Question library" title="Find a question. Start a conversation." intro={content["questions.intro"] || `The GSC library contains ${(questions.length + managedQuestions.length).toLocaleString()} conversation prompts across 20 categories and three English levels. Draw one for practice or bring it to the table.`} breadcrumbLabel="Questions" breadcrumbPath="/questions"><QuestionDeck showPageLink={false} additionalQuestions={managedQuestions} initialSyncState={initialSyncState} /></PublicPageShell>;
}

async function getInitialQuestionSyncState(): Promise<InitialQuestionSyncState | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return null;
  const [progressResult, favoritesResult, deckStateResult] = await Promise.all([
    supabase.from("question_progress").select("question_id").eq("user_id", userId),
    supabase.from("question_favorites").select("question_id").eq("user_id", userId).eq("is_favorite", true),
    supabase.from("question_deck_state").select("current_question_id,category_filter,difficulty_filter,favorites_only,updated_at").eq("user_id", userId).maybeSingle(),
  ]);
  if (progressResult.error || favoritesResult.error || deckStateResult.error) return null;
  const validIds = new Set(questions.map((question) => question.id));
  const validCategories = new Set(questions.map((question) => question.category));
  const deckRow = deckStateResult.data;
  return {
    userId,
    seen: uniqueValidIds((progressResult.data ?? []).map((row) => row.question_id), validIds),
    favorites: uniqueValidIds((favoritesResult.data ?? []).map((row) => row.question_id), validIds),
    deckState: deckRow ? {
      currentQuestionId: deckRow.current_question_id && validIds.has(deckRow.current_question_id) ? deckRow.current_question_id : null,
      category: deckRow.category_filter === "all" || validCategories.has(deckRow.category_filter) ? deckRow.category_filter as CategoryFilter : "all",
      difficulty: deckRow.difficulty_filter === "beginner" || deckRow.difficulty_filter === "intermediate" || deckRow.difficulty_filter === "advanced" ? deckRow.difficulty_filter as DifficultyFilter : "all",
      favoritesOnly: Boolean(deckRow.favorites_only),
      updatedAt: deckRow.updated_at,
    } : null,
  };
}

function uniqueValidIds(ids: string[], validIds: Set<string>) {
  return [...new Set(ids.filter((id) => validIds.has(id)))];
}
