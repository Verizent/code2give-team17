create table public.volunteers (
  id uuid primary key default gen_random_uuid(),

  -- §15's rule, enforced in the database because collation fails invisibly without it:
  -- Bob@x.com and bob@x.com must not become two volunteers.
  email text not null unique,
  full_name text not null,
  phone text,
  locale text not null default 'en' check (locale in ('en', 'zh-Hant')),

  -- Set when the volunteer converts the temporary account into a permanent one. Until then the
  -- token is the only identity they have.
  profile_id uuid unique references auth.users (id) on delete set null,
  claimed_at timestamptz,

  -- §15: "a long cryptographically random token (not a sequential id)". The length floor is a
  -- guard against a short or guessable value reaching the column at all.
  access_token text not null unique check (length(access_token) >= 32),

  -- How this volunteer first heard about Love 21. Multi-select: people arrive through more
  -- than one route ("a friend shared their Instagram post"), and forcing a single answer
  -- throws away the overlap that tells you which channels reinforce each other.
  --
  -- A property of the person, so it lives here rather than on volunteer_signups. That table's
  -- discovery_source is a different question — how they found THIS session — and both are
  -- worth having.
  discovery_sources text[] not null default '{}',
  discovery_other text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint email_is_normalised check (email = lower(btrim(email))),
  constraint claimed_rows_carry_a_profile
    check ((claimed_at is null) = (profile_id is null)),

  -- Closed set in the database, not only in zod: a direct write must not be able to invent a
  -- channel that no report or filter knows how to group.
  constraint discovery_sources_are_known
    check (discovery_sources <@ array[
      'instagram', 'facebook', 'word_of_mouth', 'university', 'company',
      'handson', 'time_auction', 'search', 'love21_site', 'event', 'other'
    ]::text[]),

  -- Free text belongs to 'other' and nothing else; a note pinned to 'instagram' is a note
  -- nobody will ever read.
  constraint discovery_other_requires_other
    check (discovery_other is null or 'other' = any (discovery_sources))
);

comment on table public.volunteers is
  'Volunteer identity, keyed on normalised email. A volunteer never has to register: signing up '
  'for a session creates this row and a tokenised page. profile_id is set only if they later '
  'convert it to a permanent account. Same mechanic as donors in §15.';
comment on column public.volunteers.access_token is
  'Bearer capability. §15 mitigations all apply: long random value, noindex on the page, no '
  'enumeration endpoint. Generated server-side with crypto.randomBytes - never a sequential or '
  'derived id.';
comment on column public.volunteers.profile_id is
  'Null until the volunteer claims a permanent account. Linking is by normalised email, which is '
  'why the constraint above exists: history, hours and badges carry over on upgrade.';

create trigger set_updated_at
  before update on public.volunteers
  for each row execute function public.set_updated_at();

-- §9: every read and write goes through the API on the service-role key, which bypasses RLS.
-- Deny-all is the intended posture. The rls_enabled_no_policy advisor notice is expected.
alter table public.volunteers enable row level security;

-- ONE EXTRA COLUMN LIVES ELSEWHERE: the deployed table also has `email_verified_at`, added by
-- ../20_email_verification/00_volunteer_email_verifications.sql. It is declared there rather than
-- here so the email-verification feature owns its own column — dropping that folder drops the
-- column with it. That file must therefore run after this one.

-- FK NOTE: profile_id references auth.users(id) because `profiles` (BE1's table) did not exist
-- when this was written. §13 says profiles extends auth.users, so profiles.id = auth.users.id and
-- this stays correct. Retarget to profiles(id) if preferred.
