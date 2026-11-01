/** Proposed revisions remain explicitly unapproved. Never infer an effective date from a code edit. */
export type LegalKind = "privacy" | "terms" | "cookies";
export type LegalSection = { id: string; title: string; titleRu: string; paragraphs: string[]; paragraphsRu: string[] };
export type LegalDocumentData = { title: string; titleRu: string; previousDate: string; previousDateRu: string; status: "review-draft"; effectiveDate: null; sections: LegalSection[]; reviewIssues: string[] };
export const legalDocuments: Record<LegalKind, LegalDocumentData> = {
  "privacy": {
    "title": "Privacy Policy",
    "titleRu": "Политика конфиденциальности",
    "previousDate": "October 29, 2026",
    "previousDateRu": "29 октября 2026 года",
    "status": "review-draft",
    "effectiveDate": null,
    "sections": [
      {
        "id": "operator",
        "title": "Who runs the service",
        "titleRu": "Кто ведёт сервис",
        "paragraphs": [
          "Galstyan’s Speaking Club is founded and hosted by Gevorg Galstyan in Sergiev Posad. The repository identifies the organizer but does not establish the legal identity and address of the personal-data operator.",
          "Before this revision becomes effective, the owner must confirm the operator’s full legal details and a private contact for data requests. The Contact page and official Telegram community provide the current route to the organizer."
        ],
        "paragraphsRu": [
          "Основатель и ведущий Galstyan’s Speaking Club в Сергиевом Посаде — Геворг Галстян. В коде указан организатор, но не подтверждены юридический статус и адрес оператора персональных данных.",
          "До вступления этой редакции в силу владелец должен подтвердить полные сведения об операторе и отдельный контакт для личных запросов. Сейчас связаться с организатором можно через страницу контактов и официальное сообщество Telegram."
        ]
      },
      {
        "id": "registration",
        "title": "Registration information",
        "titleRu": "Данные регистрации",
        "paragraphs": [
          "Email registration requests first name, surname, age, nationality, a gender choice, email and acknowledgement of the displayed Terms and Privacy Policy. The gender choices include “Prefer not to say”; the form currently requires a choice, but not disclosure of gender.",
          "Age is a snapshot, with a recorded date in the planned profile schema; date of birth is not requested. Some additional profile columns are not enabled in the connected database, although registration submissions can still contain these fields in Auth metadata."
        ],
        "paragraphsRu": [
          "При регистрации по почте запрашиваются имя, фамилия, возраст, гражданство, вариант пола, адрес почты и подтверждение ознакомления с показанными условиями и политикой. Среди вариантов пола есть «Предпочитаю не указывать»: форма требует выбрать вариант, но не раскрывать пол.",
          "Возраст — это значение на момент заполнения; предусмотренная схема профиля хранит дату его фиксации. Дата рождения не запрашивается. Часть дополнительных столбцов профиля не включена в подключённой базе, хотя данные регистрации могут содержать эти поля в метаданных Auth."
        ]
      },
      {
        "id": "profile",
        "title": "Profile and optional information",
        "titleRu": "Профиль и необязательные сведения",
        "paragraphs": [
          "A member profile can contain a display name, Telegram username, English level and uploaded photo. Photo, Telegram username and English level are not required by the normal profile editor; onboarding asks for a display name.",
          "Legacy accounts may retain the name or image received from a previous sign-in provider. Uploading a new avatar prepares a smaller JPEG in your browser and stores it in a private bucket."
        ],
        "paragraphsRu": [
          "Профиль может содержать отображаемое имя, имя пользователя Telegram, уровень английского и загруженное фото. Обычная форма не требует фото, Telegram и уровень; при первичной настройке нужно отображаемое имя.",
          "В прежних аккаунтах могут сохраниться имя или фото от ранее использовавшегося провайдера входа. При загрузке аватара браузер создаёт уменьшенный JPEG и отправляет его в закрытое хранилище."
        ]
      },
      {
        "id": "activity",
        "title": "Participation and practice records",
        "titleRu": "Участие и практика",
        "paragraphs": [
          "Member features can record bookings and cancellations, attendance, payment status and recorded amounts/currency, loyalty and special rewards, notifications, explored questions, favorites and continuation state. These records support club operations and your account history.",
          "The current site has no card-payment checkout. Recording payment status is different from collecting card details or taking an online payment."
        ],
        "paragraphsRu": [
          "Функции участника могут хранить записи и отмены, посещения, статус и учтённые суммы и валюту оплаты, обычные и специальные награды, уведомления, изученные вопросы, избранное и продолжение практики. Эти записи нужны для работы клуба и истории в кабинете.",
          "В текущем сайте нет формы оплаты банковской картой. Учёт статуса оплаты отличается от сбора карточных реквизитов или проведения платежа на сайте."
        ]
      },
      {
        "id": "purposes",
        "title": "Purposes and legal bases",
        "titleRu": "Цели и правовые основания",
        "paragraphs": [
          "Email enables account access, verification and recovery. Profile and activity records enable the member interface, event administration, loyalty accounting and synchronization. Security checks protect sign-in and registration from abuse.",
          "The owner must confirm the necessity and lawful basis of each requested field, especially age, nationality and gender choice. Acceptance of Terms or acknowledgement of a Privacy Policy is not, by itself, a completed separate personal-data consent document."
        ],
        "paragraphsRu": [
          "Почта используется для входа, подтверждения и восстановления доступа. Профиль и история обеспечивают работу кабинета, организацию встреч, учёт лояльности и синхронизацию. Проверки безопасности защищают вход и регистрацию от злоупотреблений.",
          "Владелец должен подтвердить необходимость и правовое основание для каждого поля, особенно возраста, гражданства и варианта пола. Принятие условий или ознакомление с политикой само по себе не является оформленным отдельным согласием на обработку персональных данных."
        ]
      },
      {
        "id": "auth",
        "title": "Authentication",
        "titleRu": "Вход и пароли",
        "paragraphs": [
          "Supabase Auth processes account credentials and verification/recovery links. Passwords are not stored in member profile tables; session tokens are saved in browser local storage by the static application.",
          "Keep passwords and email links private, and use Log out on shared devices. Existing provider identities are preserved, but the current registration interface offers email/password access rather than promising a Google login button."
        ],
        "paragraphsRu": [
          "Supabase Auth обрабатывает данные входа и ссылки подтверждения и восстановления. Пароли не хранятся в таблицах профилей; статическое приложение сохраняет токены сессии в локальном хранилище браузера.",
          "Не передавай пароли и ссылки из писем, а на общих устройствах выходи из аккаунта. Прежние идентичности провайдеров сохраняются, но текущая форма предлагает вход по почте и паролю и не обещает кнопку Google."
        ]
      },
      {
        "id": "access",
        "title": "Who can access records",
        "titleRu": "Кто видит записи",
        "paragraphs": [
          "The current member area is not a public member directory. Database row-level rules restrict access to personal records; authorized administrators have broader access for bookings, attendance, payments, rewards, member management and audit history.",
          "Private avatars use temporary signed links subject to storage permissions. Information you post in a Telegram community is governed by that service and the audience you choose; it is not made private by your website account."
        ],
        "paragraphsRu": [
          "Текущий личный кабинет не является публичным каталогом участников. Политики доступа к строкам базы ограничивают личные записи; уполномоченные администраторы имеют расширенный доступ для записей, посещений, оплат, наград, управления участниками и истории действий.",
          "Для закрытых аватаров используются временные подписанные ссылки с проверкой прав хранилища. Сведения, опубликованные тобой в Telegram, подчиняются правилам сервиса и выбранной аудитории; аккаунт сайта не делает их закрытыми."
        ]
      },
      {
        "id": "providers",
        "title": "Service providers",
        "titleRu": "Сторонние сервисы",
        "paragraphs": [
          "Timeweb hosts the public website according to the deployment setup supplied by the owner. Supabase provides authentication, database and file storage. Cloudflare Turnstile processes technical security signals, including IP address and browser information, for anti-bot checks.",
          "Account emails are delivered through the email infrastructure configured for Supabase Auth; the repository includes Resend SMTP setup, but the live provider agreement and delivery configuration need owner confirmation. Opening external social links sends you to those services under their own terms."
        ],
        "paragraphsRu": [
          "По предоставленной владельцем схеме публичный сайт размещён на Timeweb. Supabase предоставляет вход, базу и файловое хранилище. Cloudflare Turnstile обрабатывает технические сигналы, включая IP-адрес и сведения о браузере, для защиты от ботов.",
          "Письма об аккаунте доставляются через почтовую инфраструктуру, настроенную для Supabase Auth; код содержит настройку SMTP Resend, но договор и рабочую конфигурацию должен подтвердить владелец. Переход по внешним социальным ссылкам ведёт на сервисы с собственными условиями."
        ]
      },
      {
        "id": "location",
        "title": "Processing location and transfers",
        "titleRu": "Место обработки и передачи",
        "paragraphs": [
          "The inspected connected Supabase project is configured in the Paris region (eu-west-3), outside Russia. Hosting the static website on Timeweb does not establish that account data is stored in Russia.",
          "The owner must review Russian localization and cross-border-transfer requirements, the relevant notifications and provider arrangements before approving this revision. This text does not certify compliance or claim that data stays in Russia."
        ],
        "paragraphsRu": [
          "Проверенный подключённый проект Supabase настроен в регионе Парижа (eu-west-3), за пределами России. Размещение статического сайта на Timeweb не подтверждает хранение данных аккаунтов в России.",
          "До утверждения редакции владелец должен проверить требования к локализации и трансграничной передаче, необходимые уведомления и отношения с провайдерами. Этот текст не подтверждает соблюдение закона и не утверждает, что данные остаются в России."
        ]
      },
      {
        "id": "browser",
        "title": "Browser storage",
        "titleRu": "Хранилище браузера",
        "paragraphs": [
          "Local storage keeps the session, theme/language preferences, guest question activity, onboarding hints and pending synchronization changes. Session storage holds a resend-cooldown timestamp. These mechanisms are distinct from cookies.",
          "The audited source does not install advertising or audience-analytics scripts. Third-party security and hosting behavior must be checked in the deployed environment; see the separate browser-storage notice for details and controls."
        ],
        "paragraphsRu": [
          "Локальное хранилище содержит сессию, тему и язык, гостевую историю вопросов, подсказки первого входа и изменения, ожидающие синхронизации. Сессионное хранилище содержит таймер повторной отправки письма. Это не то же самое, что cookie.",
          "В проверенном коде нет рекламных скриптов или аналитики аудитории. Поведение сторонней защиты и хостинга нужно проверить на рабочем сайте; сведения и способы управления приведены в отдельном документе о хранилище браузера."
        ]
      },
      {
        "id": "security",
        "title": "Security and limitations",
        "titleRu": "Защита и ограничения",
        "paragraphs": [
          "The application uses verified account checks for protected pages, database/storage access rules and time-limited image links. Administrator audit records support review of sensitive changes.",
          "These controls reduce risk but do not guarantee absolute security. Avoid sending sensitive personal information, passwords or tokens in public messages; request a private conversation for an account issue."
        ],
        "paragraphsRu": [
          "Защищённые страницы проверяют аккаунт; применяются права доступа базы и хранилища, а также временные ссылки на фото. Журнал действий администратора помогает проверять важные изменения.",
          "Эти меры снижают риск, но не гарантируют абсолютной безопасности. Не отправляй чувствительные сведения, пароли и токены в открытых сообщениях; для вопроса об аккаунте попроси личный разговор."
        ]
      },
      {
        "id": "retention",
        "title": "Retention and deletion",
        "titleRu": "Хранение и удаление",
        "paragraphs": [
          "A complete retention schedule for accounts, bookings, payment records, logs and backups is not documented in the repository and must be confirmed before approval. No fixed deletion deadline is invented here; applicable statutory duties must be assessed.",
          "Deleting browser data does not delete server records. The profile interface opens a deletion request in Telegram; the club verifies ownership and reviews any legal retention duties before removing records. It is not an automatic deletion job."
        ],
        "paragraphsRu": [
          "Полные сроки хранения аккаунтов, записей, оплат, журналов и резервных копий в коде не установлены; их нужно подтвердить до утверждения. Здесь не придумывается срок удаления: применимые законные обязанности нужно оценить отдельно.",
          "Очистка браузера не удаляет записи на сервере. Интерфейс профиля открывает запрос удаления в Telegram; клуб проверяет владение аккаунтом и необходимые сроки хранения до удаления. Это не автоматическая процедура удаления."
        ]
      },
      {
        "id": "rights",
        "title": "Requests and controls",
        "titleRu": "Запросы и управление",
        "paragraphs": [
          "You can edit supported profile fields, remove your uploaded avatar and manage question favorites. You can ask the organizer about access, correction, deletion, restrictions or withdrawal of any consent on which processing actually relies; the applicable rights and response periods depend on law.",
          "For privacy requests, start from Contact and ask for a private reply. Do not post passwords or verification links; the owner must supply a dedicated private contact and a verified request-handling process."
        ],
        "paragraphsRu": [
          "Можно менять доступные поля профиля, удалять загруженный аватар и управлять избранными вопросами. У организатора можно запросить доступ, исправление, удаление, ограничение обработки или отзыв согласия, если обработка на нём основана; права и сроки ответа определяются применимым законом.",
          "Для запроса о данных начни со страницы контактов и попроси личный ответ. Не публикуй пароли и ссылки подтверждения; владелец должен указать отдельный закрытый контакт и порядок проверки запросов."
        ]
      },
      {
        "id": "minors",
        "title": "Age and participation",
        "titleRu": "Возраст и участие",
        "paragraphs": [
          "The current registration validator accepts a non-negative age and does not implement an age threshold or parental-consent workflow. This is a description of the software, not permission for every age to participate.",
          "The owner must confirm eligibility, arrangements for minors and any required representative consent before finalizing these documents. Ask the organizer about the event’s age conditions."
        ],
        "paragraphsRu": [
          "Текущая проверка регистрации принимает неотрицательный возраст и не содержит возрастного порога или процедуры согласия представителя. Это описание программы, а не разрешение участвовать людям любого возраста.",
          "До утверждения документов владелец должен определить условия участия несовершеннолетних и необходимые согласия представителей. Возрастные условия встречи уточняй у организатора."
        ]
      },
      {
        "id": "updates",
        "title": "Policy changes and status",
        "titleRu": "Обновления и статус",
        "paragraphs": [
          "This revision is a review draft, not an approved replacement. Its effective date is intentionally unset, and prior acceptance/version records are unchanged.",
          "Any approved revision should state its actual effective date and explain material changes. The owner must confirm how members will be notified; this draft does not promise an unimplemented notification channel."
        ],
        "paragraphsRu": [
          "Эта редакция — проект для проверки, а не утверждённая замена. Дата вступления в силу намеренно не назначена; прежние версии и записи о принятии не изменены.",
          "Утверждённая редакция должна содержать фактическую дату вступления в силу и пояснение важных изменений. Владелец должен определить способ уведомления; проект не обещает несуществующий канал рассылки."
        ]
      }
    ],
    "reviewIssues": [
      "Operator identity, postal/private contact and request process",
      "Purposes, necessity and lawful bases of extra registration fields",
      "Russian localization, cross-border arrangements and regulator notifications",
      "Retention/backups, minors and approval/effective date"
    ]
  },
  "terms": {
    "title": "Terms of Service",
    "titleRu": "Условия использования",
    "previousDate": "September 2026",
    "previousDateRu": "Сентябрь 2026 года",
    "status": "review-draft",
    "effectiveDate": null,
    "sections": [
      {
        "id": "service",
        "title": "The club and website",
        "titleRu": "Клуб и сайт",
        "paragraphs": [
          "Galstyan’s Speaking Club supports in-person English conversation meetups in Sergiev Posad and a question library for practice. It is not described as a formal accredited school, and no certificate or fluency result is promised."
        ],
        "paragraphsRu": [
          "Galstyan’s Speaking Club организует очную разговорную практику на английском в Сергиевом Посаде и предоставляет библиотеку вопросов. Клуб не заявлен как аккредитованная школа; сертификат и конкретный результат владения языком не обещаются."
        ]
      },
      {
        "id": "eligibility",
        "title": "Eligibility and accounts",
        "titleRu": "Участие и аккаунты",
        "paragraphs": [
          "Use accurate information and keep your credentials private. Current sign-up and login use email/password with email verification; legacy provider accounts remain supported through existing identities and recovery paths.",
          "The owner must confirm event eligibility and arrangements for minors. The software’s age field is not an eligibility policy; contact the organizer before booking for a minor."
        ],
        "paragraphsRu": [
          "Указывай достоверные сведения и сохраняй данные входа в тайне. Текущие регистрация и вход используют почту и пароль с подтверждением адреса; прежние аккаунты провайдеров сохраняются через существующие идентичности и восстановление доступа.",
          "Владелец должен подтвердить требования к участникам и условия для несовершеннолетних. Поле возраста в программе не устанавливает правила допуска; перед записью несовершеннолетнего свяжись с организатором."
        ]
      },
      {
        "id": "bookings",
        "title": "Booking and availability",
        "titleRu": "Запись и доступность",
        "paragraphs": [
          "A verified account is required for website bookings. A place is confirmed only after the booking succeeds; capacity, publication status and booking windows can prevent a reservation.",
          "Read the event’s date, Moscow time, venue, capacity, price and instructions. Schedules or venues can change; check current details and announcements rather than relying on an old screenshot."
        ],
        "paragraphsRu": [
          "Для записи на сайте нужен подтверждённый аккаунт. Место подтверждается только после успешного бронирования; лимит, статус публикации и сроки записи могут препятствовать записи.",
          "Проверь дату, московское время, место, вместимость, цену и указания. Расписание и площадка могут меняться; сверяй актуальное описание и объявления, а не старый скриншот."
        ]
      },
      {
        "id": "payments",
        "title": "Prices and payments",
        "titleRu": "Цены и оплата",
        "paragraphs": [
          "Use the price and currency on the published event. The current website records payment status and has no card-payment checkout; confirm payment method, timing and any venue purchases with the organizer before paying.",
          "This draft does not set a standard price, deposit, fee or purchase requirement. Commercial terms still need owner confirmation and must be clearly disclosed for the relevant event."
        ],
        "paragraphsRu": [
          "Ориентируйся на цену и валюту опубликованного события. Текущий сайт хранит статус оплаты и не имеет формы карточного платежа; способ, срок оплаты и покупки на площадке уточняй у организатора заранее.",
          "Этот проект не устанавливает единую цену, предоплату, комиссию или обязательную покупку. Коммерческие условия должен подтвердить владелец и понятно раскрыть для соответствующей встречи."
        ]
      },
      {
        "id": "cancellation",
        "title": "Cancellation, changes and refunds",
        "titleRu": "Отмена, изменения и возврат",
        "paragraphs": [
          "Use the booking cancellation control when available, or contact the organizer. The system preserves cancellation history; a status change is not a payment refund.",
          "Cancellation/refund deadlines and handling of a cancelled or rescheduled event must be confirmed by the owner and disclosed before purchase. No blanket non-refund rule, penalty or waiver of mandatory consumer rights is introduced here."
        ],
        "paragraphsRu": [
          "Используй доступную кнопку отмены или свяжись с организатором. История отмен сохраняется; изменение статуса не означает возврат платежа.",
          "Сроки отмены и возврата, а также действия при переносе или отмене встречи должен подтвердить владелец и раскрыть до оплаты. Здесь не вводятся безусловный отказ в возврате, штраф или отказ от обязательных прав потребителя."
        ]
      },
      {
        "id": "conduct",
        "title": "Respectful participation",
        "titleRu": "Уважительное общение",
        "paragraphs": [
          "Use the website and meetups lawfully and respectfully. Harassment, discrimination, threats, spam, impersonation and attempts to access another account or bypass security are not acceptable.",
          "Respect other participants’ privacy. Do not share someone else’s personal information, account links or photographs without the necessary permission."
        ],
        "paragraphsRu": [
          "Пользуйся сайтом и участвуй во встречах законно и уважительно. Недопустимы травля, дискриминация, угрозы, спам, выдача себя за другого и попытки доступа к чужому аккаунту или обхода защиты.",
          "Уважай приватность участников. Не распространяй чужие личные сведения, ссылки аккаунта и фотографии без необходимых разрешений."
        ]
      },
      {
        "id": "content",
        "title": "Practice content",
        "titleRu": "Материалы для практики",
        "paragraphs": [
          "Questions are conversation prompts, not professional, medical or legal advice. You may skip a topic you do not wish to discuss; the library includes different difficulty levels and does not guarantee that every event suits an absolute beginner."
        ],
        "paragraphsRu": [
          "Вопросы предназначены для общения, а не для профессиональных, медицинских или юридических рекомендаций. Можно пропустить нежелательную тему; разные уровни вопросов не гарантируют пригодность каждой встречи для начинающего с нуля."
        ]
      },
      {
        "id": "loyalty",
        "title": "Loyalty rewards",
        "titleRu": "Награды лояльности",
        "paragraphs": [
          "Six visits recorded as attended and paid qualify for one free-meetup reward under the existing ledger rules. Unpaid visits, no-shows and reward-funded visits do not advance the card; a booking alone is not attendance.",
          "An available reward does not reserve a seat. The organizer records eligible redemption; rewards can have an expiry, and redemption requires an available, unexpired reward. No unimplemented tier benefits are promised."
        ],
        "paragraphsRu": [
          "Шесть встреч, отмеченных как посещённые и оплаченные, дают одну бесплатную встречу по действующим правилам учёта. Неоплаченные посещения, пропуски и встречи по награде карту не продвигают; бронирование не равно посещению.",
          "Доступная награда не резервирует место. Организатор отмечает её использование; у награды может быть срок, а использовать можно только доступную и непросроченную награду. Преимущества несуществующих уровней не обещаются."
        ]
      },
      {
        "id": "access",
        "title": "Account access and requests",
        "titleRu": "Доступ и запросы по аккаунту",
        "paragraphs": [
          "Contact the organizer about a security issue, disputed restriction or deletion request. The current interface does not implement a self-service suspension or instant account-deletion workflow.",
          "The owner must define a fair process for any suspension or termination, including handling existing bookings and payments. This draft does not create an unrestricted right to remove paid access without considering applicable law."
        ],
        "paragraphsRu": [
          "По вопросам безопасности, спорного ограничения доступа или удаления обращайся к организатору. Текущий интерфейс не содержит самостоятельной приостановки или мгновенного удаления аккаунта.",
          "Владелец должен определить справедливый порядок ограничения и прекращения доступа, включая судьбу записей и оплаты. Проект не вводит безусловное право лишать оплаченного участия без учёта применимого закона."
        ]
      },
      {
        "id": "privacy",
        "title": "Personal information",
        "titleRu": "Личные данные",
        "paragraphs": [
          "The Privacy Policy describes account, participation and practice records and third-party processing. Browser storage is explained separately; acknowledgement of these notices is not a substitute for any separate consent that applicable law requires."
        ],
        "paragraphsRu": [
          "В политике конфиденциальности описаны данные аккаунта, участия и практики, а также обработка сторонними сервисами. Хранилище браузера описано отдельно; ознакомление с документами не заменяет отдельное согласие, если оно требуется законом."
        ]
      },
      {
        "id": "availability",
        "title": "Interruptions and responsibility",
        "titleRu": "Перерывы и ответственность",
        "paragraphs": [
          "The website, network or third-party services can be unavailable, and a meetup is not guaranteed merely because it was once listed. Contact the organizer if access problems affect an existing booking.",
          "The service cannot guarantee a learning result or uninterrupted access. Nothing in this draft excludes responsibility or mandatory remedies that cannot lawfully be excluded."
        ],
        "paragraphsRu": [
          "Сайт, сеть и сторонние сервисы могут быть недоступны; прежняя публикация встречи сама по себе не гарантирует её проведение. Если сбой затронул запись, свяжись с организатором.",
          "Сервис не гарантирует учебного результата или непрерывного доступа. Проект не исключает ответственность и обязательные способы защиты, которые нельзя отменить законом."
        ]
      },
      {
        "id": "law",
        "title": "Law and disputes",
        "titleRu": "Закон и споры",
        "paragraphs": [
          "The club operates in Russia; mandatory applicable law must be respected. The operator’s legal status and the appropriate dispute-handling disclosures need confirmation.",
          "Start with the Contact page for a problem. No mandatory arbitration agreement, invented court venue or waiver of consumer rights is imposed by this draft."
        ],
        "paragraphsRu": [
          "Клуб работает в России; обязательные нормы применимого права подлежат соблюдению. Юридический статус оператора и необходимые сведения о рассмотрении споров нужно подтвердить.",
          "При возникновении проблемы начни со страницы контактов. Проект не вводит обязательный арбитраж, выдуманную подсудность или отказ от прав потребителя."
        ]
      },
      {
        "id": "changes",
        "title": "Changes, date and contact",
        "titleRu": "Изменения, дата и контакты",
        "paragraphs": [
          "This proposed revision is not yet effective. The previously published Terms and recorded version remain available below; no past acceptance is rewritten.",
          "Before approval, the owner must complete the legal/commercial details, set an actual effective date and decide how material changes will be communicated. Use Contact for questions and request a private reply for personal matters."
        ],
        "paragraphsRu": [
          "Предложенная редакция ещё не вступила в силу. Ниже доступны прежние опубликованные условия; записи о принятии не переписываются.",
          "До утверждения владелец должен дополнить юридические и коммерческие сведения, назначить фактическую дату и определить способ сообщения о важных изменениях. Вопросы направляй через контакты; для личных тем попроси закрытый ответ."
        ]
      }
    ],
    "reviewIssues": [
      "Legal operator details and private contact",
      "Participation/minors, payments, cancellations and refunds",
      "Fair suspension/dispute procedures and actual effective date"
    ]
  },
  "cookies": {
    "title": "Cookies and Browser Storage",
    "titleRu": "Cookie и хранилище браузера",
    "previousDate": "July 2026",
    "previousDateRu": "Июль 2026 года",
    "status": "review-draft",
    "effectiveDate": null,
    "sections": [
      {
        "id": "technologies",
        "title": "Different browser technologies",
        "titleRu": "Разные технологии браузера",
        "paragraphs": [
          "A cookie is sent with matching network requests. Local storage remains in a browser’s site data, while session storage is scoped to a tab’s session; neither should simply be called a cookie.",
          "The static application does not write first-party cookies in the audited source. This does not certify that hosting or third-party security services never use cookies in production."
        ],
        "paragraphsRu": [
          "Cookie передаётся с подходящими сетевыми запросами. Локальное хранилище остаётся в данных сайта в браузере, а сессионное связано с сеансом вкладки; их нельзя просто называть cookie.",
          "Проверенный код статического приложения не записывает собственные cookie. Это не подтверждает полного отсутствия cookie у хостинга и сторонних служб безопасности на рабочем сайте."
        ]
      },
      {
        "id": "session",
        "title": "Essential account access",
        "titleRu": "Доступ к аккаунту",
        "paragraphs": [
          "Supabase Auth uses a local-storage key in the sb-…-auth-token family for the saved session; PKCE recovery/callback flows may also use a temporary verifier. Session refresh and expiry are managed by the SDK, so there is no universal storage lifetime asserted here.",
          "Blocking access to browser storage can prevent persistent sign-in. Use Log out on shared devices; clearing site data can also remove the session and unfinished verification context."
        ],
        "paragraphsRu": [
          "Supabase Auth сохраняет сессию в локальном ключе семейства sb-…-auth-token; для PKCE-переходов может временно сохраняться код проверки. Обновление и срок сессии управляются SDK, поэтому здесь не устанавливается единый срок хранения.",
          "Блокировка хранилища может мешать постоянному входу. На общих устройствах выходи из аккаунта; очистка данных сайта также удаляет сессию и незавершённые сведения подтверждения."
        ]
      },
      {
        "id": "preferences",
        "title": "Preferences and hints",
        "titleRu": "Настройки и подсказки",
        "paragraphs": [
          "The keys gsc-theme and gsc-language remember theme and the translated-interface preference. Onboarding guidance also uses a local dismissal flag so a hint need not reappear repeatedly.",
          "These preferences stay in that browser until changed or cleared; they are not an advertising profile. If storage is unavailable, durable preference saving may not work."
        ],
        "paragraphsRu": [
          "Ключи gsc-theme и gsc-language запоминают тему и язык переведённых разделов. Для подсказок первого входа также используется локальная отметка скрытия, чтобы не показывать их постоянно.",
          "Настройки остаются в браузере до изменения или очистки; это не рекламный профиль. При недоступном хранилище постоянное сохранение настроек может не работать."
        ]
      },
      {
        "id": "questions",
        "title": "Question practice and synchronization",
        "titleRu": "Практика и синхронизация вопросов",
        "paragraphs": [
          "Local keys gsc_question_progress_v3, gsc_question_favorites_v1 and gsc_question_deck_state_v1 keep guest activity; an older gsc_seen_questions_v2 key may be read for compatibility. Per-account gsc_question_account_merge_v1:… and gsc_question_pending_v1:… keys track imports and pending changes.",
          "The account synchronizes supported question data with Supabase. Wait for pending changes to finish before clearing local data; clearing the browser does not delete records already stored in the account."
        ],
        "paragraphsRu": [
          "Локальные ключи gsc_question_progress_v3, gsc_question_favorites_v1 и gsc_question_deck_state_v1 хранят гостевую практику; старый gsc_seen_questions_v2 может читаться для совместимости. Ключи аккаунта gsc_question_account_merge_v1:… и gsc_question_pending_v1:… отслеживают перенос и ожидающие изменения.",
          "Доступные данные вопросов синхронизируются с Supabase. Перед очисткой дождись отправки изменений; очистка браузера не удаляет уже сохранённые записи аккаунта."
        ]
      },
      {
        "id": "security",
        "title": "Security and resend cooldown",
        "titleRu": "Защита и таймер писем",
        "paragraphs": [
          "Session storage uses gsc:email-resend-after for the resend cooldown. It is a local UI timer, not a replacement for server-side rate limiting.",
          "Cloudflare Turnstile runs on authentication forms and processes technical anti-bot signals. A Cloudflare clearance cookie can depend on deployment/widget configuration; its presence, retention and lawful basis must be checked on the live site rather than inferred from this code."
        ],
        "paragraphsRu": [
          "Сессионное хранилище использует gsc:email-resend-after для таймера повторной отправки письма. Это локальный таймер интерфейса, а не замена серверному ограничению запросов.",
          "Cloudflare Turnstile работает в формах входа и обрабатывает технические сигналы защиты от ботов. Наличие cookie допуска Cloudflare зависит от конфигурации; факт использования, срок и правовое основание нужно проверять на рабочем сайте, а не выводить из кода."
        ]
      },
      {
        "id": "tracking",
        "title": "Analytics and external services",
        "titleRu": "Аналитика и внешние сервисы",
        "paragraphs": [
          "The audited application contains no Google Analytics, Yandex Metrica, advertising pixel or marketing-cookie integration. The social destinations are ordinary outbound links, not embedded social feeds.",
          "This source audit cannot verify the host’s logs or all provider-side settings. The owner must confirm those arrangements and reassess consent before adding any non-essential tracking; no pretend accept/reject banner is added here."
        ],
        "paragraphsRu": [
          "В проверенном приложении нет интеграции Google Analytics, Яндекс Метрики, рекламного пикселя или маркетинговых cookie. Социальные сети открываются обычными ссылками, а не встроенными лентами.",
          "Проверка кода не подтверждает настройки журналов хостинга и всех провайдеров. Владелец должен проверить их и заново оценить согласие перед добавлением необязательного отслеживания; формальный баннер без реального выбора здесь не добавляется."
        ]
      },
      {
        "id": "controls",
        "title": "Managing site data",
        "titleRu": "Управление данными сайта",
        "paragraphs": [
          "Use your browser’s site-data settings for galstyansspeakingclub.ru to inspect or clear cookies and local/session storage. Browser controls differ; blocking cookies alone does not necessarily clear local storage.",
          "Clearing site data can sign you out, reset preferences and remove guest history or pending synchronization. Request account-data deletion separately through the profile/organizer; do not send storage values or tokens to a public chat."
        ],
        "paragraphsRu": [
          "В настройках данных сайта galstyansspeakingclub.ru можно посмотреть и очистить cookie и локальное/сессионное хранилище. Названия настроек зависят от браузера; блокировка cookie сама по себе не обязательно очищает локальное хранилище.",
          "Очистка может завершить вход, сбросить настройки и удалить гостевую историю или ожидающую синхронизацию. Удаление данных аккаунта запрашивается отдельно через профиль или организатора; не отправляй содержимое хранилища и токены в открытый чат."
        ]
      },
      {
        "id": "review",
        "title": "Review and effective date",
        "titleRu": "Проверка и дата действия",
        "paragraphs": [
          "This is a proposed, source-based storage notice, not a statement that every production provider setting has been verified. The owner must review actual third-party behavior, lawful bases and any consent needs before approving an effective date."
        ],
        "paragraphsRu": [
          "Это проект уведомления по результатам проверки кода, а не утверждение о проверке всех настроек рабочего сервиса. До назначения даты действия владелец должен проверить стороннюю обработку, правовые основания и необходимость согласий."
        ]
      }
    ],
    "reviewIssues": [
      "Live hosting/Turnstile cookies, logs and retention",
      "Lawful bases and any required consent controls",
      "Operator contact and actual effective date"
    ]
  }
};
