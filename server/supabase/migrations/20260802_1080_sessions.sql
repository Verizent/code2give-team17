create table if not exists public.sessions (
  id                    uuid primary key default gen_random_uuid(),
  programme             text not null,
  title_en              text not null,
  title_zh              text,
  description_en        text,
  description_zh        text,
  starts_at             timestamptz not null,
  ends_at               timestamptz not null,
  location              text,
  capacity              integer,
  attendance_count      integer,
  attendance_source     text check (attendance_source in ('manual', 'auto')),
  photo_url             text,
  estimated_cost_hkd    integer,
  status                text not null default 'scheduled'
                          check (status in ('scheduled', 'completed', 'cancelled')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists sessions_starts_at_idx on public.sessions (starts_at);
create index if not exists sessions_status_idx on public.sessions (status);

create trigger set_sessions_updated_at
  before update on public.sessions
  for each row execute function public.set_updated_at();

alter table public.sessions enable row level security;
