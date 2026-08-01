# Volunteer schema

Reference documentation for the volunteer tables. `CONTEXT.md` is the project's source of truth;
this folder documents what is actually deployed.

- **Project:** `Love21` · `vvavqcapffgyxbtlesgs` · ap-northeast-1 · Postgres 17
- **Tables:** 6, all **empty** — no seed data yet

```
src/schema/
├── README.md                     this file — conventions, relationships, the rules
├── 00_shared/                    objects other domains may reuse
│   └── 00_set_updated_at.sql
├── 10_volunteers/                THE DELIVERABLE — 6 tables
│   ├── 00_volunteers.sql
│   ├── 10_volunteer_opportunities.sql
│   ├── 20_volunteer_signups.sql
│   ├── 30_volunteer_interests.sql
│   ├── 40_badges.sql
│   └── 50_volunteer_badges.sql
└── 20_email_verification/        deployed but UNUSED — logic was removed
    └── 00_volunteer_email_verifications.sql
```

Each folder has its own `README.md` explaining the domain. Start there, then the `.sql` files —
they are annotated with the reasoning, not just the DDL.

**These files are the definition of record — the current state, not the history.** The applied
migration history lives in `supabase/migrations/` (see `supabase/README.md`). The deployed schema
was last rebuilt directly from these files by the `rebuild_volunteer_schema_from_files` migration,
so the two are known to agree. If you change the schema, write a migration **and** update the file
here in the same PR, or this folder becomes fiction.

**Numeric prefixes on both folders and files are dependency order**, so a plain glob replays the
whole schema against an empty database in the right sequence:

```bash
cat src/schema/*/*.sql | psql "$DATABASE_URL"
```

`00_shared` first because every table with `updated_at` needs the trigger function.
`20_email_verification` last because it ends with an `ALTER TABLE` on `volunteers`.

> **`public.set_updated_at()` is shared beyond this schema.** `campaigns`, `donations`, `donors`,
> `wishlist_items` and `wishlist_pledges` all have triggers on it. It is written as
> `CREATE OR REPLACE` so re-running is safe — but **never `DROP FUNCTION ... CASCADE`** on it, or
> you silently remove five of another track's triggers.

---

## Two properties to know before your first query

**Every table has RLS enabled with zero policies.** Deliberate: §9 puts the service-role key on
the server and treats RLS as defence in depth. The consequence is that **the anon key reads
nothing and writes nothing, without raising an error** — you get empty arrays, which looks exactly
like an empty table. Connect with `SUPABASE_SERVICE_ROLE_KEY`.

The `rls_enabled_no_policy` advisor notices on all six tables are expected. Do not "fix" them by
adding policies.

**`updated_at` is maintained by a trigger.** A value you pass is overwritten.

---

## Identity — read this before the columns

**Volunteers do not need an account.** If you assume a normal auth-gated signup, several foreign
keys read as wrong.

A volunteer registers with an email and a name, producing a `volunteers` row holding an
`access_token` — a bearer capability that *is* their identity. They may later convert it into a
permanent account, setting `profile_id` and `claimed_at`, and their history carries over. This
mirrors §15's donor flow, where the tokenised link is likewise the identity.

1. **`volunteer_id` is the identity — not `profile_id`.** `volunteer_signups.profile_id` is
   nullable and usually null. A query keyed on it silently misses nearly every volunteer.
2. **`access_token` is a bearer capability.** Never log it, never put it in an error message,
   never build an endpoint that lists or searches tokens, and `noindex` any page rendering one.
3. **Normalise every email — on write *and* on lookup** (lowercase, trim). The database enforces
   it with a CHECK, so an un-normalised *write* throws loudly; an un-normalised *lookup* just
   finds nobody and looks like "no such volunteer".

---

## Relationships

```
volunteers ──┬─< volunteer_signups >── volunteer_opportunities
             │        unique (opportunity_id, volunteer_id)
             │
             ├─< volunteer_interests >── volunteer_opportunities
             │        unique (opportunity_id, volunteer_id)
             │
             └─< volunteer_badges >── badges
                      unique (volunteer_id, badge_id)

volunteers.profile_id ──> auth.users     null until permanent
```

Every FK from `volunteers` is `ON DELETE CASCADE`; `volunteers.profile_id` is
`ON DELETE SET NULL`.

**FK note:** `profile_id` references `auth.users(id)` rather than `profiles(id)`, because
`profiles` is another track's table and did not exist yet. §13 says `profiles` extends
`auth.users`, so the ids are the same value and this stays correct either way.

---

## Seats remaining

`source = 'handson'` means registration is open in **both** places against one shared `capacity`.
Three numbers are involved and only two of them count:

```
seats_left = capacity
           − spots_filled                     ← bookings made on HandsOn
           − confirmed volunteer_signups      ← bookings made here
```

- **`spots_filled` holds HandsOn's count only.** Never our own signups, and never a pre-computed
  "seats left" — storing the external number keeps the two systems independent, so an admin
  refresh and a local signup cannot clobber each other.
- **`volunteer_interests` never counts against capacity.** Leads are not bookings (§17, §29).
  Counting them shows staff four people where there is one.
- **`last_synced_at` is how stale `spots_filled` is.** Between refreshes the figure drifts, and
  with capacity often 1 (§5) one HandsOn booking is the difference between open and full.

**Two systems, one capacity pool.** Nothing here prevents a HandsOn booking and a local signup
taking the same seat between refreshes. The cheapest guard is leaving local signups at `applied`
for admin confirmation, which `status` already supports. A per-channel capacity split would
eliminate it instead, but needs a new column.

---

## Conventions

| | |
|---|---|
| Naming | `snake_case`, matching the §29 API contract, so there is no mapping layer |
| Keys | `uuid` primary keys, `gen_random_uuid()` |
| Times | `timestamptz`, always UTC. The client formats; the server never sends display strings |
| Enums | `text` + `CHECK`, not Postgres enum types — adding a value is a one-line migration |
| Bilingual | `_en` / `_zh` column pairs. `_en` required, `_zh` optional (§21) |
| Staff-only | `signup_motivation`, `improvement_note` — stored, never displayed publicly (§23) |

---

## Known gaps

- **No `unique (handson_opportunity_id)`** on `volunteer_opportunities`. Fine while sync is
  manual; an automatic sync needs it, or a re-run can silently duplicate a listing.
- **No per-channel capacity split** — see "Seats remaining" above.
- **No safeguarding or induction step.** §20.5 asks whether screening is required before a first
  session; classes include participants from age 6. **This can invalidate the flow rather than
  decorate it.** §20.6 asks the same about induction. Both unconfirmed with Love 21.
- **`volunteers.email_verified_at` and the `volunteer_email_verifications` table are unused.**
  They remain in the database from an email-verification feature whose logic was removed. Both are
  documented in `schema/20_email_verification/`, which also records how to drop them. Treat the
  column as read-only unless that feature is rebuilt.

---

## Not settled against CONTEXT.md

These are team decisions that differ from the document. Confirm before relying on either:

- **Volunteers not needing an account** differs from §13 (which gives `volunteer_signups` a
  `profile_id`), §29 (which files signups under *"Volunteer (authed)"*) and §12 (which marks
  `/help/volunteer/me` as `[auth]`). This is why `profile_id` is nullable.
- **`source = 'handson'` meaning dual registration** differs from §17, which describes those
  listings as interest capture with the booking completed on HandsOn.
- **`volunteer_interests`** is not a table §13 names, and its purpose depends on the above.
