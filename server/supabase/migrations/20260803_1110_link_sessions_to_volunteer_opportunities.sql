-- Give a session a way to point at the volunteer listing for the same real-world event.
--
-- SERVER_README.md records this seam under demo shortcuts: "Only sessions are allocatable —
-- needs — Union with volunteer_opportunities". The two tables describe overlapping things
-- and had no relationship of any kind: no foreign key, no shared column, nothing. A donor
-- could fund a session while the volunteers who staffed it lived on a row nothing connected
-- to it, and neither side could answer a question about the other.
--
-- Nullable and additive on purpose. Most sessions are not volunteer-facing (they are the
-- programme itself), and most volunteer listings have no session row, so a required link
-- would be a lie in both directions. Nothing is backfilled: titles differ between the two
-- sets and guessing a match would invent relationships that do not exist. This is the
-- enabling step, not the reconciliation.
--
-- NOT merged into one table, deliberately. The programme vocabularies still disagree —
-- sessions uses community, family, where_needed; volunteer_opportunities uses
-- community_education, family_support and has no where_needed — so a merge needs that
-- reconciled first, across three tracks' repos and their live data. A nullable link costs
-- nothing now and can be dropped if the merge later happens.

alter table public.sessions
  add column if not exists volunteer_opportunity_id uuid
    references public.volunteer_opportunities (id) on delete set null;

-- One session per listing. Two sessions claiming the same volunteer listing would make
-- "how many volunteers staffed this session" unanswerable.
create unique index if not exists sessions_volunteer_opportunity_unique
  on public.sessions (volunteer_opportunity_id)
  where volunteer_opportunity_id is not null;

comment on column public.sessions.volunteer_opportunity_id is
  'The volunteer listing for this same event, when there is one. Null is the normal case: '
  'most sessions are not volunteer-facing. on delete set null because losing the listing '
  'must not delete the session — the session happened either way.';
