"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export type FaqListItem = { question: string; answer: string };

export function FaqList({ items }: { items: readonly FaqListItem[] }) {
  const [query, setQuery] = useState("");
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return items;
    return items.filter((item) => `${item.question} ${item.answer}`.toLocaleLowerCase().includes(normalized));
  }, [items, query]);

  return <>
    <label className="faq-search"><Search aria-hidden="true" /><span className="sr-only">Search frequently asked questions</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions" type="search" /></label>
    <div className="faq-list" aria-live="polite">
      {visibleItems.length ? visibleItems.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>) : <p className="faq-no-results">No answer matches that search yet. Try another phrase or contact the club.</p>}
    </div>
  </>;
}
