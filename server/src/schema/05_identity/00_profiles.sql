-- Identity. One row per auth.users row.
--
-- DEMO-ONLY: the admin role is granted by a hand-run SQL update against a user created
--            in the Supabase dashboard (see 90_grant_admin.example.txt). There is no
--            invite flow, no role-management screen and no audit_log entry — real
--            version needs all three (§16, §19, §26).
--
-- DIVISION OF LABOUR, because two tables describe the same human:
--   profiles   = who you are to the system      — role, display name, session language
--   volunteers = who you are to the programme   — contact details, history, access token
-- volunteers.profile_id is the join. Where both could carry a field, volunteers wins for
-- contact data and profiles wins for role.

create table public.profiles (
  -- NOT gen_random_uuid(). The primary key IS the Supabase Auth uuid, borrowed rather
  -- than minted, which makes profiles.id = auth.users.id an invariant.
  --
  -- That invariant is load-bearing elsewhere: volunteers.profile_id and
  -- volunteer_signups.profile_id both reference auth.users(id). Because the ids are
  -- identical by construction those FKs are already correct and never need retargeting.
  -- Minting our own id here would have made three ALTER TABLEs on live tables mandatory.
  id uuid primary key references auth.users (id) on delete cascade,

  -- §9: "role must never be settable through signup, or admin becomes self-serve."
  --
  -- The DEFAULT is the part people skip and the part that matters most: an insert that
  -- forgets this column produces a volunteer, never an admin. Fail-safe by construction
  -- rather than by remembering. Supabase lets any client pass arbitrary user_metadata to
  -- signUp(), so nothing derived from a token may ever reach this column.
  --
  -- text + check rather than an enum, matching locale and status elsewhere: an enum
  -- cannot gain a value without a table rewrite.
  role text not null default 'volunteer'
    check (role in ('volunteer', 'admin')),

  -- Nullable, unlike volunteers.full_name. A profile is created automatically on a
  -- user's first authenticated request, and at that moment the only name available is
  -- whatever Supabase carries in user_metadata — which may be nothing. A fabricated
  -- 'Unknown' would render in an admin screen as though it were a name; null is honest.
  full_name text,

  locale text not null default 'en'
    check (locale in ('en', 'zh-Hant')),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Application identity, one row per auth.users row. id IS the Supabase Auth uuid. role is '
  'server-side only and is read from this row and nowhere else - never from a JWT claim or '
  'user_metadata (§9). Volunteers join via volunteers.profile_id.';
comment on column public.profiles.role is
  'volunteer | admin. Defaults to volunteer so that a forgotten column cannot mint an admin. '
  'Granted out of band; there is no self-serve path and no endpoint accepts this value.';
comment on column public.profiles.full_name is
  'Display name. Nullable because just-in-time provisioning may have no name to record. '
  'An admin has no volunteers row, which is why this lives here rather than being borrowed.';

-- NOTE ON THE TRIGGER NAME. 10_volunteers/* uses a bare `create trigger set_updated_at`;
-- supabase/migrations/* uses the qualified name plus a drop. Following the latter here, but
-- NOT to avoid a collision - Postgres scopes trigger names per table, so the bare name would
-- not have collided. The reason is idempotency: `drop ... if exists` makes this file
-- re-runnable in the SQL editor, which matters when recovering during a rehearsal.
--
-- public.set_updated_at() is defined in 00_shared and is deliberately NOT redefined here.
-- It is shared with campaigns, donations, donors, wishlist_items and wishlist_pledges, and it
-- pins `set search_path = ''`. Copy-pasting it without the pin would silently un-harden it for
-- every table that triggers off it, across three tracks.
drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- §9: deny-all. Every read and write goes through the API on the service-role key, which
-- bypasses RLS. The rls_enabled_no_policy advisor notice is expected — do not "fix" it.
--
-- Specifically do NOT add `using (id = auth.uid())`. That would let the browser read profiles
-- with the anon key, which breaks the rule that the frontend never queries Supabase for data.
alter table public.profiles enable row level security;
