"use client";

import { ArrowLeft, Copy, Heart, Languages, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import {
  categories,
  difficultyLabels,
  difficulties,
  questions,
  type CategoryFilter,
  type DifficultyFilter,
  type Question,
} from "@/lib/questions";
import { useQuestionState } from "@/hooks/use-question-state";

export function QuestionDeck() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [question, setQuestion] = useState<Question | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showTranslation, setShowTranslation] = useState(false);
  const { seen, favorites, ready, syncError, markExplored, setFavorite, resetProgress } = useQuestionState();

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
    setShowTranslation(false);
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
    setShowTranslation(false);
    const favoriteChoices = pool.filter((item) => item.id !== question?.id);
    const available = favoritesOnly
      ? (favoriteChoices.length ? favoriteChoices : pool)
      : pool.filter((item) => !seenSet.has(item.id));
    if (!available.length) {
      setQuestion(null);
      return;
    }
    const nextQuestion = available[Math.floor(Math.random() * available.length)];
    if (question) setHistory((items) => [...items, question.id]);
    setQuestion(nextQuestion);
    setFeedback("");
    void markExplored(nextQuestion.id);
  }

  function reset() {
    if (seenHere > 0 && !window.confirm(`Reset explored progress for ${categoryLabel}, ${difficultyLabel}${favoritesOnly ? ", Favorites" : ""}? Favorites will be kept.`)) return;
    const poolIds = new Set(pool.map((item) => item.id));
    setQuestion(null);
    setShowTranslation(false);
    void resetProgress([...poolIds]);
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
    setShowTranslation(false);
    setFeedback("");
  }

  function toggleFavorite() {
    if (!question) return;
    const removing = favorites.includes(question.id);
    void setFavorite(question.id, removing === false);
    setFeedback(removing ? "Removed from favorites." : "Added to favorites.");
    if (removing && favoritesOnly) {
      setQuestion(null);
      setShowTranslation(false);
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
        <p>Choose a category and level, then draw a card. Questions won&apos;t repeat until you reset that pool.</p>
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
              {question && (
                <div className="question-meta-row">
                  <span className={`level-badge level-${question.difficulty}`}>{difficultyLabels[question.difficulty]}</span>
                  {question.translations?.ru && (
                    <button
                      className="translate-question"
                      type="button"
                      onClick={() => setShowTranslation((visible) => !visible)}
                      aria-expanded={showTranslation}
                      aria-controls="question-russian-translation"
                    >
                      <Languages aria-hidden="true" />
                      {showTranslation ? "Hide translation" : "Translate"}
                    </button>
                  )}
                </div>
              )}
              <p className="question-english">{question?.text || (favoritesOnly && pool.length === 0
                ? "No favorites match this selection yet. Save a question or adjust the filters."
                : exhausted ? "You’ve explored every question in this selection. Reset this pool to start again."
                : "Ready? Draw a question and let the conversation take you somewhere unexpected.")}</p>
              {question?.translations?.ru && showTranslation && (
                <div id="question-russian-translation" className="question-translation" lang="ru">
                  <span>Russian translation</span>
                  <p>{question.translations.ru}</p>
                </div>
              )}
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
          <span className="question-feedback" role="status" aria-live="polite">{syncError || feedback}</span>
        </div>
      </div>
    </section>
  );
}
