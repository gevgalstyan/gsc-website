"use client";

import Link from "next/link";
import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { FaqCategory, FaqItem } from "@/lib/faq-data";

export type FaqListItem = FaqItem;

export function FaqList({ items }: { items: readonly FaqListItem[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "All">("All");
  const [openQuestion, setOpenQuestion] = useState<string | null>(items[0]?.question ?? null);
  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const searchable = `${item.category} ${item.question} ${item.answer} ${item.links?.map((link) => link.label).join(" ") ?? ""}`;
      const matchesQuery = !normalized || searchable.toLocaleLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, items, query]);
  const resetFilters = () => {
    setQuery("");
    setActiveCategory("All");
  };

  return <>
    <div className="faq-tools">
      <label className="faq-search">
        <Search aria-hidden="true" />
        <span className="sr-only">Search frequently asked questions</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search questions..." type="search" />
        {query ? <button type="button" onClick={() => setQuery("")} aria-label="Clear FAQ search"><X aria-hidden="true" /></button> : null}
      </label>
      <div className="faq-category-tabs" aria-label="FAQ categories">
        <button className={activeCategory === "All" ? "active" : ""} type="button" onClick={() => setActiveCategory("All")}>All</button>
        {categories.map((category) => (
          <button className={activeCategory === category ? "active" : ""} type="button" key={category} onClick={() => setActiveCategory(category)}>
            {category === "Pricing and loyalty" ? "Loyalty" : category === "Location and format" ? "Location" : category === "Member account" ? "Account" : category}
          </button>
        ))}
      </div>
    </div>
    <p className="sr-only" aria-live="polite">{visibleItems.length} matching FAQ questions</p>
    <div className="faq-list">
      {visibleItems.length ? visibleItems.map((item) => {
        const panelId = `faq-panel-${slugify(item.question)}`;
        const buttonId = `faq-button-${slugify(item.question)}`;
        const isOpen = openQuestion === item.question;
        return (
          <article className={isOpen ? "open" : ""} key={item.question}>
            <button aria-controls={panelId} aria-expanded={isOpen} id={buttonId} type="button" onClick={() => setOpenQuestion(isOpen ? null : item.question)}>
              <span>
                <small>{item.category}</small>
                {item.question}
              </span>
              <ChevronDown aria-hidden="true" />
            </button>
            <div className="faq-answer-wrap" id={panelId} role="region" aria-labelledby={buttonId} aria-hidden={!isOpen} inert={isOpen ? undefined : true}>
              <div className="faq-answer">
                <p>{item.answer}</p>
                {item.links?.length ? (
                  <div className="faq-answer-links" aria-label={`Useful links for ${item.question}`}>
                    {item.links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        );
      }) : (
        <div className="faq-no-results">
          <p>No matching questions found. Try another search or contact us.</p>
          <button type="button" onClick={resetFilters}>Reset FAQ filters</button>
        </div>
      )}
    </div>
  </>;
}

function slugify(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
