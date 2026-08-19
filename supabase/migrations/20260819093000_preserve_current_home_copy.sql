begin;

update public.site_content
set value = source.value,
    draft_value = source.value,
    published_value = source.value,
    updated_at = now(),
    published_at = now()
from (values
  ('home.hero.eyebrow', 'Sergiev Posad · English speaking community'),
  ('home.hero.title', 'English Speaking Club in Sergiev Posad'),
  ('home.hero.subtitle', 'A friendly English conversation club in Sergiev Posad. Practice spoken English with real people.')
) as source(key, value)
where public.site_content.key = source.key;

commit;
