"use client";

import { RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  categories,
  difficultyLabels,
  difficulties,
  questions,
  type CategoryFilter,
  type DifficultyFilter,
  type Question,
} from "@/lib/questions";

const storageKey = "gsc_question_progress_v3";
const legacyStorageKey = "gsc_seen_questions_v2";
const validQuestionIds = new Set(questions.map((question) => question.id));

type StoredProgress = {
  version: 3;
  seen: string[];
};

function sanitizeSeen(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id): id is string => typeof id === "string" && validQuestionIds.has(id)))];
}

function readProgress(): string[] {
  // v3 stores a versioned object. The previous release stored a bare ID array;
  // valid legacy IDs are migrated without changing the original question IDs.
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || "null") as Partial<StoredProgress> | null;
    if (stored?.version === 3) return sanitizeSeen(stored.seen);
  } catch {
    // Continue with the legacy format when versioned data is malformed.
  }

  try {
    return sanitizeSeen(JSON.parse(localStorage.getItem(legacyStorageKey) || "[]"));
  } catch {
    return [];
  }
}

function saveProgress(seen: string[]) {
  const progress: StoredProgress = { version: 3, seen };
  try {
    localStorage.setItem(storageKey, JSON.stringify(progress));
  } catch {
    // Drawing still works when storage is blocked or unavailable.
  }
}

export function QuestionDeck() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [seen, setSeen] = useState<string[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadStoredQuestions = window.setTimeout(() => {
      const restored = readProgress();
      setSeen(restored);
      saveProgress(restored);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(loadStoredQuestions);
  }, []);

  const pool = useMemo(
    () => questions.filter((item) =>
      (category === "all" || item.category === category)
      && (difficulty === "all" || item.difficulty === difficulty)),
    [category, difficulty],
  );
  const seenSet = useMemo(() => new Set(seen), [seen]);
  const seenHere = pool.filter((item) => seenSet.has(item.id)).length;
  const remaining = pool.length - seenHere;
  const exhausted = ready && remaining === 0;
  const categoryLabel = category === "all" ? "All Categories" : category;
  const difficultyLabel = difficulty === "all" ? "All Levels" : difficultyLabels[difficulty];

  function changeCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);
    setQuestion(null);
  }

  function changeDifficulty(nextDifficulty: DifficultyFilter) {
    setDifficulty(nextDifficulty);
    setQuestion(null);
  }

  function next() {
    const available = pool.filter((item) => !seenSet.has(item.id));
    if (!available.length) {
      setQuestion(null);
      return;
    }
    const nextQuestion = available[Math.floor(Math.random() * available.length)];
    const updated = [...seen, nextQuestion.id];
    setSeen(updated);
    setQuestion(nextQuestion);
    saveProgress(updated);
  }

  function reset() {
    const poolIds = new Set(pool.map((item) => item.id));
    const updated = seen.filter((id) => !poolIds.has(id));
    setSeen(updated);
    setQuestion(null);
    saveProgress(updated);
  }

  return (
    <section id="questions" className="section question-section">
      <div className="section-heading">
        <div><span className="eyebrow">Never a silent table</span><h2>One question.<br /><em>Endless conversation.</em></h2></div>
        <p>Choose a category and level, then draw a card. Questions won&apos;t repeat on this device until you reset that pool.</p>
      </div>

      <div className="question-filter-bar">
        <div className="level-list" aria-label="Question difficulty">
          <button className={difficulty === "all" ? "active" : ""} aria-pressed={difficulty === "all"} onClick={() => changeDifficulty("all")}>All Levels</button>
          {difficulties.map((level) => (
            <button key={level} className={difficulty === level ? "active" : ""} aria-pressed={difficulty === level} onClick={() => changeDifficulty(level)}>
              <span>{difficultyLabels[level].split(" — ")[0]}</span><small>{difficultyLabels[level].split(" — ")[1]}</small>
            </button>
          ))}
        </div>
        <p className="filter-summary" aria-live="polite">
          <span>{categoryLabel}</span><i>•</i><span>{difficultyLabel}</span><strong>{pool.length} available</strong>
        </p>
      </div>

      <div className="category-select-wrap">
        <label htmlFor="question-category">Question category</label>
        <select id="question-category" value={category} onChange={(event) => changeCategory(event.target.value as CategoryFilter)}>
          <option value="all">All Categories ({difficulty === "all" ? questions.length : questions.filter((item) => item.difficulty === difficulty).length})</option>
          {categories.map((item) => (
            <option key={item} value={item}>{item} ({questions.filter((question) => question.category === item && (difficulty === "all" || question.difficulty === difficulty)).length})</option>
          ))}
        </select>
      </div>

      <div className="question-layout">
        <div className="category-list" aria-label="Question category">
          <button className={category === "all" ? "active" : ""} aria-pressed={category === "all"} onClick={() => changeCategory("all")}>
            All Categories<span>{difficulty === "all" ? questions.length : questions.filter((item) => item.difficulty === difficulty).length}</span>
          </button>
          {categories.map((item) => (
            <button key={item} className={category === item ? "active" : ""} aria-pressed={category === item} onClick={() => changeCategory(item)}>
              {item}<span>{questions.filter((question) => question.category === item && (difficulty === "all" || question.difficulty === difficulty)).length}</span>
            </button>
          ))}
        </div>

        <div className="question-card">
          <div className="question-card-top">
            <span><Sparkles aria-hidden="true" />{question?.category || categoryLabel}</span>
            <b>{ready ? `${seenHere}/${pool.length}` : "—"}</b>
          </div>
          <div className="question-copy" aria-live="polite">
            <div>
              {question && <span className={`level-badge level-${question.difficulty}`}>{difficultyLabels[question.difficulty]}</span>}
              <p>{question?.text || (exhausted
                ? "You’ve explored every question in this selection. Reset this pool to start again."
                : "Ready? Draw a question and let the conversation take you somewhere unexpected.")}</p>
            </div>
          </div>
          <div className="question-controls">
            <button className="button button-primary" onClick={next} disabled={!ready || exhausted}><Shuffle aria-hidden="true" />Draw a question</button>
            <button className="icon-button" onClick={reset} disabled={!ready || seenHere === 0} aria-label={`Reset ${categoryLabel}, ${difficultyLabel} pool`} title="Reset selected pool"><RotateCcw aria-hidden="true" /></button>
          </div>
          <div className="deck-progress" role="progressbar" aria-label="Questions explored in selected pool" aria-valuemin={0} aria-valuemax={pool.length} aria-valuenow={seenHere}>
            <span style={{ width: `${pool.length ? seenHere / pool.length * 100 : 0}%` }} />
          </div>
          <small>{seenHere} explored <i>•</i> {Math.max(0, remaining)} remaining</small>
        </div>
      </div>
    </section>
  );
}
