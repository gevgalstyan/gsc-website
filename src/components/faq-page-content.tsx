"use client";
import Link from "next/link";
import { FaqList } from "@/components/faq-list";
import { faqItems } from "@/lib/faq-data";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";
import { MemberAccountLink } from "@/components/auth-aware-content";
export function FaqPageContent() {
  const { language } = useDashboardLanguage(); const ru = language === "ru";
  return <div lang={language}><section className="section public-section faq-page-section"><div className="section-heading"><div><span className="eyebrow">{ru ? "Справка клуба" : "Club help center"}</span><h2>{ru ? "Ответ рядом." : "Find your answer."}</h2></div><p>{ru ? "Ищи по вопросам и ответам или выбери категорию. Условия отдельного события проверяй в его карточке." : "Search questions and answers, or choose a category. For event-specific conditions, check the published meetup."}</p></div><FaqList items={faqItems} /></section>
    <section className="section public-cta-panel faq-final-cta"><div><span className="eyebrow">{ru ? "Нужна помощь?" : "Still need help?"}</span><h2>{ru ? "Напиши организатору." : "Ask the organizer."}</h2><p>{ru ? "Уточни уровень группы, условия записи или место встречи. Для вопросов об аккаунте попроси личный ответ и не публикуй пароли или ссылки из писем." : "Ask about the group’s level, booking conditions or venue. For account questions, request a private reply and never post passwords or email links."}</p><div className="public-actions"><Link className="button button-primary" href="/contact/">{ru ? "Контакты" : "Contact us"}</Link><Link className="button button-outline-dark" href="/meetups/">{ru ? "Предстоящие встречи" : "View upcoming meetups"}</Link><MemberAccountLink /></div></div></section>
  </div>;
}
