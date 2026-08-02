# TDD evidence — admin Analytics tab

**Branch:** `feature/admin/dashboard-access`
**Date:** 2026-08-02
**Source plan:** none on disk — journeys were derived during the planning
conversation that preceded this run, then confirmed against the live database
before any code was written.

## User journeys

1. As Love 21 staff, I want to see whether donors who gave last year gave again,
   so that I know if stewardship is working.
2. As Love 21 staff, I want to see which programmes fill their places, so that I
   know where demand is and where it is not converting to attendance.
3. As Love 21 staff, I want to know how supporters found us, so that outreach
   effort goes where it works.
4. As Love 21 staff, I must never be shown a number the data does not support,
   because I repeat these figures to funders.

Journey 4 is the reason this work was done test-first. The others are arithmetic.

## Why the zero-denominator case dominates the suite

Every metric here is a ratio, and an empty denominator is the *normal* state of
this database rather than an edge case. Measured before implementing:

| Column | Rows populated |
|---|---|
| `sessions.attendance_count` | 0 of 44 |
| `volunteer_signups.feedback_submitted_at` | 0 of 29 |
| `volunteer_signups.discovery_source` | 0 of 29 |
| `donations` in the prior 12-month window | 0 (every row created 2026-08-01/02) |

In JavaScript `0/0` is `NaN`, and `JSON.stringify(NaN)` is `"null"` — so the
corruption is silent. Worse, the obvious "fix" of returning `0` converts a
missing measurement into a false assertion: *0% attended* claims nobody turned
up, and *satisfaction 0* claims volunteers hated it. Both are statements about
the charity that the data does not support, and staff would repeat them.

The rule is therefore: **empty denominator returns `null`, never `0`**, and the
UI renders "Not enough data yet".

## Task report

### Task 1 — remove Class roll and Story desk

Deleting the pages alone would have left the Overview queue pushing four items
linking to `/admin/stories` and `/admin/attendance`.

- **Validation:** `node --test tests/services/admin/dashboard.service.test.js`
- **RED:** verified by stashing only `dashboard.service.js` and re-running —
  `✖ dashboard queue never links to a removed admin tab`,
  `✖ dashboard metrics no longer report pending_proofs`, `pass 3 / fail 2`.
- **First RED was invalid and was rejected:** the initial run failed with
  `ERR_INVALID_ARG_VALUE: 'methodName' must be a method` — a broken stub, not the
  intended reason. Fixing it surfaced a real latent bug (below) before the RED
  was re-established honestly.
- **GREEN:** `pass 5 / fail 0`.

### Task 2 — latent bug found while building the stub

`dashboard.service` called `communityPostsRepo.countByStatus`, which never
existed. The call sat inside a `try/catch`, so every request swallowed a
`TypeError` and `voices_available` was permanently `false` — the Voices count
could never appear on the dashboard. Confirmed against the live API, which was
returning `"voices_available":false`.

Fixed by adding the repo method, using `head: true` so `contact_email` never
travels for what is only a badge count.

### Task 3 — analytics metrics

- **Validation:** `node --test tests/services/admin/analytics.service.test.js`
- **RED:** `Error: Cannot find module '../../../src/data/analytics.repo'` —
  compile-time RED, the repo/service/route did not exist. `pass 0 / fail 1`.
- **GREEN:** `tests 21 / pass 21 / fail 0`.
- **Live confirmation:** `GET /api/admin/analytics` returns
  `donor_retention.rate: null`, `capacity_fill.rate: null`, `satisfaction.*:
  null` against real data — the guard fires in production, not just in tests.

## Test specification

| # | What is guaranteed | Test | Type | Result |
|---|---|---|---|---|
| 1 | A zero denominator yields `null`, never `0` or `NaN` | `analytics.service.test.js:rate returns null — not 0, not NaN…` | unit | PASS |
| 2 | No degenerate input ever produces `NaN`/`Infinity` | `…rate never returns NaN or Infinity for any degenerate input` | unit | PASS |
| 3 | Retention divides by the prior window, not all-time donors | `…donorRetention counts only donors present in BOTH windows` | unit | PASS |
| 4 | A pending gift cannot make a donor look retained | `…donorRetention ignores donations that never succeeded` | unit | PASS |
| 5 | A pending gift cannot create a repeat donor | `…repeatGiftRate does not let a pending gift create a repeat donor` | unit | PASS |
| 6 | Sessions with no recorded attendance report `null`, not 0% | `…capacityFill is null — not zero — when sessions exist but nothing is recorded` | unit | PASS |
| 7 | Satisfaction over zero responses is `null` on every field | `…satisfaction is null on every field when nobody left feedback` | unit | PASS |
| 8 | Only submitted feedback counts toward the average | `…satisfaction averages only rows that actually submitted feedback` | unit | PASS |
| 9 | Programmes group, sum and sort by attendance | `…popularProgrammes groups by programme and sorts by attendance` | unit | PASS |
| 10 | A null programme does not become a bucket | `…popularProgrammes skips rows with no programme rather than inventing a bucket` | unit | PASS |
| 11 | Missing "where did you find us" answers bucket as `unknown` | `…acquisitionSource counts each source and buckets missing answers as unknown` | unit | PASS |
| 12 | The serialised payload never contains `NaN` | `…getAnalytics composes every metric and never returns NaN over the wire` | unit | PASS |
| 13 | The Overview queue never links to a removed tab | `dashboard.service.test.js:dashboard queue never links to a removed admin tab` | unit | PASS |
| 14 | `pending_proofs` is gone from dashboard metrics | `…dashboard metrics no longer report pending_proofs` | unit | PASS |

## Validation commands

```bash
cd server && node --test --test-concurrency=1 "tests/**/*.test.js"   # 411/411 pass
cd client && npm run lint                                            # 6 warnings, all pre-existing
cd client && npm run build                                           # succeeds
cd client && npx tsc --noEmit -p tsconfig.json                       # 135 errors (baseline 142)
```

`npm test` bare was deliberately never run: it also discovers `server/test/`,
which writes to the shared live Supabase project.

## Coverage and known gaps

- **No client tests.** The client has no test tooling and adding it would be a
  shared dependency for six people. `AdminAnalyticsPage.tsx` is verified by
  browser only — screenshot in `.screenshots/admin-analytics-tab.png`, no console
  errors.
- **Type checking is not a gate.** `vite build` does not run `tsc`, and there is
  no `typecheck` script. 135 pre-existing errors remain, almost all from the
  duplicate `apiClient.js` / `apiClient.ts` trap where TypeScript resolves the
  dead `.ts` stub while Vite uses the live `.js`. This branch reduced the count
  from 142; it did not attempt the underlying fix, which needs the frontend
  owner's agreement.
- **The seed was never executed.** `npm run seed:analytics` writes to the shared
  live project. It is syntax-checked (`node --check`) and its two upsert keys were
  verified `UNIQUE` in the live schema (`donors_email_key`,
  `donations_stripe_session_id_key`), but its runtime behaviour is unproven.
- **Six of six metrics currently read `null` or `0` against real data.** That is
  correct behaviour, not a gap — but it means the tab has only been seen in its
  empty state. It has never been rendered against populated data.

## Merge evidence

Checkpoint commits on this branch, in order:

```
630f6ea refactor: remove Class roll and Story desk tabs      (RED→GREEN, task 1+2)
9dedb2c test: add reproducer for admin analytics metrics     (RED, task 3)
731fc7b feat: add admin analytics metrics behind GET …       (GREEN, task 3)
4bf7305 feat: add the admin Analytics tab                    (client)
73a1e68 feat: add opt-in analytics seed                      (seed, unexecuted)
```

If these are squashed, the RED/GREEN summary above must be copied into the PR
body — otherwise the evidence that the null-guard was proven, rather than
assumed, is lost.
