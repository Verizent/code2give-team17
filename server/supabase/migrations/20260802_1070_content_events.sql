-- Article view tracking. No locale column — deliberate (§23): locale affects what the
-- visitor reads, not whether the view counted.
-- visitor_hash is derived from IP + UA + day via lib/visitor-hash; no raw PII stored.
create table if not exists public.content_events (
  id           uuid primary key default gen_random_uuid(),
  article_id   uuid not null references public.articles(id) on delete cascade,
  visitor_hash text not null,
  created_at   timestamptz not null default now()
);

create index if not exists content_events_article_idx on public.content_events (article_id);
create index if not exists content_events_created_idx on public.content_events (created_at);

alter table public.content_events enable row level security;
