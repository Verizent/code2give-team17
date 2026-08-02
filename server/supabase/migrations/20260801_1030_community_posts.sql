-- Voices: supporter, parent and volunteer submissions. This table is the sole
-- source for the Voices tab — articles.category has no 'voice' value.
--
-- NOT APPLIED. Run in the Supabase SQL editor after announcing it.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_name   text not null,
  relationship  text not null,
  story         text not null,
  photo_url     text,
  -- Notification only. Never rendered, never returned by a visitor endpoint:
  -- the explicit column list in community-posts.repo.js is what keeps it server-side.
  contact_email text,
  -- "No consent, no row" as a database guarantee, not a validation rule a
  -- service can later bypass.
  consent_given boolean not null check (consent_given),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  submitted_at timestamptz not null default now(),
  moderated_at timestamptz,
  -- STUBBED: the plan specifies `references public.profiles(id)`, but `profiles`
  -- is deferred — BE1 also claims identity (§30) and writing a second
  -- `create table profiles` is a SQL conflict git merges silently. Plain uuid for
  -- now; add the constraint once ownership is settled:
  --   alter table public.community_posts
  --     add constraint community_posts_moderated_by_fkey
  --     foreign key (moderated_by) references public.profiles(id);
  moderated_by uuid,
  moderation_note text
);

create index if not exists community_posts_queue_idx
  on public.community_posts (status, submitted_at desc);

alter table public.community_posts enable row level security;
