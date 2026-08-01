create table public.volunteer_opportunities (
  id uuid primary key default gen_random_uuid(),

  title_en text not null,
  title_zh text,
  description_en text,
  description_zh text,
  location_en text,
  location_zh text,

  programme text not null
    check (programme in ('sports', 'fitness', 'nutrition', 'family_support', 'community_education')),

  starts_at timestamptz not null,
  ends_at timestamptz,

  capacity integer not null default 1 check (capacity > 0),

  -- Bookings made on HandsOn ONLY. Never our own signups, and never a pre-computed "seats left".
  -- Storing the external number keeps the two systems independent, so an admin refresh and a
  -- local signup cannot clobber each other.
  spots_filled integer not null default 0 check (spots_filled >= 0),

  min_age integer not null default 16 check (min_age >= 0),
  skills text[] not null default '{}',

  status text not null default 'open'
    check (status in ('draft', 'open', 'full', 'closed', 'cancelled')),

  source text not null default 'internal'
    check (source in ('internal', 'handson')),
  handson_url text,
  handson_opportunity_id text,

  -- How stale spots_filled is. With capacity often 1 (§5), one HandsOn booking is the difference
  -- between open and full, so anything showing seats-left should show this beside it.
  last_synced_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint handson_rows_carry_provenance
    check (source <> 'handson' or handson_url is not null),
  constraint ends_after_starts
    check (ends_at is null or ends_at > starts_at)
);

comment on table public.volunteer_opportunities is
  'Volunteer listings. source records where registration can happen and is not the same thing as '
  'volunteer_signups.discovery_source, which records how the VOLUNTEER found the listing.';
comment on column public.volunteer_opportunities.spots_filled is
  'Bookings inside HandsOn''s system only. NEVER sum with volunteer_interests - those are leads '
  'that may never convert (§17, §29). Our own bookings live in volunteer_signups.';
comment on column public.volunteer_opportunities.min_age is
  '§5: HandsOn listings state a 16+ minimum. §20.5 (safeguarding screening) is still open.';

create index volunteer_opportunities_listing_idx
  on public.volunteer_opportunities (status, starts_at);
create index volunteer_opportunities_source_idx
  on public.volunteer_opportunities (source);

create trigger set_updated_at
  before update on public.volunteer_opportunities
  for each row execute function public.set_updated_at();

alter table public.volunteer_opportunities enable row level security;

-- DO NOT ADD: check (spots_filled <= capacity)
-- It looks obviously right and is harmful. If HandsOn oversells, or capacity is revised down, the
-- sync write fails and the number freezes stale — a failure on our side of a system we do not
-- control. Overbooking belongs in a derived status, not a write barrier.
--
-- NOT PRESENT, needed for an automatic sync: unique (handson_opportunity_id). Without it a sync
-- has nothing to upsert against and a re-run can silently duplicate a listing.
