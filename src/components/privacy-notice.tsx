import Link from "next/link";
import { privacyProtectionEnabled } from "@/lib/privacy-protection";
export function PrivacyNotice({ compact = false }: { compact?: boolean }) {
  if (!privacyProtectionEnabled) return null;
  return <aside className={compact ? "privacy-protection-notice compact" : "privacy-protection-notice"} aria-label="Registration and booking status">
    <p lang="ru"><strong>Регистрация и новая запись на встречи временно приостановлены.</strong> Информация и вопросы для практики остаются доступны. Вход в существующие аккаунты работает.</p>
    <p lang="en"><strong>Registration and new meetup bookings are temporarily paused.</strong> Information and practice questions remain available. Existing accounts can still sign in.</p>
    {!compact && <div className="public-actions"><Link href="/login/">Вход / Sign in</Link><Link href="/privacy-requests/">Запрос о данных / Privacy request</Link></div>}
  </aside>;
}
