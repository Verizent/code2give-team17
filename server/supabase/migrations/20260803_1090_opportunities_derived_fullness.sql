-- Make fullness derived, and name the HandsOn counter for what it actually holds.
--
-- ── Problem 1: `status` stored a value nothing kept true ────────────────────
-- `full` was written by syncStatusAfterSignup when signups reached capacity, and nothing
-- rewrote it when the underlying counts changed. Cancel or delete a signup and the row
-- claims `full` forever. Live data showed exactly that:
--
--   K-pop Dance Class Assistant   capacity 1   handson 0   local 0   status 'full'
--
-- A stored derived value can drift; a computed one cannot. `status` now carries only the
-- lifecycle states a human chooses — draft, open, closed, cancelled — and fullness is
-- computed in opportunities.service#toPublic from
--
--   spots_filled_handson + (confirmed rows in volunteer_signups) >= capacity
--
-- which is what the API already did anyway. The sync functions are deleted rather than
-- fixed: there is no longer anything to keep in sync.
--
-- Existing `full` rows become `open`, which is correct — a session at capacity is still
-- open in the lifecycle sense, and the API will render it as full on its own. `closed`
-- and `cancelled` rows are untouched.
--
-- ── Problem 2: `spots_filled` did not mean spots filled ─────────────────────
-- It held the HandsOn-side fill only; local signups live as rows in volunteer_signups and
-- are counted, never summed into the column (§29's "never sum" rule). The API has always
-- exposed the two separately as `spots_filled_handson` and `local_signups_count`, so the
-- column is renamed to the name the API already used. `spots_filled` remains an API field
-- meaning the total — that contract does not change, only the column behind it.
--
-- Registration for a `handson` listing happens on both sites, which is the whole reason
-- the partner count is a column while ours is a row count: we own one and only observe
-- the other.

alter table public.volunteer_opportunities
  rename column spots_filled to spots_filled_handson;

comment on column public.volunteer_opportunities.spots_filled_handson is
  'Seats taken through HandsOn, observed via their API — not ours to write except on sync. '
  'Local signups are rows in volunteer_signups and are counted, never summed into here. '
  'Total filled = this + confirmed local signups; both are surfaced separately by the API.';

update public.volunteer_opportunities
set status = 'open'
where status = 'full';

alter table public.volunteer_opportunities
  drop constraint volunteer_opportunities_status_check;

alter table public.volunteer_opportunities
  add constraint volunteer_opportunities_status_check
    check (status in ('draft', 'open', 'closed', 'cancelled'));

comment on column public.volunteer_opportunities.status is
  'Lifecycle only, set by a human: draft | open | closed | cancelled. Fullness is NOT '
  'stored — it is derived from capacity against spots_filled_handson plus confirmed '
  'signups, so it cannot drift out of date the way a written ''full'' did.';
