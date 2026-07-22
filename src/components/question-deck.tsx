"use client";

import { ArrowLeft, Copy, Heart, RotateCcw, Shuffle, Sparkles } from "lucide-react";
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

// Storage contract: v3 keeps explored IDs, v2 is read only for migration, and
// favorites v1 stores a deduplicated ID array. Session history stays in memory.
const storageKey = "gsc_question_progress_v3";
const legacyStorageKey = "gsc_seen_questions_v2";
const favoritesStorageKey = "gsc_question_favorites_v1";
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

function readFavorites(): string[] {
  try { return sanitizeSeen(JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]")); } catch { return []; }
}

function saveFavorites(favorites: string[]) {
  try { localStorage.setItem(favoritesStorageKey, JSON.stringify(favorites)); } catch { /* Favorites remain available for this session. */ }
}

export function QuestionDeck() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [seen, setSeen] = useState<string[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadStoredQuestions = window.setTimeout(() => {
      const restored = readProgress();
      setSeen(restored);
      const restoredFavorites = readFavorites();
      setFavorites(restoredFavorites);
      saveFavorites(restoredFavorites);
      saveProgress(restored);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(loadStoredQuestions);
  }, []);

  const pool = useMemo(
    () => questions.filter((item) =>
      (category === "all" || item.category === category)
      && (difficulty === "all" || item.difficulty === difficulty)
      && (!favoritesOnly || favorites.includes(item.id))),
    [category, difficulty, favorites, favoritesOnly],
  );
  const seenSet = useMemo(() => new Set(seen), [seen]);
  const seenHere = pool.filter((item) => seenSet.has(item.id)).length;
  const remaining = pool.length - seenHere;
  const exhausted = ready && (favoritesOnly ? pool.length === 0 : remaining === 0);
  const categoryLabel = category === "all" ? "All Categories" : category;
  const difficultyLabel = difficulty === "all" ? "All Levels" : difficultyLabels[difficulty];
  const currentFavorite = question ? favorites.includes(question.id) : false;

  function compatible(item: Question, nextCategory = category, nextDifficulty = difficulty, onlyFavorites = favoritesOnly) {
    return (nextCategory === "all" || item.category === nextCategory)
      && (nextDifficulty === "all" || item.difficulty === nextDifficulty)
      && (!onlyFavorites || favorites.includes(item.id));
  }

  function clearCurrentForFilters(nextCategory = category, nextDifficulty = difficulty, onlyFavorites = favoritesOnly) {
    setQuestion(null);
    setHistory((items) => items.filter((id) => {
      const item = questions.find((candidate) => candidate.id === id);
      return item ? compatible(item, nextCategory, nextDifficulty, onlyFavorites) : false;
    }));
    setFeedback("");
  }

  function changeCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);
    clearCurrentForFilters(nextCategory, difficulty);
  }

  function changeDifficulty(nextDifficulty: DifficultyFilter) {
    setDifficulty(nextDifficulty);
    clearCurrentForFilters(category, nextDifficulty);
  }

  function next() {
    const favoriteChoices = pool.filter((item) => item.id !== question?.id);
    const available = favoritesOnly
      ? (favoriteChoices.length ? favoriteChoices : pool)
      : pool.filter((item) => !seenSet.has(item.id));
    if (!available.length) {
      setQuestion(null);
      return;
    }
    const nextQuestion = available[Math.floor(Math.random() * available.length)];
    const updated = [...seen, nextQuestion.id];
    setSeen(updated);
    if (question) setHistory((items) => [...items, question.id]);
    setQuestion(nextQuestion);
    setFeedback("");
    saveProgress(updated);
  }

  function reset() {
    if (seenHere > 0 && !window.confirm(`Reset explored progress for ${categoryLabel}, ${difficultyLabel}${favoritesOnly ? ", Favorites" : ""}? Favorites will be kept.`)) return;
    const poolIds = new Set(pool.map((item) => item.id));
    const updated = seen.filter((id) => !poolIds.has(id));
    setSeen(updated);
    setQuestion(null);
    saveProgress(updated);
  }

  function previous() {
    const compatibleHistory = history.filter((id) => {
      const item = questions.find((candidate) => candidate.id === id);
      return item ? pool.some((candidate) => candidate.id === item.id) : false;
    });
    const previousId = compatibleHistory.at(-1);
    if (!previousId) return;
    setHistory(compatibleHistory.slice(0, -1));
    setQuestion(questions.find((item) => item.id === previousId) ?? null);
    setFeedback("");
  }

  function toggleFavorite() {
    if (!question) return;
    const removing = favorites.includes(question.id);
    const updated = removing ? favorites.filter((id) => id !== question.id) : [...favorites, question.id];
    setFavorites(updated);
    saveFavorites(updated);
    setFeedback(removing ? "Removed from favorites." : "Added to favorites.");
    if (removing && favoritesOnly) {
      setQuestion(null);
      setHistory((items) => items.filter((id) => id !== question.id));
    }
  }

  async function copyQuestion() {
    if (!question) return;
    try {
      await navigator.clipboard.writeText(question.text);
      setFeedback("Copied.");
    } catch {
      setFeedback("Couldn’t copy. Please select the question text instead.");
    }
  }

  function toggleFavoritesView() {
    const nextValue = !favoritesOnly;
    setFavoritesOnly(nextValue);
    clearCurrentForFilters(category, difficulty, nextValue);
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
          <button className={`favorites-filter ${favoritesOnly ? "active" : ""}`} aria-pressed={favoritesOnly} onClick={toggleFavoritesView}>
            <Heart aria-hidden="true" /> Favorites <small>{favorites.length}</small>
          </button>
        </div>
        <p className="filter-summary" aria-live="polite">
          <span>{categoryLabel}</span><i>•</i><span>{difficultyLabel}</span>{favoritesOnly && <><i>•</i><span>Favorites</span></>}<strong>{pool.length} available</strong>
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
              <p>{question?.text || (favoritesOnly && pool.length === 0
                ? "No favorites match this selection yet. Save a question or adjust the filters."
                : exhausted ? "You’ve explored every question in this selection. Reset this pool to start again."
                : "Ready? Draw a question and let the conversation take you somewhere unexpected.")}</p>
            </div>
          </div>
          <div className="question-actions" aria-label="Question navigation">
            <button onClick={previous} disabled={!question || !history.some((id) => pool.some((item) => item.id === id))}><ArrowLeft aria-hidden="true" />Previous</button>
            <button className={currentFavorite ? "active" : ""} onClick={toggleFavorite} disabled={!question} aria-pressed={currentFavorite}><Heart aria-hidden="true" />Favorite</button>
            <button onClick={copyQuestion} disabled={!question}><Copy aria-hidden="true" />Copy</button>
            <button className="button button-primary next-question" onClick={next} disabled={!ready || exhausted || pool.length === 0}><Shuffle aria-hidden="true" />Next question</button>
          </div>
          <div className="question-progress-row">
            <div className="deck-progress" role="progressbar" aria-label="Questions explored in selected pool" aria-valuemin={0} aria-valuemax={pool.length} aria-valuenow={seenHere}>
              <span style={{ width: `${pool.length ? seenHere / pool.length * 100 : 0}%` }} />
            </div>
            <button className="reset-pool" onClick={reset} disabled={!ready || seenHere === 0}><RotateCcw aria-hidden="true" />Reset explored</button>
          </div>
          <small>{seenHere} explored <i>•</i> {Math.max(0, remaining)} remaining</small>
          <span className="question-feedback" role="status" aria-live="polite">{feedback}</span>
        </div>
      </div>
    </section>
  );
}
