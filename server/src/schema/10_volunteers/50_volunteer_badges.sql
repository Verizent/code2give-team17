create table public.volunteer_badges (
  id uuid primary key default gen_random_uuid(),

  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  badge_id uuid not null references public.badges (id) on delete cascade,
  awarded_at timestamptz not null default now(),

  -- This is what makes badge evaluation safely re-runnable: attempt the insert and swallow the
  -- duplicate, rather than reading-then-writing and racing yourself. Marking attendance twice
  -- must not award twice.
  constraint one_award_per_badge_per_volunteer unique (volunteer_id, badge_id)
);

comment on table public.volunteer_badges is
  'Awarded badges. The unique constraint is what makes badge evaluation safely re-runnable - '
  'attendance can be marked twice without awarding twice.';

create index volunteer_badges_volunteer_idx
  on public.volunteer_badges (volunteer_id);

alter table public.volunteer_badges enable row level security;
