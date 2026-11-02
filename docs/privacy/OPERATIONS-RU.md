# Согласуемая защита рабочей системы

Никакие изменения ниже не выполнены в production. Read-only проверка Auth settings 02.11.2026 подтвердила disable_signup:false и включённый email provider. Запрос на разрешение должен перечислять Auth, SQL и deployment отдельно. Доступные инструменты не предоставляют прямой узкой операции изменения Auth; не заменять её приостановкой всего проекта.

## Preflight

- Убедиться, что существует рабочий вход текущего администратора, подтверждённый email, recovery и доступ dashboard; не создавать новую production учётку для теста.
- Записать прежнее значение signup и версии конфигурации в защищённом change record; не копировать SMTP secret/JWT/service-role в issue/PR.
- Проверить восстановимую encrypted backup и роль is_admin; сопоставить reviewed trigger с live схемой. Тестовый стенд в РФ предпочтителен.

## Auth и API

Установить в Supabase Auth только `disable_signup:true` (Allow new users to sign up — off). Сохранить Email provider, Confirm email, текущие пароли, SMTP и redirects; не выключать сам email provider и не удалять identities. Anonymous sign-in и неизвестные OAuth/OTP identities должны быть закрыты от создания, существующие должны входить. Привилегированная admin invitation — отдельное контролируемое действие, не публичная регистрация.

Read-only `node --use-env-proxy scripts/check-privacy-protection.mjs` с публичными build env печатает только booleans. Если env отсутствуют/настройки не возвращены — результат НЕ подтверждён. Не использовать registration probe с настоящим email: ошибочный успех создаст пользователя. На изолированном Auth проекте проверить raw HTTP signup, OTP с shouldCreateUser true/false, OAuth неизвестного субъекта, anonymous, SDK и existing password/recovery/refresh. Ожидается отказ создания при сохранённом входе. Приложить redacted HTTP statuses и Auth version к change record. Сам GET settings не доказывает все варианты API.

После отдельного разрешения применить `supabase/operations/privacy-protection-review.sql` как owner в транзакции; триггер запрещает insert/реактивацию member и сохраняет отмену собственной confirmed записи, RLS/constraints продолжают работать. Admin bypass только через `app_private.is_admin()`. Control table недоступна anon/authenticated; при отсутствии singleton защитный режим fail-closed. Операция повторяемая, включает паузу снова. Не применять через все старые migrations и не отключать RLS.

Проверка metadata, без пользовательских строк:

```sql
select paused from app_private.privacy_protection_control where singleton;
select tgname, tgenabled from pg_trigger
where tgrelid='public.meetup_bookings'::regclass and tgname='enforce_booking_privacy_pause';
select has_table_privilege('anon','app_private.privacy_protection_control','UPDATE') as anon_can_change,
       has_table_privilege('authenticated','app_private.privacy_protection_control','UPDATE') as member_can_change;
```

На стенде raw PostgREST INSERT/UPSERT/reactivation PATCH должны получить отказ для member; GET own history и cancellation работают, foreign read/update запрещены, admin dashboard работает. SQL-тест PR проверяет trigger с RLS fixture, но не заменяет gateway/Auth тесты. Владелец подтверждает каждый production шаг. Deploy static artifact со значением `NEXT_PUBLIC_PRIVACY_PROTECTION_MODE=enabled` только после approval; проверить status JSON и приватное окно браузера. Mock build запрещён к deploy.

## Возврат и повторное открытие

При ошибке сохранить signup/booking закрытыми; не «чинить» автоматическим открытием регистрации. Можно откатить UI в предыдущую версию только если она не собирает ПД и backend остаётся закрыт. Перед удалением триггера/выключением control требуются отдельное решение и другой надёжный запрет. История и backup не удаляются. Public reopen: согласованная локализация, документы, основания, сроки, уведомления, SMTP и успешная проверка реального пути; затем отдельное разрешение на Auth/UI/SQL переключение.

## Обращения, удержания и инциденты

Назначить частный контакт и ответственного. Минимальная проверка владения аккаунтом без запроса пароля/OTP и без общих чатов. Регистрировать дату, тип, объём, проверку, исполнителя/результат; сроки по применимой норме проверить при принятии запроса. При отзыве выделить consent-based цели; при erase проверить retention/legal hold и FK, определить удаление/обезличивание каждого объекта. Ограничить доступ к удерживаемым данным. Зафиксировать обработчикам поручение, backups/restore tombstone procedure и подтверждение уничтожения. Автоматического Auth delete в PR нет.

Для инцидента: ограничение доступа/сохранение доказательств, оценка факта и субъекта утечки, установленный законом порядок уведомления РКН (первичное/результаты расследования), контакты и таймеры внутреннего runbook подтвердить с юристом. Не выносить сырые логи или данные пострадавших в GitHub.
