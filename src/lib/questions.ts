import questionData from "@/data/questions.json";

export const categories = [
  "Ice Breakers",
  "Travel",
  "Funny",
  "Deep",
  "Career",
  "Movies",
  "Food",
  "Dreams",
  "Tech & AI",
  "Mindset & Habits",
  "Friendship & Relationships",
  "Would You Rather",
  "Storytelling",
  "Culture & Traditions",
  "Music",
  "Health & Lifestyle",
  "Education & Learning",
  "Nature & Environment",
  "Language & Communication",
  "Society & the Future",
] as const;

export const difficulties = ["beginner", "intermediate", "advanced"] as const;

export type Category = (typeof categories)[number];
export type Difficulty = (typeof difficulties)[number];
export type CategoryFilter = "all" | Category;
export type DifficultyFilter = "all" | Difficulty;

export type QuestionTranslations = {
  ru?: string;
};

export type Question = {
  id: string;
  category: Category;
  text: string;
  difficulty: Difficulty;
  translations?: QuestionTranslations;
};

export const difficultyLabels: Record<Difficulty, string> = {
  beginner: "Beginner — A1–A2",
  intermediate: "Intermediate — B1–B2",
  advanced: "Advanced — C1–C2",
};

export const questionBank = questionData as Record<Category, Array<Omit<Question, "category">>>;

export const questions: Question[] = categories.flatMap((category) =>
  questionBank[category].map((question) => ({ ...question, category })),
);
