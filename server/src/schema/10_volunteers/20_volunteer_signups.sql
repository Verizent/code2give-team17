create table public.volunteer_signups (
  id uuid primary key default gen_random_uuid(),

  opportunity_id uuid not null
    references public.volunteer_opportunities (id) on delete cascade,
  volunteer_id uuid not null
    references public.volunteers (id) on delete cascade,
  profile_id uuid
    references auth.users (id) on delete cascade,

  status text not null default 'applied'
    check (status in ('applied', 'confirmed', 'attended', 'cancelled', 'no_show')),
  hours_logged numeric(5, 2) not null default 0 check (hours_logged >= 0),
  attended_at timestamptz,

  -- §23, captured AFTER signup, always optional, never a gate.
  discovery_source text
    check (discovery_source in (
      'handson', 'time_auction', 'love21_site', 'social',
      'friend_colleague', 'employer_csr', 'school', 'search', 'other'
    )),
  discovery_source_other text,
  signup_motivation text,

  -- §23, captured AFTER attendance, always optional.
  experience_rating smallint check (experience_rating between 1 and 5),
  would_return boolean,
  improvement_note text,
  feedback_submitted_at timestamptz,

  thank_you_email_sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The duplicate-signup guard. Let the insert fail and return 409 CONFLICT rather than checking
  -- first and racing yourself.
  constraint one_signup_per_volunteer_per_opportunity unique (opportunity_id, volunteer_id)
);

comment on table public.volunteer_signups is
  'On-site volunteer signups - the flow §6 records does not exist on the current site at all.';
comment on column public.volunteer_signups.profile_id is
  'Optional. Set only when the signup was made by someone already holding a permanent account. '
  'volunteer_id is the identity that always exists - prefer it in every query.';
comment on column public.volunteer_signups.discovery_source is
  '§23: how the VOLUNTEER found the listing. Do not conflate with volunteer_opportunities.source, '
  'which is where registration can happen. Someone can discover a HandsOn listing via a colleague.';
comment on column public.volunteer_signups.signup_motivation is
  '§23: staff-only, never displayed publicly.';
comment on column public.volunteer_signups.improvement_note is
  '§23: staff-only, never displayed publicly.';
comment on column public.volunteer_signups.hours_logged is
  '§17 caveat: hours volunteered through HandsOn do not really reach here without a real sync - '
  'they only appear to.';
comment on column public.volunteer_signups.thank_you_email_sent_at is
  'Guards against double-sending the post-attendance thank-you.';

create index volunteer_signups_volunteer_idx
  on public.volunteer_signups (volunteer_id);
create index volunteer_signups_opportunity_idx
  on public.volunteer_signups (opportunity_id);
create index volunteer_signups_profile_idx
  on public.volunteer_signups (profile_id);

create trigger set_updated_at
  before update on public.volunteer_signups
  for each row execute function public.set_updated_at();

alter table public.volunteer_signups enable row level security;
