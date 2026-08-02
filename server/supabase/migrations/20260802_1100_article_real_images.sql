-- Every article cover and body image pointed at a placehold.co grey box, so the
-- Articles page and every article detail rendered captioned placeholders instead of
-- photographs. These are the real Love 21 images already committed under
-- client/public/brand.
--
-- Relative paths, not absolute: the images are served by whichever origin serves the
-- app, so hardcoding a host would break the moment this is deployed anywhere.
--
-- Written as a migration rather than left as manual edits because the rows were
-- inserted directly into the live project and nothing in the repo reproduces them —
-- without this the next person to rebuild the database gets the grey boxes back.
-- Idempotent: keyed on slug, safe to re-run.

update public.articles set cover_image_url = m.img
from (values
  ('2024-25-annual-impact-report',                '/brand/grpphoto.jpeg'),
  ('beyond-limits-banquet-2026-tables-now-open',  '/brand/beyondlimit.jpeg'),
  ('charity-raffle-2025',                         '/brand/charityraffle.jpeg'),
  ('what-is-trisomy-21-understanding-the-name',   '/brand/love21.jpeg'),
  ('everyday-habits-for-a-long-happy-life',       '/brand/nutritionprog.jpeg'),
  ('corporate-volunteers-circuit-training-day',   '/brand/activity.jpg'),
  ('proving-readiness-purposeful-employment',     '/brand/member.jpg'),
  ('special-needs-teens-learn-dragon-boating',    '/brand/hero-group.jpg'),
  ('free-nutrition-guidance-low-income-families', '/brand/class.jpg'),
  ('what-to-expect-first-time-love-21-volunteer', '/brand/hero-huddle.jpg')
) as m(slug, img)
where public.articles.slug = m.slug;

update public.articles set
  body_en = replace(body_en::text, 'https://placehold.co/1200x800/0e7490/ffffff?text=Dragon+Boat+Training', '/brand/dragonboat.jpeg')::jsonb,
  body_zh = replace(body_zh::text, 'https://placehold.co/1200x800/0e7490/ffffff?text=Dragon+Boat+Training', '/brand/dragonboat.jpeg')::jsonb
where slug = 'special-needs-teens-learn-dragon-boating';

update public.articles set
  body_en = replace(body_en::text, 'https://placehold.co/1200x800/0f766e/ffffff?text=CSR+Circuit+Training', '/brand/csr.jpg')::jsonb,
  body_zh = replace(body_zh::text, 'https://placehold.co/1200x800/0f766e/ffffff?text=CSR+Circuit+Training', '/brand/csr.jpg')::jsonb
where slug = 'corporate-volunteers-circuit-training-day';

-- This alt described "a family chopping vegetables together at a kitchen counter".
-- The real photograph is a cooking workshop: members in aprons holding plates of food
-- they cooked. Alt text that does not match its image is worse than no image at all,
-- so the text is corrected alongside the URL.
update public.articles set
  body_en = replace(
    replace(body_en::text, 'https://placehold.co/1200x800/166534/ffffff?text=Family+Cooking', '/brand/nutrition.jpeg'),
    'A family chopping vegetables together at a kitchen counter',
    'Love 21 members in aprons holding plates of food they cooked at a nutrition workshop'
  )::jsonb,
  body_zh = replace(body_zh::text, 'https://placehold.co/1200x800/166534/ffffff?text=Family+Cooking', '/brand/nutrition.jpeg')::jsonb
where slug = 'everyday-habits-for-a-long-happy-life';
