-- Shared helpers.
--
-- USED BEYOND THE VOLUNTEER SCHEMA: campaigns, donations, donors, wishlist_items and
-- wishlist_pledges all attach triggers to this function. CREATE OR REPLACE makes re-running safe,
-- but never DROP FUNCTION ... CASCADE on it — that would remove those triggers too.

-- Maintains updated_at on tables that carry it. Callers must NOT set updated_at themselves —
-- a value passed in is overwritten by this trigger.
--
-- search_path is pinned to '' because an unpinned search_path lets a caller with CREATE on a
-- schema shadow a referenced object (Supabase advisor 0011_function_search_path_mutable).
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

comment on function public.set_updated_at() is
  'Shared updated_at trigger. Created by the volunteer track; safe for other tracks to reuse.';
