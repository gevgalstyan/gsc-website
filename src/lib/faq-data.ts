export type FaqCategory =
  | "About the club"
  | "Joining"
  | "English level"
  | "Meetups"
  | "Booking"
  | "Pricing and loyalty"
  | "Location and format"
  | "Member account"
  | "General questions";

export type FaqItem = {
  category: FaqCategory;
  question: string;
  answer: string;
  links?: readonly { label: string; href: string }[];
};

export const faqItems: readonly FaqItem[] = [
  {
    category: "About the club",
    question: "What is Galstyan’s Speaking Club?",
    answer: "Galstyan’s Speaking Club is a local English conversation club in Sergiev Posad. People come to practice spoken English in group meetups, discuss thoughtful questions, and build confidence through real conversation.",
    links: [{ label: "About GSC", href: "/about" }],
  },
  {
    category: "About the club",
    question: "Is Galstyan’s Speaking Club an English school?",
    answer: "No. GSC is focused on conversation practice, not a formal English course. There are no school-style lessons, grades, or certificates. The main value is regular speaking practice in a friendly local group.",
  },
  {
    category: "About the club",
    question: "What is the main purpose of the club?",
    answer: "The purpose is to help people speak English more naturally and more often. Meetups create a structured but relaxed space where members can use English, listen to others, and become less afraid of real conversation.",
    links: [{ label: "How it works", href: "/how-it-works" }],
  },
  {
    category: "About the club",
    question: "Who hosts Galstyan’s Speaking Club?",
    answer: "Galstyan’s Speaking Club is founded and hosted by Gevorg Galstyan. He created the club in Sergiev Posad to make spoken-English practice more social, regular, and welcoming.",
    links: [{ label: "Meet Gevorg Galstyan", href: "/about" }],
  },
  {
    category: "Joining",
    question: "How do I join?",
    answer: "Start by checking the upcoming meetups and booking a place when a suitable meetup is open. If you need help before your first visit, contact the host and ask about the next available format.",
    links: [{ label: "Upcoming meetups", href: "/meetups" }, { label: "Contact us", href: "/contact" }],
  },
  {
    category: "Joining",
    question: "Do I need an account?",
    answer: "An account is useful for booking, seeing your bookings, checking attendance history, and tracking loyalty progress. Public pages still explain the club, but member features live in the protected account area.",
    links: [{ label: "Membership", href: "/membership" }, { label: "My account", href: "/account" }],
  },
  {
    category: "Joining",
    question: "Can I come alone?",
    answer: "Yes. Many people come to speaking practice because they want to meet new people and feel more comfortable using English. The meetup format gives everyone a clear reason to talk, so arriving alone is normal.",
  },
  {
    category: "Joining",
    question: "Can I bring a friend?",
    answer: "Yes, as long as each person has a place for the meetup. If booking is required, your friend should also book or contact the host so the group size stays manageable.",
  },
  {
    category: "English level",
    question: "What English level do I need?",
    answer: "You do not need perfect English. The question library includes beginner, intermediate, and advanced prompts, from A1-A2 through C1-C2. For a specific meetup, check the published details or ask the host.",
    links: [{ label: "Speaking questions", href: "/questions" }],
  },
  {
    category: "English level",
    question: "Is the club suitable for intermediate speakers?",
    answer: "Yes. Intermediate speakers often benefit most from regular conversation practice because they already know enough English to communicate, but need more speed, confidence, vocabulary, and listening practice.",
  },
  {
    category: "English level",
    question: "What if I make mistakes?",
    answer: "Mistakes are expected. The club is built around real conversation and progress, not perfect grammar or a perfect accent. The important thing is to keep speaking and learn from the conversation.",
  },
  {
    category: "English level",
    question: "Do we speak only English during meetups?",
    answer: "The goal is English conversation practice, so meetups are designed around using English as much as possible. The exact level of support may depend on the group and format, but the practice itself is in English.",
  },
  {
    category: "English level",
    question: "What if I am shy or nervous speaking English?",
    answer: "That is common. The meetup format gives you questions and a group structure, so you are not forced to invent everything from zero. You can start with shorter answers and build confidence gradually.",
  },
  {
    category: "Meetups",
    question: "How do meetups work?",
    answer: "Meetups are group conversation sessions. The host sets the format, people gather around English-speaking prompts or activities, and participants practice by answering, asking follow-up questions, and listening to each other.",
    links: [{ label: "How it works", href: "/how-it-works" }],
  },
  {
    category: "Meetups",
    question: "How long does a meetup last?",
    answer: "There is no single fixed duration shown across the whole site. Each published meetup should be treated as the source of truth for time, format, capacity, and any practical details before you book.",
    links: [{ label: "Upcoming meetups", href: "/meetups" }],
  },
  {
    category: "Meetups",
    question: "How many people usually attend?",
    answer: "Group size depends on the published meetup and its capacity. The site should show available booking information for each meetup rather than guessing a standard attendance number.",
  },
  {
    category: "Meetups",
    question: "What happens during a typical meetup?",
    answer: "A typical meetup centers on English conversation. You may discuss prepared questions, respond to prompts, compare opinions, or take part in simple speaking activities. The aim is practical speaking time, not passive studying.",
  },
  {
    category: "Meetups",
    question: "Do I need to prepare anything?",
    answer: "Usually you do not need special preparation. It can help to arrive ready to introduce yourself, listen actively, and try answering in English even if your sentences are not perfect.",
  },
  {
    category: "Booking",
    question: "How do I book a place?",
    answer: "Open the meetups page, choose a published meetup, and follow the booking action shown there. If you are signed in, booking connects to your member account so your bookings and attendance can be tracked.",
    links: [{ label: "Book a meetup", href: "/meetups" }],
  },
  {
    category: "Booking",
    question: "What happens if a meetup is full?",
    answer: "If a meetup is full, booking may no longer be available for that event. Check the meetups page for another date or contact the host to ask about future availability.",
  },
  {
    category: "Pricing and loyalty",
    question: "How much does a meetup cost?",
    answer: "The FAQ does not publish a static price because pricing can be controlled by the current meetup setup. The current price is shown on each meetup page before you book.",
    links: [{ label: "Upcoming meetups", href: "/meetups" }],
  },
  {
    category: "Pricing and loyalty",
    question: "How does the loyalty program work?",
    answer: "The member system tracks qualifying paid attended meetups. Six qualifying paid visits unlock one free meetup; your account shows the current progress and any available rewards.",
    links: [{ label: "Membership", href: "/membership" }],
  },
  {
    category: "Pricing and loyalty",
    question: "How do I earn a free meetup?",
    answer: "Attend qualifying paid meetups that are recorded by the club. Those qualifying attended meetups contribute to your loyalty progress toward a free meetup.",
  },
  {
    category: "Location and format",
    question: "Where are meetups held?",
    answer: "Galstyan’s Speaking Club is based in Sergiev Posad. The exact venue can depend on the published meetup, so check the meetup details or contact the host before attending.",
    links: [{ label: "Contact us", href: "/contact" }],
  },
  {
    category: "Location and format",
    question: "Are meetups online or offline?",
    answer: "GSC is presented as a local club for real group meetups in Sergiev Posad. If a special format is offered, rely on the published meetup details for that event.",
  },
  {
    category: "Member account",
    question: "What can I see in my member account?",
    answer: "Your member account can show bookings, attendance history, loyalty progress, profile details, and relevant notifications. It is the protected area for information connected to your participation.",
    links: [{ label: "My account", href: "/account" }],
  },
  {
    category: "Member account",
    question: "Can I see my bookings and attendance history?",
    answer: "Yes. The app includes member account features for bookings and attendance history, so signed-in members can review their club activity in one place.",
  },
  {
    category: "Member account",
    question: "Where can I see my loyalty progress?",
    answer: "Loyalty progress is shown in the member account when qualifying attendance has been recorded. It reflects the club’s tracked paid attended meetups, not unverified visits.",
    links: [{ label: "My account", href: "/account" }],
  },
  {
    category: "General questions",
    question: "How can I contact the host?",
    answer: "Use the contact page if you have a question about joining, level, booking, venue details, or your first meetup. It is the best place to ask when a detail is not published yet.",
    links: [{ label: "Contact us", href: "/contact" }],
  },
  {
    category: "General questions",
    question: "What should I do before my first meetup?",
    answer: "Check the meetup details, make sure your place is booked if booking is required, note the time and location, and arrive ready to try speaking English. You do not need perfect grammar to take part.",
  },
] as const;

export const faqCategories = [
  "About the club",
  "Joining",
  "English level",
  "Meetups",
  "Booking",
  "Pricing and loyalty",
  "Location and format",
  "Member account",
  "General questions",
] as const satisfies readonly FaqCategory[];

export const featuredFaqItems = faqItems.filter((item) =>
  [
    "What is Galstyan’s Speaking Club?",
    "How do I join?",
    "What English level do I need?",
    "How do meetups work?",
    "How do I book a place?",
    "How does the loyalty program work?",
  ].includes(item.question),
);

export function normalizeEditableFaqItems(items: readonly { question: string; answer: string }[]): readonly FaqItem[] {
  return items.map((item) => ({ ...item, category: "General questions" }));
}
