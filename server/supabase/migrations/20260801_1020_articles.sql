-- News and education articles. Bodies are JSONB block arrays, never markdown or
-- HTML strings — the block union in src/schemas/blocks.schema.js is the boundary
-- that keeps dangerouslySetInnerHTML out of the client.
--
-- NOT APPLIED. Run in the Supabase SQL editor after announcing it.

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug     text not null unique,
  -- 'voice' is deliberately absent: Voices are supporter submissions in
  -- community_posts, which carry the moderation state the tab depends on.
  -- Two tables feeding one tab means the frontend has to guess which.
  category text not null check (category in ('news','education','report')),

  title_en text not null,  title_zh text,
  excerpt_en text,         excerpt_zh text,
  body_en jsonb not null default '[]'::jsonb,
  body_zh jsonb not null default '[]'::jsonb,

  cover_image_url text,
  cover_alt_en text,       cover_alt_zh text,
  attachment_url  text,

  author text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  reading_time_minutes integer,

  meta_title_en text,        meta_title_zh text,
  meta_description_en text,  meta_description_zh text,
  og_image_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- _zh columns are nullable on purpose: resolveLocale falls back to _en, which is
-- the honest behaviour where a translation genuinely does not exist yet.

create index if not exists articles_published_idx on public.articles (status, published_at desc);
create index if not exists articles_category_idx  on public.articles (category);
create index if not exists articles_tags_idx      on public.articles using gin (tags);
create index if not exists articles_featured_idx  on public.articles (is_featured) where is_featured;

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- RLS on with zero policies: the service-role key bypasses RLS and is the only
-- thing that talks to Postgres, so a leaked anon key reads nothing.
alter table public.articles enable row level security;
