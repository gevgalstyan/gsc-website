import type { CategoryFilter, DifficultyFilter } from "@/lib/questions";

export type QuestionDeckSyncState = {
  currentQuestionId: string | null;
  category: CategoryFilter;
  difficulty: DifficultyFilter;
  favoritesOnly: boolean;
  updatedAt: string;
};

export type InitialQuestionSyncState = {
  userId: string;
  seen: string[];
  favorites: string[];
  deckState: QuestionDeckSyncState | null;
};
