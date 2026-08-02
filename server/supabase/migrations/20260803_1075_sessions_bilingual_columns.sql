-- Reconcile public.sessions across the admin and donations tracks.
--
-- Non-destructive: adds nullable columns only. No existing column is dropped, renamed,
-- or retyped, so the admin track's queries are unaffected.
--
-- ── The problem ────────────────────────────────────────────────────────────
-- Two tracks independently designed `sessions` and both ship a data/sessions.repo.js:
--
--   admin      (feature/admin/dashboard) : description_en/_zh, location        <- matches live
--   donations  (feature/donations/dillon): note_en/_zh,        location_en/_zh <- did not exist
--
-- The admin shape was applied first (migration `20260801142442_sessions`). The donations
-- track's `20260803_1055_sessions_and_allocations.sql` declares its own shape via
-- `create table if not exists`, which SILENTLY NO-OPPED because the table already existed.
-- The guard that makes the file safe to re-run is the same guard that hid the mismatch:
-- the file looked applied, while every donations-track read of sessions failed with
-- PGRST204 "Could not find the 'location_en' column of 'sessions' in the schema cache".
--
-- PLAN.md §1 flagged this table as "ownership unresolved — §7 seam". This is that seam.
--
-- ── Why additive rather than a rename ──────────────────────────────────────
-- Renaming `location` -> `location_en` would fix the collision more tidily but breaks the
-- admin repo's COLUMNS list the moment it runs, and the demo is tomorrow. Adding the
-- donations columns lets both repos read the table unmodified. `sessions` had 0 rows when
-- this ran, so there is nothing to backfill and no divergence to reconcile yet.
--
-- ── Follow-up, deliberately not done here ──────────────────────────────────
-- `location` and `location_en`/`location_zh` now overlap, as do `description_*` and
-- `note_*`. Converge them after the demo: pick the bilingual pair, backfill from the
-- single-locale column, drop the loser, update whichever repo still refers to it.
-- Left as duplication on purpose — the alternative is editing another branch's data
-- layer the night before a demo.

alter table public.sessions
  add column if not exists location_en  text,
  add column if not exists location_zh  text,
  add column if not exists note_en      text,
  add column if not exists note_zh      text,
  add column if not exists completed_at timestamptz;
