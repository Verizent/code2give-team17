-- How a volunteer first heard about Love 21.
--
-- Multi-select on purpose: people arrive through more than one route ("a friend shared their
-- Instagram post"), and forcing a single answer throws away the overlap that tells you which
-- channels reinforce each other.
--
-- ── Why on volunteers, and not on volunteer_signups ─────────────────────────
-- It is a property of the person and does not change per session, so it is asked once and
-- kept once. volunteer_signups.discovery_source stays exactly as it is: that column answers
-- a different question — how they found THIS session — and both are worth having. profiles
-- .discovery is a third, for account holders who fill in the longer volunteer form; guests
-- have no profiles row at all, which is why the volunteer-level column is the one the signup
-- form can actually use.
--
-- ── Why the closed set is in the database ───────────────────────────────────
-- zod already validates the request. The CHECK is here as well so a direct write — a seed, a
-- backfill, a hand-run UPDATE — cannot invent a channel that no report or filter knows how to
-- group. The two lists have to be kept in step by hand; a value accepted by one and rejected
-- by the other is a 500 on an otherwise valid signup.

alter table public.volunteers
  add column if not exists discovery_sources text[] not null default '{}',
  add column if not exists discovery_other text;

alter table public.volunteers
  add constraint discovery_sources_are_known
    check (discovery_sources <@ array[
      'instagram', 'facebook', 'word_of_mouth', 'university', 'company',
      'handson', 'time_auction', 'search', 'love21_site', 'event', 'other'
    ]::text[]);

-- Free text belongs to 'other' and nothing else; a note pinned to 'instagram' is a note
-- nobody will ever read.
alter table public.volunteers
  add constraint discovery_other_requires_other
    check (discovery_other is null or 'other' = any (discovery_sources));

comment on column public.volunteers.discovery_sources is
  'How this volunteer first heard about Love 21. Multi-select from a closed set. Distinct '
  'from volunteer_signups.discovery_source, which is per-signup and about one session.';
comment on column public.volunteers.discovery_other is
  'Free text, only meaningful when discovery_sources contains ''other''.';
