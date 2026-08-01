# Schema CRUD tests

Create / read / update / delete coverage for every table in `server/src/schema`, plus the
constraints that make the schema trustworthy.

```bash
cd server
npm test                    # everything
npm run test:schema         # just these
node --test test/schema/10_volunteers/volunteers.test.js   # one file
```

No test framework. Node's built-in `node:test` and `node:assert` only — nothing added to
`package.json` dependencies, which matters when six people share the file (§25, §30).

## Layout mirrors the schema

```
test/schema/
├── _helpers.js                 client, cleanup tracker, assertion helpers
├── 10_volunteers/
│   ├── volunteers.test.js
│   ├── volunteer-opportunities.test.js
│   ├── volunteer-signups.test.js
│   ├── volunteer-interests.test.js
│   ├── badges.test.js
│   └── volunteer-badges.test.js
└── 20_email_verification/
    └── volunteer-email-verifications.test.js
```

## They run against the real, shared project

There is no local database, so these hit `Love21` directly — **alongside other tracks' data**.
Two rules follow, both enforced in `_helpers.js`:

- **Every row is uniquely named** (`test-<label>-<uuid>@example.test`), so parallel runs and
  other people's data never collide. Badge `threshold` values are drawn from a ~2e9 space for the
  same reason — `(criteria_type, threshold)` is unique, and a narrow window would eventually make
  two simultaneous runs collide and fail in a way that looks like a schema bug.
- **Cleanup deletes by tracked id only.** Never a blanket delete, never a `like 'test-%'` sweep.
  If a run is killed mid-way it may leave rows behind; they are harmless and obvious.

**Two runs at once are safe**, but row counts mid-run are then a mix of both — don't read a count
during a run and conclude cleanup is broken.

`--test-concurrency=1` is set because every assertion is a round trip to ap-northeast-1 and
serial output is far easier to read when something fails. The full suite takes a few minutes.

## Credentials

The suites **skip** rather than fail when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are
missing from `server/.env`. That is deliberate: RLS is enabled with no policies, so the anon key
sees nothing, and a run on the wrong key would produce a wall of confusing empty-result failures
instead of the one fact that matters.

## What is asserted beyond plain CRUD

CRUD alone would pass against a schema with no constraints at all, which is the schema most
likely to be wrong. Each suite also pins the rules that are silent when broken:

| Area | Asserted |
|---|---|
| Identity | a signup works with **no `profile_id`** — the whole point of the tokenless model |
| Email | un-normalised addresses are rejected on `volunteers` and `volunteer_email_verifications` |
| Tokens | `access_token` under 32 chars refused; duplicates refused |
| Claiming | `claimed_at` without `profile_id` refused, so no half-claimed rows |
| `updated_at` | the trigger **overrules** a caller-supplied value |
| Duplicates | second signup, second interest, second badge award all rejected |
| Badges | re-awarding is refused, which is what makes evaluation safely re-runnable |
| Cascades | deleting a volunteer removes signups, interests and awards — but **not** verifications, which prove an address rather than a relationship |
| HandsOn | a `handson` listing with no `handson_url` is refused |
| Overbooking | `spots_filled` **may exceed** `capacity` — asserted deliberately, see below |
| Never sum | `spots_filled` and interest counts are read as two separate figures |
| Verification | a token cannot exist on an unconsumed row; consuming twice fails the second time |

> **Two tests assert that something is *allowed*, and both are load-bearing.**
>
> `spots_filled` may exceed `capacity`: if HandsOn oversells or capacity is revised down, the
> sync write must still land. A `CHECK` there would freeze the number stale on a failure we do
> not control.
>
> Verification rows survive deletion of the volunteer: they key on an address, not a row.

## Found by this suite

The first run failed every test with `permission denied for table volunteers`, on a valid
service-role key. The volunteer tables had been created without DML grants — only
`REFERENCES, TRIGGER, TRUNCATE` — so they were unreachable through the API entirely, while the
donations track's tables were fine. Fixed by the `grant_volunteer_tables_to_service_role`
migration. Nothing else had exercised the tables through PostgREST, so nothing had caught it.
