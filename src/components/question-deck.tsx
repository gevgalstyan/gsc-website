"use client";

import { RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import questionBank from "@/data/questions.json";

type Category = keyof typeof questionBank;
type Question = { id: string; category: Category; text: string };

const questions = Object.entries(questionBank).flatMap(([category, items]) =>
  items.map((text, index) => ({ id: `${category}-${index}`, category: category as Category, text })),
);
const storageKey = "gsc_seen_questions_v2";

export function QuestionDeck() {
  const [category, setCategory] = useState<"All" | Category>("All");
  const [seen, setSeen] = useState<string[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadStoredQuestions = window.setTimeout(() => {
      try { setSeen(JSON.parse(localStorage.getItem(storageKey) || "[]")); } catch { setSeen([]); }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(loadStoredQuestions);
  }, []);

  const pool = useMemo(() => questions.filter((q) => category === "All" || q.category === category), [category]);
  const seenHere = pool.filter((q) => seen.includes(q.id)).length;

  function next() {
    const available = pool.filter((q) => !seen.includes(q.id));
    if (!available.length) { setQuestion(null); return; }
    const nextQuestion = available[Math.floor(Math.random() * available.length)];
    const updated = [...seen, nextQuestion.id];
    setSeen(updated);
    setQuestion(nextQuestion);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function reset() {
    const poolIds = new Set(pool.map((q) => q.id));
    const updated = category === "All" ? [] : seen.filter((id) => !poolIds.has(id));
    setSeen(updated); setQuestion(null); localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  return (
    <section id="questions" className="section question-section">
      <div className="section-heading">
        <div><span className="eyebrow">Never a silent table</span><h2>One question.<br /><em>Endless conversation.</em></h2></div>
        <p>Pick a category and draw a card. Questions won&apos;t repeat on this device until you reset the deck.</p>
      </div>
      <div className="question-layout">
        <div className="category-list" aria-label="Question category">
          {(["All", ...Object.keys(questionBank)] as ("All" | Category)[]).map((item) => (
            <button key={item} className={category === item ? "active" : ""} onClick={() => { setCategory(item); setQuestion(null); }}>
              {item}<span>{item === "All" ? questions.length : questionBank[item].length}</span>
            </button>
          ))}
        </div>
        <div className="question-card">
          <div className="question-card-top"><span><Sparkles />{question?.category || category}</span><b>{ready ? String(seen.length + 1).padStart(3, "0") : "—"}</b></div>
          <div className="question-copy">
            <p>{question?.text || (seenHere === pool.length ? "You’ve explored every card here. Reset this deck to begin again." : "Ready? Draw a question and let the conversation take you somewhere unexpected.")}</p>
          </div>
          <div className="question-controls">
            <button className="button button-primary" onClick={next}><Shuffle />Draw a question</button>
            <button className="icon-button" onClick={reset} aria-label="Reset current deck" title="Reset current deck"><RotateCcw /></button>
          </div>
          <div className="deck-progress"><span style={{ width: `${pool.length ? seenHere / pool.length * 100 : 0}%` }} /></div>
          <small>{seenHere} explored <i>•</i> {Math.max(0, pool.length - seenHere)} remaining</small>
        </div>
      </div>
    </section>
  );
}
