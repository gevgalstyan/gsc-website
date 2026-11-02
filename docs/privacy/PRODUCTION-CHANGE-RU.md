# Production change после разрешения владельца — 02.11.2026

Владелец явно разрешил временное закрытие регистрации и безопасную SQL-защиту; merge PR #9 и deployment по-прежнему запрещены.

## Выполнено

- Проверены live колонки, RLS, grants и существующие booking triggers/functions; их определения сохранены в `preflight-booking-schema.sql` без пользовательских строк. Это **schema-only checkpoint, не полная резервная копия данных**. Наличие/восстановимость платформенного полного backup инструментами не подтверждались. Изменение аддитивное, не переписывает существующие таблицы/историю; аварийный возврат новых объектов описан в checkpoint и автоматически не выполнялся.
- Повторно выполнен локальный SQL-тест privacy pause: 1 passed.
- Через apply_migration применён точный SQL `supabase/operations/privacy-protection-review.sql`, имя `privacy_pause_new_member_bookings`. Он создаёт закрытый control table и триггер, устанавливает paused=true. Это защита bookings, **не регистраций Auth**.
- Live metadata: paused=true, trigger enabled, исходный RLS включён; anon/authenticated не имеют UPDATE control table и EXECUTE внутренней trigger function. Admin guard сохранён; функция не использует user_metadata для авторизации.
- Live SQL-проверка с синтетическим JWT subject и ролью authenticated в rollback-транзакции: INSERT только разрешённой колонки meetup_id отклонён точной ошибкой `New bookings are temporarily paused`. Аккаунт не создавался, реальная запись не добавилась. Это проверка DB enforcement под API-ролью, не HTTP-запрос с сеансом существующего участника.
- Первая попытка probe явно задавала запрещённые колонки и получила прежний column-grant отказ. Права не расширялись; исправленный probe подтвердил именно новый trigger.
- Security Advisor после изменения: прежние WARN на привилегированную RPC и leaked-password protection; новых privacy-object предупреждений нет. Это не сертификат безопасности.

## Не выполнено / нельзя утверждать

- Последний read-only GET Auth settings: **disable_signup:false**, email provider=true. Публичная регистрация аккаунтов НЕ закрыта. Доступного инструмента изменения Auth config нет. Auth users/identities, пароли, providers, SMTP, redirects и confirmation не менялись.
- Прямой POST signup с новым email не выполнялся: пока настройки открыты, он может создать аккаунт и отправить письмо. Отрицательный Auth API тест до ручного переключения не пройден.
- Реальный вход существующего администратора не проверен: у агента нет его сеанса/пароля. Сохранённый email provider и неизменность Auth не равны успешному тесту входа. Не передавать агенту пароль/OTP.
- Ни merge, ни deployment, ни перенос БД, ни замена SMTP не выполнялись. Старый рабочий frontend может ещё показывать регистрацию/booking, но новый DB booking insert уже получает отказ.

## Ручной шаг владельца

1. Сохранить текущий admin сеанс сайта. В отдельном приватном окне убедиться, что существующий admin входит привычным способом; пароль никому не отправлять.
2. Открыть https://supabase.com/dashboard/project/vmvsxxtaqtvaotrooafq/auth/providers . Сверить проект `gsc` и ref `vmvsxxtaqtvaotrooafq`.
3. Authentication → Sign In / Providers → раздел User Signups: выключить **Allow new users to sign up**. Это общий signup switch (`disable_signup:true`), а не выключение самого Email или Google provider.
4. Нажать Save / Save changes, если показано. Не менять Email provider, Confirm email, CAPTCHA, SMTP, redirects, password/session settings, identities или существующих пользователей. Не нажимать Pause project.
5. Обновить страницу Dashboard и убедиться, что переключатель остаётся выключенным. Повторить вход существующего администратора в отдельном окне и открыть `/admin/`.
6. Сообщить агенту, что переключение выполнено и результат admin входа. После этого агент повторяет settings check и безопасные прямые API проверки отказа регистрации. Запрещать обход только на UI недостаточно; CAPTCHA/validation error сами по себе не доказывают signup-disabled.

Официальный источник: https://supabase.com/docs/guides/auth/general-configuration — отключение Allow new users to sign up сохраняет вход существующих пользователей. Точный UI может измениться; использовать общую настройку, не provider-specific запрет только email signup.
