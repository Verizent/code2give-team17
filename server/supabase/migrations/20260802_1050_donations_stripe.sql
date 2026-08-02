-- Donations: Stripe linkage, the credit snapshot, and fortnightly editions.
-- PLAN.md §4. APPLIED to the live project on 2026-08-01 as migration
-- `20260801143726_donations_stripe_and_editions` (plus `20260801142411_drop_donations_programme`).
-- Kept here as the human-readable record; re-running it is a no-op.
--
-- Additive only, except the one named drop at the bottom, which was taken deliberately
-- while `donations` held 0 rows.

-- ── donations: Stripe linkage + the credit snapshot ────────────────────────
alter table public.donations
  add column if not exists stripe_session_id          text unique,
  add column if not exists stripe_payment_intent      text,
  -- What the gift bought: max(1, ceil(amount_hkd / cost_per_event)). Uncapped.
  add column if not exists events_credited            integer,
  -- Snapshot of the divisor, so revising the constant never rewrites what a donor was told.
  add column if not exists cost_per_event_at_donation integer,
  add column if not exists tracking_opt_in            boolean not null default true,
  add column if not exists is_anonymous               boolean not null default false,
  add column if not exists message                    text,
  add column if not exists referral_source            text,
  add column if not exists referral_source_other      text;

-- A checkout session exists before the webhook tells us who the donor is.
alter table public.donations alter column donor_id drop not null;

-- Widen status to carry refunds (nothing writes 'refunded' yet — PLAN.md §6).
alter table public.donations drop constraint if exists donations_status_check;
alter table public.donations add constraint donations_status_check
  check (status in ('pending', 'succeeded', 'failed', 'refunded'));

create index if not exists donations_stripe_session_idx
  on public.donations (stripe_session_id) where stripe_session_id is not null;

-- ── donors ─────────────────────────────────────────────────────────────────
alter table public.donors
  add column if not exists last_completion_email_at timestamptz;

-- ── donor_periods: the fortnightly editions ────────────────────────────────
create table if not exists public.donor_periods (
  id           uuid primary key default gen_random_uuid(),
  donor_id     uuid not null references public.donors(id) on delete cascade,
  period_start date not null,
  period_end   date not null,
  status       text not null default 'open' check (status in ('open', 'closed')),
  emailed_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Exactly one open period per donor.
create unique index if not exists donor_periods_one_open_idx
  on public.donor_periods (donor_id) where status = 'open';

drop trigger if exists donor_periods_set_updated_at on public.donor_periods;
create trigger donor_periods_set_updated_at
  before update on public.donor_periods
  for each row execute function public.set_updated_at();

alter table public.donor_periods enable row level security;

-- ── stripe_events: the idempotency ledger ──────────────────────────────────
-- Stripe retries deliveries. Without this, a retried checkout.session.completed
-- creates a second donation and a second thank-you email.
create table if not exists public.stripe_events (
  event_id    text primary key,
  type        text not null,
  received_at timestamptz not null default now()
);

alter table public.stripe_events enable row level security;

-- ── the one drop ───────────────────────────────────────────────────────────
-- Donors do not choose a programme designation; every gift is unrestricted.
-- Cherry-picking starves the less photogenic programmes and edges into
-- restricted-fund obligations (PLAN.md §3, "No designation").
alter table public.donations drop column if exists programme;
