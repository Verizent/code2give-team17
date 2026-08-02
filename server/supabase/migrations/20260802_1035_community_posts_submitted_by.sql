-- Attribute signed-in Voices submissions. Nullable because anonymous submissions remain
-- first-class — the honeypot and moderation queue do not care whether the row has an
-- identity. Signed-in attribution gives moderators a way to spot repeat contributors
-- and abuse without gating the anonymous path.
--
-- Route: POST /api/community-posts is guarded by optionalAuth (server/src/middleware/
-- require-auth.js); the service reads actor.userId when present and falls back to null.
--
-- NOT APPLIED. Run in the Supabase SQL editor after announcing it.

alter table public.community_posts
  add column if not exists submitted_by uuid references public.profiles(id);

create index if not exists community_posts_submitted_by_idx
  on public.community_posts (submitted_by)
  where submitted_by is not null;
