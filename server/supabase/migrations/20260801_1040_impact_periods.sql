-- Annual impact figures for the Home credibility block.
--
-- Deviation from CONTEXT.md §13, deliberately: §13 specifies a `month` column, but
-- every figure we actually hold is annual (the 2024-25 report). A monthly column
-- would force us to invent twelve rows to hold one real number.
--
-- NOT APPLIED. Run in the Supabase SQL editor after announcing it.

create table if not exists public.impact_periods (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end   date not null,
  label        text not null,

  families_served integer not null,
  total_sessions  integer not null,
  activity_types  integer,

  -- Stored flat, nested into `by_programme` by the service so the frontend gets
  -- one object it can iterate rather than four fields it has to reassemble.
  sessions_sports         integer not null default 0,
  sessions_fitness        integer not null default 0,
  sessions_nutrition      integer not null default 0,
  sessions_family_support integer not null default 0,

  yoy_growth_pct      numeric(5,2),
  programme_spend_pct numeric(5,2),
  narrative_en text, narrative_zh text,

  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (period_start, period_end)
);

-- Guarantees exactly one row is current, which is what GET /api/impact returns.
create unique index if not exists impact_current_idx
  on public.impact_periods (is_current) where is_current;

drop trigger if exists impact_periods_set_updated_at on public.impact_periods;
create trigger impact_periods_set_updated_at
  before update on public.impact_periods
  for each row execute function public.set_updated_at();

alter table public.impact_periods enable row level security;

grant select, insert, update, delete on table public.impact_periods to service_role;
