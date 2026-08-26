-- ============================================
-- CONTENT SEED — EDITABLE FAQ
-- Risk: CRITICAL when applied; inserts production database content.
-- ============================================

begin;

insert into public.site_faq_items
  (draft_question, draft_answer, published_question, published_answer, sort_order, is_enabled, published_is_enabled, published_at)
select source.question, source.answer, source.question, source.answer, source.sort_order, true, true, now()
from (values
  (10, 'What is Galstyan’s Speaking Club?', 'It is a local English speaking and conversation club in Sergiev Posad where people meet, use spoken English, and connect through thoughtful questions and relaxed conversation.'),
  (20, 'Where is the speaking club based?', 'Galstyan’s Speaking Club is based in Sergiev Posad, Moscow Region. The exact venue is shared with members when a meetup is published.'),
  (30, 'What English level do I need?', 'The question library covers beginner, intermediate, and advanced levels, from A1–A2 through C1–C2. Ask about the level and format of a particular published meetup.'),
  (40, 'Do I need perfect English?', 'No. The club is built around real conversation and progress, not perfect grammar or a perfect accent. Choose a question level that feels useful and keep speaking.'),
  (50, 'Do we speak Russian during meetings?', 'The GSC rule is English only: the aim is to create a friendly space for real spoken-English practice from the first minute to the last.'),
  (60, 'How many people attend and how long is a meetup?', 'There is no single public group size or duration. Each published meetup carries its own capacity and time details, so check the event information before booking.'),
  (70, 'How much does a meetup cost?', 'There is no current published price to display. Any real price is shown with the published meetup details rather than guessed in advance.'),
  (80, 'How do I join?', 'Join the GSC Telegram community for announcements and venue updates. When member access is enabled, you can create an account from the Member access button.'),
  (90, 'How does attendance work?', 'Attendance is recorded in the member system by the club. Members can see qualifying attendance and rewards in their protected account when member access is configured.'),
  (100, 'How does the loyalty system work?', 'Members can track qualifying attendance and unlock a free meetup after six qualifying visits, making the next meetup free.')
) as source(sort_order, question, answer)
where not exists (select 1 from public.site_faq_items);

commit;
