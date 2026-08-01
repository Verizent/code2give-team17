# Identity

One table, `profiles`, extending `auth.users`. It exists to answer one question the rest of
the API cannot answer for itself: **what role is this caller?**

- `00_profiles.sql` — the table
- `90_grant_admin.example.txt` — how an admin is made (`.txt` on purpose; see below)

## Why `05_`

Numeric prefixes are dependency order, because the replay documented in the parent README is a
single-level glob:

```bash
cat src/schema/*/*.sql | psql "$DATABASE_URL"
```

`profiles` only depends on `auth.users`, which always exists, so strictly it could sit anywhere.
`05_` puts it after `00_shared` (whose `set_updated_at()` the trigger needs) and before
`10_volunteers`, so that **if** anyone later retargets `volunteers.profile_id` to `profiles(id)`
the ordering already supports it without renaming a folder.

`90_grant_admin.example.txt` is **not** `.sql` — the glob above matches any `.sql` file, so an
`.example.sql` would be replayed with its placeholder uuid and fail the whole pipe.

## What this table deliberately does not have

`CONTEXT.md` §13 specifies `role, full_name, email, phone, locale`. **`email` and `phone` are
omitted.**

- **`email`** already has two authoritative homes: `auth.users.email`, which Supabase owns and
  which changes through Auth rather than through us, and `volunteers.email`, the normalised
  business key carrying `check (email = lower(btrim(email)))`. A third copy is the one that goes
  stale silently — which is the whole lesson of §15's donor collation rule. Nothing needs it
  here: the volunteer claim links on the **verified JWT email**, not on a stored copy.
- **`phone`** has exactly one consumer, the volunteer programme, which already has the column.

`full_name` and `locale` stay. An admin has no `volunteers` row, so without a name here the only
way to give them a display name would be to fabricate a volunteer row — which would then be
counted in every volunteer list and headcount on the admin screens.

Adding a column later is additive and safe, so this is the reversible direction to be wrong in.

## Foreign keys deliberately not added

| | Why not |
|---|---|
| `volunteers.profile_id` → `profiles(id)` | Currently references `auth.users(id)`. Since `profiles.id` is itself an FK to `auth.users(id)`, the two are semantically identical. Retargeting means `ALTER TABLE` on a **live** table — an `ACCESS EXCLUSIVE` lock — for zero behavioural gain. |
| `volunteer_signups.profile_id` → `profiles(id)` | Same reasoning. |
| `community_posts.moderated_by` → `profiles(id)` | Its commented-out FK lives in `supabase/migrations/`, which is **not applied**. Adding the constraint would mean applying that whole tree first. |

## How a row is created

**Just-in-time, in `services/auth/authenticate.js`, on a user's first authenticated request.**
There is no trigger on `auth.users`, and that is a security decision rather than a convenience
one:

Every `handle_new_user()` example in circulation copies `new.raw_user_meta_data->>'role'` into
the profile. That value is whatever the browser passed to `signUp({ options: { data } })` — fully
attacker-controlled. Not writing the trigger removes the escalation hole structurally instead of
relying on everyone who edits the file to remember. A failing trigger also fails *inside* GoTrue's
transaction and surfaces as "Database error saving new user", with the cause visible only in
Supabase's logs.

The provisioning call passes no role at all; `data/profiles.repo.js` injects `'volunteer'` and the
column defaults to it. `tests/services/auth/authenticate.test.js` asserts that a token whose
metadata claims `role: 'admin'` still resolves as a volunteer — that test is the only automated
evidence the hole is shut, and should not be deleted.
