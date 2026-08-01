-- Sessions calendar and per-donation allocations (CONTEXT.md §15).
-- NOT APPLIED. Run in the Supabase SQL editor after announcing it.
--
-- `sessions` is the events calendar — public read for the calendar page, service-role write.
-- `donation_allocations` connects a donation to specific sessions with a cost snapshot,
-- so later cost revisions never rewrite what a donor was already told about.

-- ── sessions ───────────────────────────────────────────────────────────────
create table if not exists public.sessions (
  id                 uuid primary key default gen_random_uuid(),
  title_en           text not null,
  title_zh           text,
  programme          text not null default 'where_needed'
                       check (programme in ('sports','fitness','nutrition','family','where_needed')),
  starts_at          timestamptz not null,
  ends_at            timestamptz,
  location_en        text,
  location_zh        text,
  capacity           integer,
  estimated_cost_hkd integer,
  status             text not null default 'scheduled'
                       check (status in ('scheduled','completed','cancelled')),
  attendance_count   integer,
  attendance_source  text check (attendance_source in ('manual','member_app','auto')),
  photo_url          text,
  note_en            text,
  note_zh            text,
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists sessions_status_start_idx
  on public.sessions (status, starts_at);

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

alter table public.sessions enable row level security;

-- Public read for the calendar page.
drop policy if exists sessions_public_read on public.sessions;
create policy sessions_public_read
  on public.sessions
  for select
  using (status in ('scheduled','completed'));

-- ── donation_allocations ───────────────────────────────────────────────────
create table if not exists public.donation_allocations (
  id                  uuid primary key default gen_random_uuid(),
  donation_id         uuid not null references public.donations(id)     on delete cascade,
  session_id          uuid not null references public.sessions(id)      on delete restrict,
  donor_period_id     uuid not null references public.donor_periods(id) on delete restrict,
  cost_at_allocation  integer not null check (cost_at_allocation > 0),
  status              text not null default 'pending'
                        check (status in ('pending','planned','completed','cancelled')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- One donation can't allocate to the same session twice — CONTEXT.md §15 relies on
-- COUNT(DISTINCT session_id) for the lifetime strip; a duplicate would silently inflate.
create unique index if not exists donation_allocations_uniq_donation_session
  on public.donation_allocations (donation_id, session_id);

create index if not exists donation_allocations_session_idx
  on public.donation_allocations (session_id);
create index if not exists donation_allocations_period_idx
  on public.donation_allocations (donor_period_id);
create index if not exists donation_allocations_status_idx
  on public.donation_allocations (status);

drop trigger if exists donation_allocations_set_updated_at on public.donation_allocations;
create trigger donation_allocations_set_updated_at
  before update on public.donation_allocations
  for each row execute function public.set_updated_at();

alter table public.donation_allocations enable row level security;
-- Service-role only; the donor never reads allocations directly — the track endpoint composes.

-- ── email_sent_at (batching + mark-for-removal) ────────────────────────────
-- Populated when the completed-session email fires at period close. Display filter on
-- the track endpoint excludes rows whose email_sent_at is older than 14 days —
-- the "mark for removal → remove by next batch" mechanic from the donor-track spec.
alter table public.donation_allocations
  add column if not exists email_sent_at timestamptz;

create index if not exists donation_allocations_email_sent_at_idx
  on public.donation_allocations (email_sent_at)
  where email_sent_at is not null;

-- ── service_role DML grants ────────────────────────────────────────────────
-- Handoff (HANDOFF.md): "service_role grants are missing on your tables. Every
-- apply_migration-created table lands without DML grants, so server writes fail with
-- 'permission denied for table'." Enabling RLS above blocks the anon role by default;
-- without these explicit grants, service-role writes still 42501 because the underlying
-- table privilege isn't there. Both together = the shape we actually want.
grant select, insert, update, delete on public.sessions             to service_role;
grant select, insert, update, delete on public.donation_allocations to service_role;
