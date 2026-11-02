# Выполненная проверка — 02.11.2026

## Успешно

| Проверка | Результат |
|---|---|
| `npm ci --ignore-scripts` | Установка зависимостей прошла; lockfile не менялся |
| `npm run lint` / `npm run type-check` | Пройдены |
| `npm run test:auth` | 29 passed: unit + PGlite SQL, включая pause trigger, RLS own/other, role spoof, история, фактический SDK transport |
| `npm run test:auth:build` | Next optimized export с mock Auth и privacy disabled; не для deployment |
| `npm run test:auth:browser` | 74 passed, desktop/mobile Chromium: login, CAPTCHA, verification/recovery, existing Google identity/password, logout, admin/member, legacy schema, JPEG/PNG/HEIC handling |
| `npm run test:audit:browser` | 12 passed, desktop/iphone viewport Chromium |
| `npm run test:refinement:browser` | 48 passed: темы, auth-aware UI, FAQ, a11y, responsive, notifications |
| `npm run test:auth:configuration` | 4 passed на двух специальных mock builds; штатный mock build восстановлен |
| `npm run emails:check` | Все 7 HTML/text pairs/subjects соответствуют источнику |
| `npm run emails:preview` | Go 1.27.3, 7 типов × 4 сценария имени, HTML/text; ничего не отправлено |
| `npm run test:emails:browser` | 16 passed desktop/iphone viewport Chromium |
| `npm run test:privacy:build` | Next optimized static export, privacy enabled, mock backend |
| `npm run test:privacy:browser` | 13 passed: no signup fields/transmissions, 320/375/430/768 и light/dark, a11y, local request/no submit, public pages/questions without REST/signup/OTP requests, member/admin retained |
| `npm run validate:questions` | 2 000 вопросов; 5 существующих near-duplicate review candidates, не удалялись |
| `npm run validate:translations` | 100 переводов, 1 900 без фиктивных переводов, IDs/уровни сохранены |
| `npm run validate:static` | Обычный и protected export: 27 HTML и локальные назначения ссылок проверены |
| `git diff --check` | Пройден |

**Всего 196 успешно выполненных test cases** (29 + 74 + 12 + 48 + 4 + 16 + 13). Content validators/build/Go preview не включены в эту сумму. Существующие браузерные тесты намеренно используют privacy-disabled mock, новая suite — privacy-enabled mock. Это проверяет оба поведения, не открывает реальный signup.

## Ограничения и отрицательные результаты

- Первая попытка браузерных suites не запускалась из-за отсутствующего Chromium; установлен штатный Playwright Chromium 141, затем перечисленные suites полностью перезапущены и прошли. Первая попытка Go preview также остановилась из-за отсутствующего Go; после установки 1.27.3 повторный preview и email suite прошли.
- `npm run build` production: **BLOCKED** prebuild gate, локально отсутствуют три production public build settings. Не подменяли их mock ради утверждения готовности. Два optimized test exports проходят; deployment artifacts здесь только mock и не должны публиковаться.
- `npm run auth:check` без env: **BLOCKED**, отсутствуют public build variables. `privacy:check` без env также отказался утверждать статус.
- Затем `privacy:check` read-only с текущим publishable key из коннектора: провайдер `disable_signup:false`, email enabled. **Ожидаемая проверка защиты не пройдена: production signup открыт.** Никакого PATCH/реального signup probe, создания аккаунтов или отправки email.
- `dashboard:check-schema` read-only с limit=0: базовые profiles/user_roles распознаны, anonymous доступ запрещён; first_name/surname/age/nationality/gender/email отсутствуют. Это совпадает с metadata audit, не проверяет реальный admin сеанс и не требует применения registration migration при закрытом сборе.
- Read-only Supabase metadata: 29 public/storage таблиц с RLS; private avatar/public site media; функции admin имеют внутренний is_admin guard. Advisor предупреждения и ограничения описаны в REPORT. Все SQL-тесты локальные, live SQL operation не применялась.
- Мобильные тесты используют Chromium с размерами/касаниями iPhone. Физический iPhone Safari, native HEIC decoder, production recovery delivery/SMTP reputation, реальный admin и production прямые API после закрытия **не проверены**. Не объявлять их passed.
- Логи изучены только агрегированно/по metadata, не сырые IP/email/token записи; фактические retention, договоры, backup restore и юридические сроки требуют подтверждения.

После owner-approved Auth/SQL/deployment нужны отдельные проверки полного рабочего пути и изолированного отказа signup/OTP/OAuth/booking. Технические тесты не сертифицируют соблюдение 152-ФЗ.
