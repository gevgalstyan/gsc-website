/** Reviewed bilingual help content. Stable IDs keep accordion anchors identical in both languages. */
export const faqCategories = ["About the club", "English level", "Meetups", "Member account", "Booking and payments", "Loyalty", "Website features", "Privacy and security"] as const;
export type FaqCategory = typeof faqCategories[number];
export type FaqItem = { id: string; category: FaqCategory; question: string; answer: string; ru: { question: string; answer: string }; links?: readonly { label: string; labelRu: string; href: string }[] };
export const faqCategoryRu: Record<FaqCategory,string> = {"About the club":"О клубе","English level":"Уровень английского","Meetups":"Встречи","Member account":"Аккаунт","Booking and payments":"Запись и оплата","Loyalty":"Лояльность","Website features":"Функции сайта","Privacy and security":"Данные и безопасность"};
export const faqItems: readonly FaqItem[] = [
  {
    "id": "what-is-gsc",
    "category": "About the club",
    "question": "What is Galstyan’s Speaking Club?",
    "answer": "A local English conversation community in Sergiev Posad. Participants practise speaking through group discussions and conversation prompts, with confidence and communication as the focus.",
    "ru": {
      "question": "Что такое Galstyan’s Speaking Club?",
      "answer": "Это местное сообщество разговорного английского в Сергиевом Посаде. Участники практикуют речь в групповых обсуждениях с вопросами-подсказками; главное — общение и уверенность."
    },
    "links": [
      {
        "label": "About the host",
        "labelRu": "Об организаторе",
        "href": "/about/"
      }
    ]
  },
  {
    "id": "school",
    "category": "About the club",
    "question": "Is this an English school or a course?",
    "answer": "The club offers conversation practice rather than a formal course. It does not advertise grades, exams or certificates; use it to practise what you know, alongside any lessons you choose.",
    "ru": {
      "question": "Это школа английского или учебный курс?",
      "answer": "Клуб предлагает разговорную практику, а не полноценный учебный курс. Оценки, экзамены и сертификаты не заявлены: здесь можно применять знания в дополнение к занятиям, которые ты выберешь."
    }
  },
  {
    "id": "host",
    "category": "About the club",
    "question": "Who organizes the club?",
    "answer": "Gevorg Galstyan founded and hosts Galstyan’s Speaking Club. Use Contact for practical questions about the group or an upcoming meetup.",
    "ru": {
      "question": "Кто организует клуб?",
      "answer": "Основатель и ведущий Galstyan’s Speaking Club — Геворг Галстян. В разделе «Контакты» можно задать вопросы о клубе или предстоящей встрече."
    },
    "links": [
      {
        "label": "About the host",
        "labelRu": "Об организаторе",
        "href": "/about/"
      }
    ]
  },
  {
    "id": "confidence",
    "category": "About the club",
    "question": "Can the club help me feel more confident?",
    "answer": "Regular conversation gives you practice speaking, listening and asking follow-up questions. You can begin with short answers; the club cannot promise a particular fluency level or result.",
    "ru": {
      "question": "Поможет ли клуб стать увереннее?",
      "answer": "Регулярное общение даёт практику речи, восприятия на слух и уточняющих вопросов. Можно начать с коротких ответов; клуб не обещает конкретный уровень языка или гарантированный результат."
    }
  },
  {
    "id": "level",
    "category": "English level",
    "question": "What English level do I need?",
    "answer": "The question library has beginner, intermediate and advanced prompts. Check the requirements of the particular meetup or ask the host: library levels do not define admission to every event.",
    "ru": {
      "question": "Какой уровень английского нужен?",
      "answer": "В библиотеке есть вопросы начального, среднего и продвинутого уровней. Требования конкретной встречи уточняй в её описании или у ведущего: уровни вопросов не определяют условия участия во всех мероприятиях."
    },
    "links": [
      {
        "label": "Browse meetups",
        "labelRu": "Посмотреть встречи",
        "href": "/meetups/"
      }
    ]
  },
  {
    "id": "beginners",
    "category": "English level",
    "question": "Can beginners or absolute beginners participate?",
    "answer": "Beginner prompts can help with simple answers and vocabulary. They do not guarantee that every meetup suits someone starting from zero; ask the host about the group and support before booking.",
    "ru": {
      "question": "Можно ли участвовать начинающим и тем, кто начинает с нуля?",
      "answer": "Вопросы начального уровня помогают тренировать простые ответы и словарный запас. Но это не означает, что любая встреча подходит человеку с нулевым уровнем: перед записью уточни состав группы и доступную помощь."
    },
    "links": [
      {
        "label": "Contact the organizer",
        "labelRu": "Связаться с организатором",
        "href": "/contact/"
      }
    ]
  },
  {
    "id": "understand",
    "category": "English level",
    "question": "What if I understand English but struggle to speak?",
    "answer": "You can practise turning what you understand into short spoken answers. Listen, ask for a question to be repeated, and take your time; check with the host if you need a slower group.",
    "ru": {
      "question": "Что делать, если я понимаю английский, но мне трудно говорить?",
      "answer": "Здесь можно тренироваться превращать знакомые слова в короткие устные ответы. Слушай, проси повторить вопрос и отвечай в своём темпе; если нужна более спокойная группа, уточни это у ведущего."
    }
  },
  {
    "id": "mistakes",
    "category": "English level",
    "question": "Will my mistakes be corrected?",
    "answer": "Mistakes are expected, and perfect grammar is not a condition of conversation. Individual correction is not a guaranteed service; ask the host how feedback is handled in your meetup.",
    "ru": {
      "question": "Будут ли исправлять мои ошибки?",
      "answer": "Ошибки естественны, а идеальная грамматика не обязательна для общения. Индивидуальная коррекция не заявлена как гарантированная услуга; уточни у ведущего, как устроена обратная связь на твоей встрече."
    }
  },
  {
    "id": "nervous",
    "category": "English level",
    "question": "What if I am shy or have not practised for years?",
    "answer": "Prepared prompts give you a starting point, so you need not invent a topic. Start with a short introduction or answer, and contact the host beforehand if you are unsure about the pace.",
    "ru": {
      "question": "Что делать, если я стесняюсь или давно не практиковался?",
      "answer": "Готовые вопросы помогают начать разговор без необходимости придумывать тему. Можно начать с короткого знакомства или ответа; если сомневаешься в темпе, заранее напиши ведущему."
    }
  },
  {
    "id": "english-only",
    "category": "English level",
    "question": "Are discussions entirely in English?",
    "answer": "The club is designed around English conversation. Any explanations or extra support depend on the published format and host; do not assume translation or a Russian-language lesson is included.",
    "ru": {
      "question": "Обсуждения проходят полностью на английском?",
      "answer": "Клуб ориентирован на разговорную практику на английском. Пояснения и дополнительная помощь зависят от формата встречи и ведущего; перевод или урок на русском не входят в программу по умолчанию."
    }
  },
  {
    "id": "venue",
    "category": "Meetups",
    "question": "Where are meetings held?",
    "answer": "The club is based in Sergiev Posad, Moscow Region. Each published meetup gives its venue and address; check that event rather than assuming the same location every time.",
    "ru": {
      "question": "Где проходят встречи?",
      "answer": "Клуб находится в Сергиевом Посаде Московской области. Место и адрес указаны в описании опубликованной встречи; не стоит рассчитывать, что площадка всегда одна и та же."
    },
    "links": [
      {
        "label": "Browse meetups",
        "labelRu": "Посмотреть встречи",
        "href": "/meetups/"
      }
    ]
  },
  {
    "id": "duration",
    "category": "Meetups",
    "question": "How long does a meetup last?",
    "answer": "Use the start and end times on the meetup card. Times are shown for Europe/Moscow; there is no single duration promised for all events.",
    "ru": {
      "question": "Сколько длится встреча?",
      "answer": "Ориентируйся на время начала и окончания в карточке встречи. Время указано для Москвы; единой продолжительности для всех событий не заявлено."
    },
    "links": [
      {
        "label": "Browse meetups",
        "labelRu": "Посмотреть встречи",
        "href": "/meetups/"
      }
    ]
  },
  {
    "id": "frequency",
    "category": "Meetups",
    "question": "How often are meetings organized?",
    "answer": "Only published upcoming meetups are available for booking. Follow the meetup page and Telegram announcements for actual dates; a standing weekly schedule is not guaranteed here.",
    "ru": {
      "question": "Как часто проходят встречи?",
      "answer": "Записаться можно на опубликованные предстоящие встречи. Актуальные даты ищи на сайте и в объявлениях Telegram; постоянное еженедельное расписание здесь не гарантируется."
    },
    "links": [
      {
        "label": "Browse meetups",
        "labelRu": "Посмотреть встречи",
        "href": "/meetups/"
      }
    ]
  },
  {
    "id": "capacity",
    "category": "Meetups",
    "question": "How many people will be there?",
    "answer": "Each meetup has a capacity and a remaining-place count. These are booking limits, not a promise of final attendance; the actual group may be smaller.",
    "ru": {
      "question": "Сколько будет участников?",
      "answer": "У встречи есть лимит участников и счётчик свободных мест. Это ограничения записи, а не гарантия фактической посещаемости: группа может оказаться меньше."
    },
    "links": [
      {
        "label": "Browse meetups",
        "labelRu": "Посмотреть встречи",
        "href": "/meetups/"
      }
    ]
  },
  {
    "id": "format",
    "category": "Meetups",
    "question": "What happens and what topics do we discuss?",
    "answer": "The host guides English conversation using questions or speaking activities. Topics range across the question library, and any special theme or format belongs in the event description.",
    "ru": {
      "question": "Что происходит на встрече и какие темы обсуждаются?",
      "answer": "Ведущий направляет общение на английском с помощью вопросов или разговорных заданий. Темы могут быть разными; специальная тема или формат должны быть указаны в описании события."
    },
    "links": [
      {
        "label": "Explore questions",
        "labelRu": "Открыть вопросы",
        "href": "/questions/"
      }
    ]
  },
  {
    "id": "alone",
    "category": "Meetups",
    "question": "Can I attend alone?",
    "answer": "Yes: you do not need to arrive with a group. The conversation format gives you a shared starting point for meeting other participants.",
    "ru": {
      "question": "Можно ли прийти одному?",
      "answer": "Да, приходить своей компанией не обязательно. Разговорный формат даёт общую отправную точку для знакомства с другими участниками."
    }
  },
  {
    "id": "friend",
    "category": "Meetups",
    "question": "Can I bring a friend?",
    "answer": "Each participant needs a place within the meetup capacity. Your friend should make their own booking or confirm arrangements with the organizer; one account booking does not reserve two seats.",
    "ru": {
      "question": "Можно ли привести друга?",
      "answer": "Для каждого участника нужно отдельное место в пределах лимита встречи. Другу следует записаться самому или согласовать участие с организатором: одно бронирование не резервирует два места."
    },
    "links": [
      {
        "label": "Browse meetups",
        "labelRu": "Посмотреть встречи",
        "href": "/meetups/"
      }
    ]
  },
  {
    "id": "bring",
    "category": "Meetups",
    "question": "What should I bring or prepare?",
    "answer": "Read the event description for any specific instructions. Otherwise, come ready to introduce yourself and take part; ask the organizer about venue purchases or materials rather than assuming they are included.",
    "ru": {
      "question": "Что взять с собой и нужно ли готовиться?",
      "answer": "Проверь особые указания в описании события. В остальном будь готов представиться и общаться; условия покупок на площадке и наличие материалов лучше уточнить, а не считать их включёнными."
    }
  },
  {
    "id": "register",
    "category": "Member account",
    "question": "How do I create an account?",
    "answer": "Open Registration, complete the requested fields, accept the displayed Terms/Privacy acknowledgement and pass the security check. Then follow the verification link sent to your email before accessing member features.",
    "ru": {
      "question": "Как создать аккаунт?",
      "answer": "Открой регистрацию, заполни запрашиваемые поля, подтверди ознакомление с показанными условиями и политикой и пройди проверку безопасности. Затем подтверди адрес по ссылке из письма, чтобы пользоваться функциями участника."
    },
    "links": [
      {
        "label": "Registration",
        "labelRu": "Регистрация",
        "href": "/signup/"
      }
    ]
  },
  {
    "id": "account-required",
    "category": "Member account",
    "question": "Do I need an account to attend?",
    "answer": "The website requires a verified account for online bookings. Public pages and questions are accessible without one; if you cannot use online registration, ask the organizer about participation rather than assuming you have a seat.",
    "ru": {
      "question": "Нужен ли аккаунт для посещения?",
      "answer": "Для бронирования через сайт нужен подтверждённый аккаунт. Публичные страницы и вопросы доступны без него; если регистрация недоступна, обсуди участие с организатором, но не считай место забронированным."
    },
    "links": [
      {
        "label": "Contact the organizer",
        "labelRu": "Связаться с организатором",
        "href": "/contact/"
      }
    ]
  },
  {
    "id": "verification",
    "category": "Member account",
    "question": "How do I verify my email?",
    "answer": "Use the newest verification email and follow its confirmation action. Links are private and single-use; an expired or already used link can be replaced from the verification page.",
    "ru": {
      "question": "Как подтвердить электронную почту?",
      "answer": "Открой последнее письмо подтверждения и выполни действие по ссылке. Ссылка личная и одноразовая; если она истекла или уже использована, запроси новую на странице подтверждения."
    },
    "links": [
      {
        "label": "Request verification email",
        "labelRu": "Запросить письмо подтверждения",
        "href": "/verify-email/"
      }
    ]
  },
  {
    "id": "no-email",
    "category": "Member account",
    "question": "What if the verification email does not arrive?",
    "answer": "Check spam and the address you entered, then request another message after the resend cooldown. Use the latest link, and contact the club if delivery still fails; a website request is not proof that mail arrived.",
    "ru": {
      "question": "Что делать, если письмо подтверждения не пришло?",
      "answer": "Проверь спам и введённый адрес, затем запроси письмо ещё раз после окончания таймера. Используй последнюю ссылку; если доставка не работает, свяжись с клубом: отправка запроса на сайте не гарантирует получение письма."
    },
    "links": [
      {
        "label": "Request verification email",
        "labelRu": "Запросить письмо подтверждения",
        "href": "/verify-email/"
      }
    ]
  },
  {
    "id": "password",
    "category": "Member account",
    "question": "How do I reset my password?",
    "answer": "Open Password recovery and enter your account email, then complete the security check. Follow the newest recovery email, set a new password and log in again when asked.",
    "ru": {
      "question": "Как восстановить пароль?",
      "answer": "Открой восстановление пароля, укажи адрес аккаунта и пройди проверку безопасности. Перейди по последнему письму, задай новый пароль и войди снова, когда сайт попросит."
    },
    "links": [
      {
        "label": "Password recovery",
        "labelRu": "Восстановить пароль",
        "href": "/forgot-password/"
      }
    ]
  },
  {
    "id": "legacy-google",
    "category": "Member account",
    "question": "Can an existing Google member use email login?",
    "answer": "Existing provider accounts are preserved. Use password recovery with the same account email to set a password if supported by your account; do not create a replacement account just to change sign-in method.",
    "ru": {
      "question": "Может ли прежний участник с Google входить по почте?",
      "answer": "Существующие аккаунты внешних провайдеров сохраняются. Попробуй восстановление пароля для того же адреса, чтобы установить пароль, если аккаунт это поддерживает; не создавай новый аккаунт только ради другого способа входа."
    },
    "links": [
      {
        "label": "Password recovery",
        "labelRu": "Восстановить пароль",
        "href": "/forgot-password/"
      }
    ]
  },
  {
    "id": "edit-profile",
    "category": "Member account",
    "question": "How do I edit my profile?",
    "answer": "Open My account and scroll to Account settings. Save changes using the relevant form; additional registration fields appear only when the connected database supports them.",
    "ru": {
      "question": "Как отредактировать профиль?",
      "answer": "Открой «Мой аккаунт» и перейди к настройкам. Сохраняй изменения соответствующей кнопкой формы; дополнительные поля регистрации доступны, только если их поддерживает подключённая база."
    },
    "links": [
      {
        "label": "My account",
        "labelRu": "Мой аккаунт",
        "href": "/account/"
      }
    ]
  },
  {
    "id": "photo",
    "category": "Member account",
    "question": "How do I upload a profile picture on an iPhone?",
    "answer": "In Account settings, choose a photo, frame it and save it. JPEG, PNG and WebP are supported; HEIC needs a browser decoder, otherwise export as JPEG. Source files can be up to 20 MB and are prepared as a smaller JPEG before upload.",
    "ru": {
      "question": "Как загрузить фото профиля с iPhone?",
      "answer": "В настройках аккаунта выбери фото, настрой кадр и сохрани. Поддерживаются JPEG, PNG и WebP; для HEIC нужна поддержка браузера, иначе экспортируй фото в JPEG. Исходник может занимать до 20 МБ; перед загрузкой создаётся уменьшенный JPEG."
    },
    "links": [
      {
        "label": "My account",
        "labelRu": "Мой аккаунт",
        "href": "/account/"
      }
    ]
  },
  {
    "id": "logout",
    "category": "Member account",
    "question": "How do I sign out or use a shared device?",
    "answer": "Use Log out in the account navigation or profile menu. Closing a tab does not necessarily end a saved session; avoid saving your login on a shared device.",
    "ru": {
      "question": "Как выйти из аккаунта и пользоваться общим устройством?",
      "answer": "Нажми «Выйти» в навигации аккаунта или меню профиля. Закрытие вкладки не обязательно завершает сохранённую сессию; не сохраняй вход на общем устройстве."
    },
    "links": [
      {
        "label": "My account",
        "labelRu": "Мой аккаунт",
        "href": "/account/"
      }
    ]
  },
  {
    "id": "delete",
    "category": "Member account",
    "question": "How do I delete my account?",
    "answer": "Account settings contains a deletion-request section that opens Telegram. This sends you to the organizer for a verified request; it is not an instant delete button, and records are not removed merely by opening the link.",
    "ru": {
      "question": "Как удалить аккаунт?",
      "answer": "В настройках есть раздел запроса удаления с переходом в Telegram. Он помогает обратиться к организатору для проверки запроса: это не кнопка мгновенного удаления, и сам переход по ссылке ничего не удаляет."
    },
    "links": [
      {
        "label": "Privacy information",
        "labelRu": "Конфиденциальность",
        "href": "/privacy/"
      }
    ]
  },
  {
    "id": "personal-fields",
    "category": "Member account",
    "question": "Why does registration ask for personal information?",
    "answer": "Email supports sign-in and account messages; profile fields support the member area. The current form also requests name, age snapshot, nationality and a gender choice, including “Prefer not to say”; the detailed purposes and necessity of the extra fields require owner review in the privacy revision.",
    "ru": {
      "question": "Зачем при регистрации запрашивают личные данные?",
      "answer": "Почта нужна для входа и сообщений об аккаунте, а поля профиля — для личного кабинета. Форма также запрашивает имя, возраст на момент заполнения, гражданство и вариант пола, включая «Предпочитаю не указывать»; цели и необходимость дополнительных полей требуют уточнения владельцем в новой политике."
    },
    "links": [
      {
        "label": "Privacy information",
        "labelRu": "Конфиденциальность",
        "href": "/privacy/"
      }
    ]
  },
  {
    "id": "book",
    "category": "Booking and payments",
    "question": "How do I book a place?",
    "answer": "Sign in, open Meetups and choose an event with booking open and places remaining. Press Book my place and wait for a success message; the database checks availability and your booking.",
    "ru": {
      "question": "Как забронировать место?",
      "answer": "Войди в аккаунт, открой встречи и выбери событие с открытой записью и свободными местами. Нажми кнопку бронирования и дождись подтверждения; доступность и бронирование проверяются базой."
    },
    "links": [
      {
        "label": "Browse meetups",
        "labelRu": "Посмотреть встречи",
        "href": "/meetups/"
      }
    ]
  },
  {
    "id": "confirmation",
    "category": "Booking and payments",
    "question": "How do I know my booking succeeded?",
    "answer": "The control changes to Booked after a successful booking, and your account lists confirmed bookings. If a request reports an error, check your account before trying again; clicking a button alone does not confirm a seat.",
    "ru": {
      "question": "Как понять, что бронирование прошло?",
      "answer": "После успешной записи кнопка показывает статус бронирования, а встреча появляется среди подтверждённых записей в аккаунте. Если возникла ошибка, сначала проверь кабинет: само нажатие кнопки ещё не подтверждает место."
    },
    "links": [
      {
        "label": "My account",
        "labelRu": "Мой аккаунт",
        "href": "/account/"
      }
    ]
  },
  {
    "id": "cancel",
    "category": "Booking and payments",
    "question": "Can I cancel a booking?",
    "answer": "Use the Booked / Cancel control for your booking while cancellation is permitted. The system retains cancellation history; cancelling a booking does not itself process a refund.",
    "ru": {
      "question": "Можно ли отменить бронирование?",
      "answer": "Используй действие отмены у своей записи, пока отмена разрешена. История отмен сохраняется; отмена места сама по себе не оформляет возврат денег."
    },
    "links": [
      {
        "label": "My account",
        "labelRu": "Мой аккаунт",
        "href": "/account/"
      }
    ]
  },
  {
    "id": "cannot-attend",
    "category": "Booking and payments",
    "question": "What if I cannot attend?",
    "answer": "Cancel your place if the website permits it, and contact the organizer if it does not. Check the published event conditions and ask about any payment already made; no automatic refund is promised by the booking control.",
    "ru": {
      "question": "Что делать, если я не смогу прийти?",
      "answer": "Отмени место, если сайт это позволяет; иначе напиши организатору. Проверь условия события и уточни судьбу уже внесённой оплаты: кнопка отмены не обещает автоматический возврат."
    },
    "links": [
      {
        "label": "Contact the organizer",
        "labelRu": "Связаться с организатором",
        "href": "/contact/"
      }
    ]
  },
  {
    "id": "price",
    "category": "Booking and payments",
    "question": "How much does participation cost?",
    "answer": "The price and currency are shown on the published meetup card. Read any event-specific conditions before booking; this FAQ does not set a universal price.",
    "ru": {
      "question": "Сколько стоит участие?",
      "answer": "Цена и валюта указаны в карточке опубликованной встречи. Перед записью прочитай условия конкретного события; единой цены в этом FAQ не устанавливается."
    },
    "links": [
      {
        "label": "Browse meetups",
        "labelRu": "Посмотреть встречи",
        "href": "/meetups/"
      }
    ]
  },
  {
    "id": "payment",
    "category": "Booking and payments",
    "question": "Can I pay online or at the meetup?",
    "answer": "This website records payment status but does not provide a card checkout in the current implementation. Ask the organizer which payment methods and timing apply to your event, including whether payment on arrival is possible.",
    "ru": {
      "question": "Можно ли оплатить на сайте или при встрече?",
      "answer": "Текущая версия сайта хранит статус оплаты, но не содержит формы оплаты банковской картой. Уточни у организатора способы и сроки оплаты выбранной встречи, в том числе возможность оплаты на месте."
    },
    "links": [
      {
        "label": "Contact the organizer",
        "labelRu": "Связаться с организатором",
        "href": "/contact/"
      }
    ]
  },
  {
    "id": "refunds",
    "category": "Booking and payments",
    "question": "Are refunds available?",
    "answer": "There is no universal refund schedule configured in the site. Ask the organizer for the event’s terms and submit any request directly; mandatory rights are not waived by this FAQ or by a cancellation button.",
    "ru": {
      "question": "Можно ли вернуть оплату?",
      "answer": "Единые сроки и правила возврата на сайте не настроены. Уточни условия выбранного события и направь запрос организатору; этот FAQ и кнопка отмены не отменяют обязательных прав потребителя."
    },
    "links": [
      {
        "label": "Contact the organizer",
        "labelRu": "Связаться с организатором",
        "href": "/contact/"
      }
    ]
  },
  {
    "id": "full",
    "category": "Booking and payments",
    "question": "What if all places are booked?",
    "answer": "A full event cannot accept another normal booking. Check for a released place or another event, or contact the host; the website does not currently promise a waiting list.",
    "ru": {
      "question": "Что делать, если все места заняты?",
      "answer": "На заполненную встречу нельзя оформить обычное бронирование. Проверь, не освободилось ли место, выбери другую дату или напиши ведущему; лист ожидания на сайте сейчас не обещается."
    },
    "links": [
      {
        "label": "Browse meetups",
        "labelRu": "Посмотреть встречи",
        "href": "/meetups/"
      }
    ]
  },
  {
    "id": "loyalty-rule",
    "category": "Loyalty",
    "question": "How does the loyalty program work?",
    "answer": "Six qualifying visits earn one free-meetup reward. A qualifying visit is recorded as both attended and paid; booking alone or paying without attendance does not qualify.",
    "ru": {
      "question": "Как работает программа лояльности?",
      "answer": "Шесть зачётных посещений дают награду — одну бесплатную встречу. Посещение должно быть отмечено как состоявшееся и оплаченное; одна запись или оплата без посещения не засчитывается."
    },
    "links": [
      {
        "label": "My account",
        "labelRu": "Мой аккаунт",
        "href": "/account/"
      }
    ]
  },
  {
    "id": "unpaid",
    "category": "Loyalty",
    "question": "Do unpaid visits, no-shows or free visits count?",
    "answer": "No: only attendance marked attended with payment status paid advances the card. Unpaid, absent and reward-funded visits are excluded from qualifying progress.",
    "ru": {
      "question": "Считаются ли неоплаченные, пропущенные или бесплатные встречи?",
      "answer": "Нет: карту продвигают только посещения со статусами «Посетил» и «Оплачено». Неоплаченные встречи, пропуски и посещения по награде в зачётный прогресс не входят."
    }
  },
  {
    "id": "progress",
    "category": "Loyalty",
    "question": "Where can I see my loyalty progress?",
    "answer": "Open My account and find Your Loyalty Card. It shows qualifying progress and available rewards from recorded club activity; contact the organizer if an attended or paid visit is missing.",
    "ru": {
      "question": "Где посмотреть прогресс лояльности?",
      "answer": "Открой личный кабинет и найди карту лояльности. Она показывает прогресс и доступные награды по записям клуба; если оплаченное посещение не учтено, напиши организатору."
    },
    "links": [
      {
        "label": "My account",
        "labelRu": "Мой аккаунт",
        "href": "/account/"
      }
    ]
  },
  {
    "id": "earn-redeem",
    "category": "Loyalty",
    "question": "What happens after I earn a free-meetup reward?",
    "answer": "The reward ledger records an available reward when qualifying attendance is reconciled. The club records the qualifying free visit to redeem it; earning a reward does not automatically book a seat.",
    "ru": {
      "question": "Что происходит после получения бесплатной встречи?",
      "answer": "При обработке зачётных посещений система учитывает доступную награду. Для её использования клуб отмечает соответствующее бесплатное посещение; награда сама по себе не бронирует место."
    },
    "links": [
      {
        "label": "Contact the organizer",
        "labelRu": "Связаться с организатором",
        "href": "/contact/"
      }
    ]
  },
  {
    "id": "expiry",
    "category": "Loyalty",
    "question": "Do rewards expire?",
    "answer": "Rewards can carry an expiry date. The database redeems a free-meetup reward only while it is available and unexpired; automatic issuance does not set a universal fixed lifetime. Ask the organizer about the conditions of your reward.",
    "ru": {
      "question": "Сгорают ли награды?",
      "answer": "У награды может быть срок действия. База разрешает использовать бесплатную встречу, только пока награда доступна и не просрочена; автоматическая выдача не устанавливает единый срок для всех. Условия своей награды уточняй у организатора."
    }
  },
  {
    "id": "questions",
    "category": "Website features",
    "question": "What are the 2,000 conversation questions?",
    "answer": "The library contains 2,000 prompts across 20 categories, with beginner, intermediate and advanced levels. Use filters and the next/previous controls to practise between meetups.",
    "ru": {
      "question": "Что представляют собой 2 000 разговорных вопросов?",
      "answer": "Библиотека содержит 2 000 вопросов в 20 категориях, с начальным, средним и продвинутым уровнями. Пользуйся фильтрами и кнопками перехода для практики между встречами."
    },
    "links": [
      {
        "label": "Explore questions",
        "labelRu": "Открыть вопросы",
        "href": "/questions/"
      }
    ]
  },
  {
    "id": "guest-questions",
    "category": "Website features",
    "question": "Can I use questions without an account?",
    "answer": "Yes. Guest favorites and progress stay in that browser when storage is available; clearing site data or using another browser will not restore guest history.",
    "ru": {
      "question": "Можно ли пользоваться вопросами без аккаунта?",
      "answer": "Да. Избранное и прогресс гостя сохраняются в текущем браузере, если доступно хранилище; очистка данных сайта или другой браузер не восстановят гостевую историю."
    },
    "links": [
      {
        "label": "Explore questions",
        "labelRu": "Открыть вопросы",
        "href": "/questions/"
      }
    ]
  },
  {
    "id": "favorites",
    "category": "Website features",
    "question": "Can I save favorite questions?",
    "answer": "Use the favorite control on a question, then filter to favorites when you want to revisit it. Guests save locally; signed-in members can synchronize saved questions through their account.",
    "ru": {
      "question": "Можно ли сохранять любимые вопросы?",
      "answer": "Нажми значок избранного на вопросе, а для повторения включи соответствующий фильтр. Гость сохраняет данные локально, а участник может синхронизировать их через аккаунт."
    },
    "links": [
      {
        "label": "Explore questions",
        "labelRu": "Открыть вопросы",
        "href": "/questions/"
      }
    ]
  },
  {
    "id": "sync",
    "category": "Website features",
    "question": "Does question progress synchronize across devices?",
    "answer": "For a verified member, the app synchronizes explored questions, favorites and continuation state with the same account. Network failures may leave pending local changes until retry; wait for synchronization before clearing browser data.",
    "ru": {
      "question": "Синхронизируется ли прогресс между устройствами?",
      "answer": "У подтверждённого участника изученные вопросы, избранное и продолжение практики синхронизируются через тот же аккаунт. При сбое сети изменения могут ждать локально до повторной отправки; не очищай данные браузера до завершения синхронизации."
    }
  },
  {
    "id": "language",
    "category": "Website features",
    "question": "How do I switch between English and Russian?",
    "answer": "Use EN / РУ for this help center and the legal documents; the account has a shared language preference. The question library has its own translation control, and only the 100 authored Ice Breakers currently have Russian translations, not all 2,000 questions.",
    "ru": {
      "question": "Как переключать английский и русский?",
      "answer": "Кнопка EN / РУ переключает справку и юридические документы; личный кабинет использует то же предпочтение языка. У библиотеки есть отдельная кнопка перевода, причём русский перевод есть у 100 авторских Ice Breakers, а не у всех 2 000 вопросов."
    }
  },
  {
    "id": "theme",
    "category": "Website features",
    "question": "How do I change the light or dark theme?",
    "answer": "Use the sun/moon control in the navigation. Your choice is saved in this browser when storage is available; it does not change your account or bookings.",
    "ru": {
      "question": "Как переключить светлую и тёмную тему?",
      "answer": "Нажми значок солнца или луны в навигации. Если доступно хранилище, выбор сохранится в текущем браузере; аккаунт и бронирования от этого не меняются."
    }
  },
  {
    "id": "notifications",
    "category": "Website features",
    "question": "How do I receive meetup notifications?",
    "answer": "Signed-in members can use the bell for in-app notifications, and Telegram carries club announcements. This does not promise browser push notifications, SMS, or marketing email; other members’ registration and booking details are not a member notification feed.",
    "ru": {
      "question": "Как получать уведомления о встречах?",
      "answer": "Участникам доступны уведомления через значок колокольчика, а объявления клуба публикуются в Telegram. Это не обещание push-уведомлений, SMS или рекламной рассылки; сведения о чужой регистрации и бронированиях не являются лентой для участников."
    }
  },
  {
    "id": "visibility",
    "category": "Privacy and security",
    "question": "Can other members see my personal information?",
    "answer": "The current member area is not a public member directory. Database policies restrict personal records, while authorized administrators can access information needed for club operations; this does not hide anything you choose to post in Telegram.",
    "ru": {
      "question": "Видят ли другие участники мои личные данные?",
      "answer": "Текущий личный кабинет не является открытым каталогом участников. Доступ к личным записям ограничен политиками базы, а уполномоченные администраторы видят данные для работы клуба; это не скрывает то, что ты сам публикуешь в Telegram."
    },
    "links": [
      {
        "label": "Privacy information",
        "labelRu": "Конфиденциальность",
        "href": "/privacy/"
      }
    ]
  },
  {
    "id": "requests",
    "category": "Privacy and security",
    "question": "How do I request access, correction or deletion of data?",
    "answer": "Contact the organizer and describe your request without posting passwords or verification links. Ask for a private reply if using a public Telegram group; the club may need to verify account ownership before acting.",
    "ru": {
      "question": "Как запросить доступ, исправление или удаление данных?",
      "answer": "Напиши организатору и опиши запрос, не публикуя пароли и ссылки подтверждения. Если пишешь в открытой группе Telegram, попроси личный ответ; перед выполнением запроса может потребоваться проверка владения аккаунтом."
    },
    "links": [
      {
        "label": "Contact the organizer",
        "labelRu": "Связаться с организатором",
        "href": "/contact/"
      }
    ]
  },
  {
    "id": "storage",
    "category": "Privacy and security",
    "question": "Why does the site use browser storage?",
    "answer": "Local storage keeps sessions, preferences, guest questions and pending synchronization changes. Session storage keeps the resend cooldown; these are different technologies from cookies.",
    "ru": {
      "question": "Зачем сайт использует хранилище браузера?",
      "answer": "Локальное хранилище сохраняет сессию, настройки, гостевые вопросы и изменения, ожидающие синхронизации. Сессионное хранилище хранит таймер повторной отправки письма; это отдельные технологии, а не файлы cookie."
    },
    "links": [
      {
        "label": "Browser storage information",
        "labelRu": "Данные в браузере",
        "href": "/cookies/"
      }
    ]
  },
  {
    "id": "passwords",
    "category": "Privacy and security",
    "question": "How are passwords handled?",
    "answer": "Passwords go through Supabase Auth and are not stored in profile tables. Keep your password and email links private; no website can promise absolute security.",
    "ru": {
      "question": "Как обрабатываются пароли?",
      "answer": "Пароли обрабатывает Supabase Auth, они не хранятся в таблицах профилей. Не передавай пароль и ссылки из писем другим людям; ни один сайт не может гарантировать абсолютную безопасность."
    },
    "links": [
      {
        "label": "Privacy information",
        "labelRu": "Конфиденциальность",
        "href": "/privacy/"
      }
    ]
  }
];

export const featuredFaqItems = faqItems.filter(item => ["what-is-gsc","level","book","loyalty-rule","beginners","venue"].includes(item.id));
