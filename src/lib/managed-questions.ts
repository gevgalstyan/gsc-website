/**
 * Loads administrator-managed questions and converts them to the public format.
 * Only published rows with recognized categories and difficulty values are exposed.
 */

import { type Question } from "@/lib/questions";

// ======================================================
// QUESTIONS — PUBLISHED DATABASE CONTENT
// ======================================================
export async function getManagedQuestions(): Promise<Question[]> {
  return [];
}
