"use client";
import Link from "next/link";
import { ChevronDown, Search, X } from "lucide-react";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { faqCategoryRu, type FaqCategory, type FaqItem } from "@/lib/faq-data";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";
export type FaqListItem = FaqItem;
export function FaqList({ items }: { items: readonly FaqListItem[] }) {
  const { language } = useDashboardLanguage(); const ru = language === "ru";
  const instance = useId();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FaqCategory | "All">("All");
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  const categories = useMemo(() => Array.from(new Set(items.map(item => item.category))), [items]);
  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase().normalize("NFKC");
    return items.filter(item => (activeCategory === "All" || item.category === activeCategory) && (!normalized || `${item.category} ${faqCategoryRu[item.category]} ${item.question} ${item.answer} ${item.ru.question} ${item.ru.answer}`.toLocaleLowerCase().normalize("NFKC").includes(normalized)));
  }, [activeCategory, items, query]);
  function moveFocus(event: KeyboardEvent<HTMLButtonElement>) {
    const buttons = Array.from(event.currentTarget.closest(".faq-list")?.querySelectorAll<HTMLButtonElement>("button[data-faq-question]") ?? []);
    const index = buttons.indexOf(event.currentTarget);
    const next = event.key === "ArrowDown" ? (index + 1) % buttons.length : event.key === "ArrowUp" ? (index - 1 + buttons.length) % buttons.length : event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : null;
    if (next !== null && buttons[next]) { event.preventDefault(); buttons[next].focus(); }
  }
  return <div lang={language} className="faq-browser">
    <div className="faq-tools"><label className="faq-search"><Search aria-hidden="true" /><span className="sr-only">{ru ? "Поиск по вопросам и ответам" : "Search frequently asked questions"}</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={ru ? "Найти ответ…" : "Search questions and answers…"} type="search" />{query && <button type="button" onClick={() => setQuery("")} aria-label={ru ? "Очистить поиск" : "Clear FAQ search"}><X aria-hidden="true" /></button>}</label>
      <div className="faq-category-tabs" role="group" aria-label={ru ? "Категории вопросов" : "FAQ categories"}>
        <button aria-pressed={activeCategory === "All"} className={activeCategory === "All" ? "active" : ""} type="button" onClick={() => setActiveCategory("All")}>{ru ? "Все" : "All"}</button>
        {categories.map(category => <button aria-pressed={activeCategory === category} className={activeCategory === category ? "active" : ""} type="button" key={category} onClick={() => setActiveCategory(category)}>{ru ? faqCategoryRu[category] : category}</button>)}
      </div>
    </div>
    <p className="faq-result-count" role="status" aria-live="polite">{ru ? `Найдено ответов: ${visibleItems.length}` : `${visibleItems.length} answers found`}</p>
    <div className="faq-list">{visibleItems.length ? visibleItems.map(item => {
      const panelId = `${instance}-panel-${item.id}`, buttonId = `${instance}-button-${item.id}`, isOpen = openId === item.id;
      const text = ru ? item.ru : item;
      return <article className={isOpen ? "open" : ""} key={item.id} data-faq-id={item.id}>
        <h3><button data-faq-question aria-controls={panelId} aria-expanded={isOpen} id={buttonId} type="button" onKeyDown={moveFocus} onClick={() => setOpenId(isOpen ? null : item.id)}><span><small>{ru ? faqCategoryRu[item.category] : item.category}</small>{text.question}</span><ChevronDown aria-hidden="true" /></button></h3>
        <div className="faq-answer-wrap" id={panelId} role="region" aria-labelledby={buttonId} hidden={!isOpen}><div className="faq-answer"><p>{text.answer}</p>{item.links?.length ? <div className="faq-answer-links" aria-label={ru ? "Полезные ссылки" : "Useful links"}>{item.links.map(link => <Link key={link.href} href={link.href}>{ru ? link.labelRu : link.label}</Link>)}</div> : null}</div></div>
      </article>;
    }) : <div className="faq-no-results"><p>{ru ? "Ничего не найдено. Измени запрос или свяжись с нами." : "No matching questions found. Try another search or contact us."}</p><button type="button" onClick={() => { setQuery(""); setActiveCategory("All"); }}>{ru ? "Сбросить фильтры" : "Reset FAQ filters"}</button></div>}</div>
  </div>;
}
