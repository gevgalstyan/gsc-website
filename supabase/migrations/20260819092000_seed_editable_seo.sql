begin;

with pages(page_slug, title, description) as (
  values
    ('home', 'English Speaking Club in Sergiev Posad', 'Join Galstyan’s Speaking Club for friendly English conversation practice, real meetups, and a welcoming local community in Sergiev Posad.'),
    ('about', 'About Galstyan’s Speaking Club', 'Learn about Galstyan’s Speaking Club, its host, and a welcoming English-speaking community for real conversation practice in Sergiev Posad.'),
    ('meetups', 'English Conversation Meetups in Sergiev Posad', 'See published Galstyan’s Speaking Club meetup dates, locations, capacity, prices, and booking information.'),
    ('questions', 'English Conversation Questions', 'Explore English conversation questions by level and category for speaking practice, meetups, and confidence.'),
    ('how-it-works', 'How the English Speaking Club Works', 'See how Galstyan’s Speaking Club combines English conversation practice, meetups, questions, and community.'),
    ('community', 'The GSC English Speaking Community', 'Meet people, practice conversational English, and build confidence with a friendly local English community in Sergiev Posad.'),
    ('faq', 'FAQ About the English Speaking Club', 'Answers about English practice, meetups, attendance, loyalty, and joining Galstyan’s Speaking Club.'),
    ('contact', 'Join an English Speaking Club in Sergiyev Posad', 'Contact Galstyan’s Speaking Club about English conversation practice, upcoming meetups, and joining the local community in Sergiyev Posad.'),
    ('membership', 'GSC Membership and Loyalty', 'See how GSC member profiles, attendance, question progress, favorites, and qualifying-visit rewards work.')
), fields as (
  select page_slug, page_slug || '.seo.title' as key, 'Page title' as label, 'seo' as content_type, title as value, 900 as sort_order from pages
  union all
  select page_slug, page_slug || '.seo.description', 'Meta description', 'seo', description, 910 from pages
  union all
  select page_slug, page_slug || '.seo.og_title', 'Open Graph title', 'seo', title, 920 from pages
  union all
  select page_slug, page_slug || '.seo.og_description', 'Open Graph description', 'seo', description, 930 from pages
  union all
  select page_slug, page_slug || '.seo.og_image', 'Open Graph image', 'image', '/social-preview.jpg', 940 from pages
)
insert into public.site_content
  (key, value, page_slug, section_slug, label, content_type, draft_value, published_value, sort_order, is_enabled, published_is_enabled, is_public, published_at)
select key, value, page_slug, 'SEO', label, content_type, value, value, sort_order, true, true, true, now()
from fields
on conflict (key) do update
set page_slug = excluded.page_slug,
    section_slug = excluded.section_slug,
    label = excluded.label,
    content_type = excluded.content_type,
    sort_order = excluded.sort_order;

commit;
