-- Shared helpers used by later migrations in this slice.
-- Apply order is by filename; timestamped rather than 001_ so two tracks starting
-- at the same number cannot collide (git merges duplicate prefixes silently).
--
-- NOT APPLIED to the shared Supabase project. Run these by hand in the SQL editor
-- once the team has been told, and never while someone is rehearsing.

-- Keeps updated_at honest without every service having to remember to set it.
--
-- `set search_path = ''` is load-bearing, not decoration. The volunteer track
-- already hardened this function (migration pin_set_updated_at_search_path), and
-- `create or replace` REPLACES the whole definition including its settings — so
-- omitting the pin here would silently revert their fix and leave a
-- mutable-search_path function behind. Keep it on every future edit.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Public bucket for article cover images and inline media.
-- Public means world-readable by URL: public content only. Donation receipts,
-- certificates and anything volunteer-identifying need a separate private bucket
-- with signed URLs.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;
