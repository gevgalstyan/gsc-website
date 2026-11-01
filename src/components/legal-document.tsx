"use client";
import Link from "next/link";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";
import { legalDocuments, type LegalKind } from "@/lib/legal-data";
import { PublishedLegalContent } from "@/components/published-legal-content";
export function LegalDocument({ kind }: { kind: LegalKind }) {
  const { language } = useDashboardLanguage(); const ru = language === "ru";
  const document = legalDocuments[kind];
  return <main className="legal-main" lang={language}>
    <nav aria-label={ru ? "Путь к документу" : "Breadcrumb"}><Link href="/">{ru ? "Главная" : "Home"}</Link> / {ru ? document.titleRu : document.title}</nav>
    <span className="eyebrow">{ru ? "Документы клуба" : "Club documents"}</span><h1>{ru ? document.titleRu : document.title}</h1>
    <aside className="legal-review-notice" role="note"><strong>{ru ? "Проект для проверки — ещё не вступил в силу" : "Review draft — not yet effective"}</strong><p>{ru ? "Эта новая редакция требует подтверждения владельцем. Сведения об операторе, правовые основания, сроки и условия, отмеченные ниже, ещё не утверждены. Проект не подтверждает соблюдение законодательства." : "This proposed revision requires owner approval. Operator disclosures, legal bases, retention and conditions flagged below remain unresolved. This draft is not a compliance certification."}</p><p>{ru ? `Дата новой редакции: не назначена. Прежняя опубликованная дата: ${document.previousDateRu}.` : `Effective date of revision: not set. Previous published date: ${document.previousDate}.`}</p><a href="#current-policy">{ru ? "Открыть прежний опубликованный текст (английский)" : "Read the previously published English text"}</a></aside>
    <nav className="legal-toc" aria-label={ru ? "Содержание документа" : "Document contents"}><strong>{ru ? "В этой редакции" : "In this revision"}</strong><ol>{document.sections.map(section => <li key={section.id}><a href={`#${section.id}`}>{ru ? section.titleRu : section.title}</a></li>)}</ol></nav>
    <article className="legal-document">{document.sections.map(section => <section id={section.id} key={section.id}><h2>{ru ? section.titleRu : section.title}</h2>{(ru ? section.paragraphsRu : section.paragraphs).map((text, index) => <p key={index}>{text}</p>)}</section>)}
      <section id="privacy-contact"><h2>{ru ? "Связаться с организатором" : "Contact the organizer"}</h2><p>{ru ? "Для запроса о данных открой контакты и попроси личный ответ. Не публикуй пароли, токены и ссылки из писем в сообществе. Отдельный контакт оператора для личных запросов ещё требует подтверждения." : "For a data request, use Contact and ask for a private reply. Do not post passwords, tokens or email links in the community. A dedicated operator contact for private requests still needs confirmation."}</p><Link href="/contact/">{ru ? "Контакты клуба" : "Club contact page"}</Link></section>
    </article>
    <nav className="policy-links" aria-label={ru ? "Другие документы" : "Related documents"}><Link href="/privacy/">{ru ? "Конфиденциальность" : "Privacy"}</Link><Link href="/terms/">{ru ? "Условия" : "Terms"}</Link><Link href="/cookies/">{ru ? "Хранилище браузера" : "Browser storage"}</Link><Link href="/faq/">FAQ</Link></nav>
    <details className="legal-current-version" id="current-policy" open><summary>{ru ? `Прежний опубликованный текст · ${document.previousDateRu} · English` : `Previously published text · ${document.previousDate} · English`}</summary><p>{ru ? "Оригинальная версия сохранена без изменений. Новая редакция выше не заменяет её до утверждения; прежние записи о принятии не переписываются." : "The original wording is preserved unchanged. The proposed revision above does not replace it until approved, and existing acceptance records are not rewritten."}</p><article lang="en"><PublishedLegalContent kind={kind} /></article></details>
    <Link className="button button-outline-dark legal-back-link" href="/">{ru ? "На главную GSC" : "Back to GSC"}</Link>
  </main>;
}
