"use client";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";
/** Shared preference; only surfaces with reviewed translations opt into it. */
export function LanguageSwitch() {
  const { language, setLanguage } = useDashboardLanguage();
  return <button type="button" className="language-switch" aria-label={language === "en" ? "Switch help and policies to Russian" : "Переключить справку и документы на английский"} onClick={() => setLanguage(language === "en" ? "ru" : "en")}><span lang="en">EN</span><span aria-hidden="true"> / </span><span lang="ru">РУ</span><span className="sr-only"> ({language})</span></button>;
}
