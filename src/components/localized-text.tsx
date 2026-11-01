"use client";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";
export function LocalizedText({ en, ru }: { en: string; ru: string }) {
  const { language } = useDashboardLanguage();
  return <span lang={language}>{language === "ru" ? ru : en}</span>;
}
