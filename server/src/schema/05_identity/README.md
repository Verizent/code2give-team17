# Identity

`profiles` extends `auth.users` and answers the one question the rest of the API cannot answer
for itself: **what role is this caller?**

## There is no SQL file here, on purpose

**This directory does not own `profiles`.** The table was designed and applied by another
track — its migration is `supabase/migrations/20260801_1060_profiles.sql` on
`feature/donations-backend`, and a hardened version of it is what is live.

This branch originally carried its own `00_profiles.sql`. It has been **deleted**, because two
`create table profiles` definitions in one repository is the failure CLAUDE.md warns about
specifically: git merges them cleanly and silently, and the breakage only appears later, when
somebody replays

```bash
cat src/schema/*/*.sql | psql "$DATABASE_URL"
```

and the second definition fails the whole pipe.

`90_grant_admin.example.txt` stays. It is `.txt` and not `.sql` deliberately — the glob above
matches any `.sql` file, so an `.example.sql` would be replayed with its placeholder uuid and
fail.

## The live table, as actually applied

Verified against the project, not copied from a migration file:

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, `references auth.users(id) on delete cascade` |
| `role` | `text` | `not null default 'volunteer'`, `check (role in ('volunteer','admin'))` |
| `full_name` | `text` | nullable |
| `email` | `text` | **`not null`**, `check (email = lower(btrim(email)))` |
| `phone` | `text` | nullable |
| `locale` | `text` | `not null default 'en'`, `check (locale in ('en','zh-Hant'))` |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()` |

RLS enabled with **no policies**, matching every other table: the anon key reaches nothing, and
the server's service-role key bypasses RLS entirely.

Note `email NOT NULL`. An earlier version of this branch omitted `email` from its provisioning
insert, which would have failed against this table — see `services/auth/authenticate.js`, which
now normalises it through `lib/email.js` so the check constraint is satisfied.

## How a row is created

**A trigger, at signup** — not just-in-time, and not by this branch:

```sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

`handle_new_user()` inserts `(id, email, full_name, locale, role)` with `role` **hardcoded** to
`'volunteer'`, `email` coalesced through `lower(btrim(coalesce(new.email, '')))`, and
`full_name` read from `raw_user_meta_data`. It is `security definer` with `set search_path = ''`.

This branch's design avoided a trigger precisely because the circulating examples of
`handle_new_user()` copy `new.raw_user_meta_data->>'role'` into the profile — a value the browser
supplies to `signUp({ options: { data } })`, and therefore attacker-controlled. **This
implementation does not do that.** It reads only `full_name` from metadata, which is a display
name and carries no privilege. The escalation hole is not present.

`services/auth/authenticate.js` still contains a just-in-time insert. It is now a **fallback**,
reached only if a user somehow exists without a profile row — the trigger dropped, renamed, or a
user created before it existed. It passes no role; `data/profiles.repo.js` injects `'volunteer'`.

`tests/services/auth/authenticate.test.js` asserts that a token whose metadata claims
`role: 'admin'` still resolves as a volunteer. That test is the only automated evidence the hole
stays shut in application code, and should not be deleted.

## Why `05_`

Numeric prefixes are dependency order. `profiles` depends only on `auth.users`, so it could sit
anywhere; `05_` places it after `00_shared` (whose `set_updated_at()` its trigger uses) and
before `10_volunteers`, so that **if** anyone later retargets `volunteers.profile_id` the
ordering already supports it without renaming a folder.

## Foreign keys deliberately not added

| | Why not |
|---|---|
| `volunteers.profile_id` → `profiles(id)` | Currently references `auth.users(id)`. Since `profiles.id` is itself an FK to `auth.users(id)`, the two are semantically identical. Retargeting means `ALTER TABLE` on a live table — an `ACCESS EXCLUSIVE` lock — for zero behavioural gain. |
| `volunteer_signups.profile_id` → `profiles(id)` | Same reasoning. |
| `community_posts.moderated_by` → `profiles(id)` | Its commented-out FK lives in `supabase/migrations/`, which is not applied. Adding the constraint means applying that whole tree first. |

## Known, reported, not fixed here

`public.handle_new_user()` is callable by `anon` and `authenticated` via
`/rest/v1/rpc/handle_new_user`. Exploitability is low — it references `new`, so calling it
outside trigger context errors — but a `security definer` function should not be reachable from
the public API. The fix is `revoke execute on function public.handle_new_user() from anon,
authenticated;`, which does not affect the trigger. **Left to the track that owns the function.**
