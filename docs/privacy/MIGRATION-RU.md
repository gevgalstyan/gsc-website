# Российская архитектура, перенос и бюджет

## Решение

Прямой сбор в Paris не подходит для предполагаемого массового российского клуба без применимого исключения; перед возобновлением выбрать российское первичное хранение и проверить все исходящие потоки. Российский proxy/вторая копия не исправляют прямые записи Auth/Storage за рубежом. Даже полный перенос не равен соблюдению всех требований закона.

| Вариант | Совместимость | Решение |
|---|---|---|
| Только managed PostgreSQL в РФ | Нет Auth API, Storage API, JWT claims/auth.uid(), Realtime, PostgREST и SMTP orchestration | Не подставлять URL вместо Supabase. Потребуется отдельный backend, Auth/Storage и адаптация клиента |
| Self-hosted Supabase в выбранном российском ЦОД | Наиболее близок к текущим SDK/UUID/RLS/RPC | Предпочтительная техническая гипотеза, требуется стенд и операционная команда |
| Другой российский BaaS/Auth | Нельзя предполагать импорт hashes/identities и RLS | Сначала proof of concept, иначе риск потери входа и прав |

[Supabase self-hosting](https://supabase.com/docs/guides/self-hosting): Docker-стек требует самостоятельных обновлений, мониторинга, hardening и резервирования; managed-функции не переносятся автоматически. Выбирать фактический ЦОД РФ и договор, а не только российское название компании. Закрыть Studio, Postgres и внутренние API сетевыми правилами; TLS public gateway, MFA для операторов, vault/secrets, отдельные роли, patching и журнал доступа. Не оставлять примерные пароли/JWT из compose.

## План без потери истории

1. Снять metadata-only карту всех schemas, extensions, versions, grants, RLS, функций/триггеров/cron, Auth providers/redirects/SMTP и bucket policies. Сопоставить live, миграции и legacy tables. Не применять старые миграции поверх живой БД: история уже расходится. Зафиксировать исходный read-only manifest counts/FKs/агрегатов без PII.
2. Подтвердить российские площадки основной БД, Storage, backup, логов и аварийной копии, договоры и контроль администраторов. Определить RPO/RTO (предлагается согласовать RPO≤24h на этапе теста; финальное окно cutover — без потери новых записей).
3. Создать изолированный production-like стек PostgreSQL 17 совместимой версии, Auth/GoTrue, PostgREST, Storage, Realtime, gateway и SMTP. Сначала синтетические данные. Сопоставить extension availability, `auth.uid()/jwt()`, `app_private`, search_path, SECURITY DEFINER owner/grants. Не менять admin allowlist или роли на данные формы.
4. Согласованный защищённый export: supported Supabase backup/restore/CLI procedure, encrypted storage и transport, ключ отдельно, доступ двум назначенным лицам, audit без содержимого. Никогда не commit dump/Auth/секреты. Проверить восстановление, не только создание файла. Для реальных данных требуется разрешение владельца; в этой работе export не делался.
5. Перенести Auth users/identities с теми же UUID и совместимыми bcrypt hashes через поддержанный полный Auth migration. Сверять hash parity только в защищённом скрипте с boolean результатом, не печатать hashes. Не сбрасывать пароли всем и не создавать заново аккаунты с новыми UUID. Настройки JWT/refresh tokens/encryption/providers — по документации выбранной версии; ожидаемо потребуется повторный вход при смене ключей/issuer. Если совместимость не доказана, cutover запретить, подготовить иной согласованный сценарий.
6. Restore schemas в правильном порядке и данные без UUID remap: profiles/legacy, roles, meetups/bookings, attendance/payment, loyalty/special rewards/notes, notifications, question history/favorites/deck, CMS/revisions/media, audit. Исключить случайное повторное начисление от restore-trigger. Сравнить функции с live, особенно платные посещения и reward expiry. Не пересчитывать историю «с нуля».
7. Storage: перенести двоичные объекты и metadata/ownership (не только SQL storage.objects); точный UID path `uid/avatar.webp` сохраняется, bucket приватный. Public site-media — отдельно. Старые signed URLs истекут, persistent URLs/allowed hostnames/Next image config требуется согласованно обновить. Восстановить policies и проверить member/other/admin, MIME/size и iPhone.
8. На стенде: counts каждой таблицы, UUID/FK uniqueness/orphans, protected checksums, booking/attendance/reward totals и paid semantics; нет private reads другой учётки; нет spoof role через metadata; confirmation/recovery/refresh/admin existing credentials; avatars and cancellation, notifications, sync. Отдельно отрицательные direct signup/OTP/OAuth/new booking tests при закрытии. Отчёт только агрегаты.
9. Cutover по отдельному разрешению: freeze writes на старом И новом gateway, получить final consistent snapshot + object delta, сверить и восстановить, переключить build public endpoints/DNS/TLS/SMTP callbacks. Не держать dual write. Перед открытием admin preflight/monitoring/recovery. Старую базу оставить закрытой и доступной только операторам на согласованный rollback срок, без нового публичного сбора.
10. Rollback до записи в новую БД: вернуть прежний frontend только в закрытом privacy mode; Auth/booking остаются закрыты. После новых записей rollback требует сохранения/сверки delta в изолированной процедуре; нельзя просто переключить DNS и потерять записи. Старые копии уничтожать только после утверждения сроков, подтверждения restore и законных удержаний.

Оценка работ: 5–10 инженерных рабочих дней для стенда/проверок малого проекта, не обещание. Cutover ориентировочно 30–120 минут после измеренной репетиции; может быть больше из-за Auth/Storage/почты. Не объявлять нулевой downtime или гарантированное сохранение сессий без опыта восстановления.

## Оценка дополнительных ежемесячных расходов, RUB

Планирование на 02.11.2026, НЕ коммерческое предложение. Размер БД, трафик и тарифы аккаунта неизвестны. Не суммировать взаимоисключающие DB варианты. Текущий Timeweb сайт остаётся отдельным расходом.

| Статья | Ориентир/мес | Основание |
|---|---:|---|
| Self-hosted Supabase: VM 4–8GB+ и диск в РФ | 2 500–6 000 ₽ | Инженерный резерв бюджета; размер/тариф выбрать по нагрузке, без заявленного live quote |
| Backup/object storage/выделенный IP | 500–1 500 ₽ | Резерв, зависит от объёма/retention/трафика |
| SMTP | 300–1 500 ₽ | Резерв; подтвердить договор/лимиты/тариф для НПД |
| Monitoring/внешняя проверка | 0–1 000 ₽ | Самостоятельная эксплуатация возможна, труд не бесплатен |
| Итого небольшой одинарный стек | **3 300–10 000 ₽** | Без HA, администрирования и разовой миграции |
| Отдельный managed PostgreSQL вместо встроенной БД | от 790 ₽ + Auth/API/Storage/VM | [Timeweb](https://timeweb.cloud/services/postgresql) публикует нижний порог; это НЕ цена полного Supabase |

Timeweb также указывает backup 6 ₽/GB-месяц и public IP 200 ₽/месяц; подтвердить в заказе. Российский регион выбирать явно. [Яндекс 360 тарифы](https://360.yandex.ru/business/tariff/) зависят от плана/числа сотрудников; SMTP-резерв выше — оценка, не подтверждённая цена этого продукта. HA/второй сервер могут увеличить бюджет примерно вдвое. Разовые часы миграции и юридической проверки оценить отдельной сметой; операторские трудозатраты и текущие Supabase/Resend счета сюда не включены.
