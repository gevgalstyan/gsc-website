import { QuestionDeck } from "@/components/question-deck";
import { PublicPageShell } from "@/components/public-page-shell";
import { questions } from "@/lib/questions";
import { getManagedQuestions } from "@/lib/managed-questions";
import { editablePageMetadata, getPublicContent } from "@/lib/site-content";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export const generateMetadata = () => editablePageMetadata("questions", "English Conversation Questions", "Explore Galstyan’s Speaking Club’s conversation-question library by category and English level, with random prompts, translations, favorites, and progress.", "/questions");

export default async function QuestionsPage() {
  const [managedQuestions, content] = await Promise.all([getManagedQuestions(), getPublicContent()]);
  return <PublicPageShell eyebrow="Question library" title="Find a question. Start a conversation." intro={content["questions.intro"] || `The GSC library contains ${(questions.length + managedQuestions.length).toLocaleString()} conversation prompts across 20 categories and three English levels. Draw one for practice or bring it to the table.`} breadcrumbLabel="Questions" breadcrumbPath="/questions"><QuestionDeck showPageLink={false} additionalQuestions={managedQuestions} /></PublicPageShell>;
}
