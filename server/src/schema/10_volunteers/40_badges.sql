create table public.badges (
  id uuid primary key default gen_random_uuid(),

  -- The stable seed key. Seed and re-seed against this, never against id.
  code text not null unique,

  name_en text not null,
  name_zh text,
  description_en text,
  description_zh text,
  icon text,

  criteria_type text not null
    check (criteria_type in ('signup_count', 'hours', 'programme_variety', 'streak')),
  threshold integer not null check (threshold > 0),

  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint one_badge_per_criteria_threshold unique (criteria_type, threshold)
);

comment on table public.badges is
  'Badge definitions. code is the stable seed key - seed and re-seed against it, never against id.';
comment on column public.badges.threshold is
  'Evaluated as >= threshold. §31 flags the boundary as one of the places worth a test.';

alter table public.badges enable row level security;
