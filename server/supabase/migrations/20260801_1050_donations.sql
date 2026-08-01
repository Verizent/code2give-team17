-- Donor tracking tables for CONTEXT.md §15.
-- Keys on normalised (lowercased, trimmed) email — collation silently splits history otherwise.
-- NOT APPLIED. Run in the Supabase SQL editor after announcing it.

create table if not exists public.donors (
  id               uuid primary key default gen_random_uuid(),
  email            text not null unique,   -- normalised: lowercase + trimmed
  full_name        text,
  locale           text not null default 'en' check (locale in ('en', 'zh-Hant')),
  tracking_opt_in  boolean not null default true,
  -- Long random token the donor uses to reach their tracking page without an account.
  access_token     text not null unique check (length(access_token) >= 32),
  last_completion_email_at timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

drop trigger if exists donors_set_updated_at on public.donors;
create trigger donors_set_updated_at
  before update on public.donors
  for each row execute function public.set_updated_at();

alter table public.donors enable row level security;

-- ── donations ──────────────────────────────────────────────────────────────

create table if not exists public.donations (
  id                   uuid primary key default gen_random_uuid(),
  donor_id             uuid not null references public.donors(id) on delete restrict,
  amount_hkd           integer not null check (amount_hkd > 0),
  frequency            text not null default 'once' check (frequency in ('once', 'weekly', 'monthly')),
  programme            text not null default 'where_needed'
                         check (programme in ('sports','fitness','nutrition','family','where_needed')),
  campaign_id          uuid,   -- fk to campaigns once that table exists
  -- stripe_session_id unique = idempotency guard (§15, §17).
  stripe_session_id    text unique,
  stripe_payment_intent text,
  status               text not null default 'pending'
                         check (status in ('pending','succeeded','failed','refunded')),
  is_anonymous         boolean not null default false,
  message              text,
  referral_source      text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists donations_donor_idx    on public.donations (donor_id);
create index if not exists donations_status_idx   on public.donations (status);
create index if not exists donations_campaign_idx on public.donations (campaign_id) where campaign_id is not null;

drop trigger if exists donations_set_updated_at on public.donations;
create trigger donations_set_updated_at
  before update on public.donations
  for each row execute function public.set_updated_at();

alter table public.donations enable row level security;

-- ── donor_periods ──────────────────────────────────────────────────────────

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
