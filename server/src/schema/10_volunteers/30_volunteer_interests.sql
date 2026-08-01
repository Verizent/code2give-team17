create table public.volunteer_interests (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references public.volunteer_opportunities (id) on delete cascade,
  volunteer_id uuid not null
    references public.volunteers (id) on delete cascade,

  message text,

  created_at timestamptz not null default now(),

  constraint one_interest_per_volunteer_per_opportunity unique (opportunity_id, volunteer_id)
);

comment on table public.volunteer_interests is
  '§17: leads captured on our site, NOT bookings. Never counted against capacity - see §29''s '
  '"never sum" rule. Contact details live on volunteers, not duplicated here.';

create index volunteer_interests_opportunity_idx
  on public.volunteer_interests (opportunity_id);
create index volunteer_interests_volunteer_idx
  on public.volunteer_interests (volunteer_id);

alter table public.volunteer_interests enable row level security;
