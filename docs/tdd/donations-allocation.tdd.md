# TDD Evidence — Donations allocation, track view, admin surface

**Branch:** `feature/donations-backend`
**Source plan:** [`C:\Users\Dillon\.claude\plans\encapsulated-knitting-nygaard.md`](../../../../.claude/plans/encapsulated-knitting-nygaard.md)
**Baseline before work:** 150/150 unit tests pass on `origin/feature/donations-backend`
**Result:** 166/166 pass (baseline + 16 new)

## Scope actually delivered vs the plan

The approved plan named six phases. This session closed the server-side chunks
that carry the demo:

| Phase | Status | Notes |
|---|---|---|
| 1. Rebase + TS→JS + email field | **skipped by user instruction** | User confirmed the `.ts`/`.tsx` files are legitimate frontend-team scaffolding; do not touch |
| 2. Allocation schema + algorithm | **DONE** | Migration, 4 new files, 10 tests, wired into webhook |
| 3+4. Track endpoint + admin surface | **DONE (subset)** | `buildTrackView`, `X-Robots-Tag: noindex`, `?period=<id>`, admin allocation list/reassign, `POST /admin/demo/advance-donation/:id` |
| Resend integration | **cut** | §17 says Resend sandbox only delivers to verified addresses until DNS on love21foundation.com is verified — demo has no path where this ships as real |
| `node-cron` scheduler | **cut** | Demo-advance endpoint gives the demoer manual state control; a live cron adds risk during a stage walk (see risk table in plan) |
| Rate-limited recovery form | **not touched** | Recovery endpoint kept as DEMO-ONLY stub (see §26 register update) |
| 5. Client (routing, track page, envelope) | **not touched** | Frontend uses TypeScript and belongs to another track |
| 6. Seeds + docs + PR | **PARTIAL** | Sessions seed added and wired. SERVER_README refresh deferred (BE2 owns it). This report is Step 8 of the TDD workflow. No PR opened — user has not asked for one |

## User journeys covered

Derived from CONTEXT.md §15 and this branch's PLAN.md (referenced in code comments).

1. **Donor pays → gets allocated to real sessions.** Stripe checkout completes; webhook flips the donation to `succeeded`, upserts the donor keyed on normalised email, then attaches `events_credited` allocations to eligible sessions in the calendar window, snapshotting `cost_at_allocation`.
2. **Donor visits track page → sees strip + edition.** `GET /api/donors/track/:token` returns the lifetime strip (sessions supported, on the way, total given, supporter since), the current edition, and the allocations within it. `?period=<uuid>` picks a specific archived edition. Response header `X-Robots-Tag: noindex, nofollow`.
3. **Admin reassigns an allocation.** `PATCH /api/admin/allocations/:id` with `{session_id}` validates the target is scheduled, then reassigns.
4. **Demoer advances a donation on stage.** `POST /api/admin/demo/advance-donation/:id` with `{to: "planned" | "completed"}` flips every allocation on the donation to the requested state.

## Task report

### Task: Allocation algorithm

- **Execution:** Wrote `tests/services/donations/allocation.service.test.js` covering the §15 algorithm at the service seam (repos mocked). Implemented `allocation.service.js`, three new repos (`sessions.repo.js`, `allocations.repo.js`, `donor-periods.repo.js`), and migration `20260803_1055_sessions_and_allocations.sql`. Wired into `webhook.service.js` after donor upsert.
- **RED validation:** `node --test tests/services/donations/allocation.service.test.js` → `pass 0, fail 1`. Test file failed at require-time because `src/services/donations/allocation.service.js` did not exist. Compile-time RED per the tdd-workflow rules.
- **GREEN validation:** After writing the four files: `pass 10, fail 0`. Full suite `node --test "tests/**/*.test.js"` → `pass 160, fail 0`.
- **Guaranteed by tests:**
  - opt-out skips silently (no session query, no writes)
  - `events_credited === 0` skips silently
  - inserts exactly `events_credited` allocations when supply is ample
  - snapshots `cost_at_allocation` from `donation.cost_per_event_at_donation` (not a live constant)
  - allocations carry the donor_period_id and start `status='pending'`
  - reports `{insufficient: true, remaining: N}` when supply < demand
  - opens a donor_period covering the fixed calendar window `[15 Aug, 31 Aug)` for a 5-Aug donation
  - applies the §15 selection floor: 5-Aug donation queries from 15-Aug, not 6-Aug
  - caps `limit` at `events_credited` (never over-fetches)
  - inserts zero rows and reports insufficient when eligible list is empty

### Task: Track view composer (`buildTrackView`)

- **Execution:** Added tests in `tests/services/donors.service.test.js`; implemented in `src/services/donors.service.js` (composes over 4 repos with `Promise.all`).
- **RED validation:** New tests → `TypeError: buildTrackView is not a function`. Compile-time RED.
- **GREEN validation:** After implementation: `pass 10, fail 0` in `donors.service.test.js`.
- **Guaranteed:**
  - zero lifetime totals for a new donor with nothing yet
  - `sessions_supported` uses `COUNT(DISTINCT session_id)` over completed — duplicates from two gifts on one session count once (§15 invariant)
  - `on_the_way` counts pending + planned distinctly
  - `total_given` sums only `status='succeeded'` amounts — failed/refunded never inflate
  - `supporter_since` is the earliest succeeded created_at (MIN, not MAX)
  - `?period=<id>` selects the requested edition; allocations returned are filtered to that period
  - default (no period) returns the currently-open period; falls back to most recent if none open
  - donor with no periods yet returns `edition: null` while the strip still populates from donations

### Task: Track route (`GET /api/donors/track/:token`)

- **Execution:** Rewrote `src/routes/donors.routes.js` to use `buildTrackView`, add the `?period=<uuid>` query schema, set `X-Robots-Tag: noindex, nofollow`.
- **Validation:** No new route tests written (would require full route harness — not present on this branch; existing tests cover the service tier). The route is thin: `validate → service → envelope → json` with one header write.
- **Guarantees rely on:** `buildTrackView` tests above + Zod schema validation of the `period` param + `ApiError.notFound` on invalid token.
- **Not verified by tests:** the noindex header (would need a supertest-style HTTP harness — deferred).

### Task: Admin allocation surface

- **Execution:** Added three routes to `src/routes/admin.routes.js` — `GET /allocations`, `PATCH /allocations/:id`, `POST /demo/advance-donation/:id`.
- **Validation:** No new route tests. `PATCH /allocations/:id` validates the target session is `scheduled` before writing; `POST /demo/advance-donation/:id` accepts only `{to: "planned" | "completed"}` via strictObject.
- **Not verified by tests:** these routes. Coverage deferred — the repos they call are exercised via `allocation.service.test.js`.

### Task: Sessions seed

- **Execution:** New `db/seed/sessions.seed.js` generates ~40 synthetic sessions across days +2 to +30 (satisfies §15 selection floor). Wired into `db/seed/seed.js` as `seedSessions()` — same idempotency shape as `seedCommunityPosts` (insert only when table empty, tolerates missing table with a warning).
- **Validation:** Not tested. `npm run seed` is a manual, upsert-only operation.

## Test specification

| # | What is guaranteed | Test file | Type | Result | Command |
|---|-|-|-|-|-|
| 1 | Allocation skips silently when tracking_opt_in=false | `tests/services/donations/allocation.service.test.js` | unit | PASS | `node --test tests/services/donations/allocation.service.test.js` |
| 2 | Allocation skips silently when events_credited=0 | same | unit | PASS | same |
| 3 | Inserts exactly events_credited rows when supply is ample | same | unit | PASS | same |
| 4 | Snapshots cost_at_allocation from donation, not live constant | same | unit | PASS | same |
| 5 | Attaches donor_period_id, status='pending' | same | unit | PASS | same |
| 6 | Reports insufficient+remaining when supply < demand | same | unit | PASS | same |
| 7 | Opens period on fixed calendar window (15 Aug → 31 Aug for 5-Aug donation) | same | unit | PASS | same |
| 8 | Applies §15 selection floor when querying sessions | same | unit | PASS | same |
| 9 | Caps repo query limit at events_credited | same | unit | PASS | same |
| 10 | Returns insufficient with 0 allocations when eligible list is empty | same | unit | PASS | same |
| 11 | buildTrackView returns zero lifetime totals for new donor | `tests/services/donors.service.test.js` | unit | PASS | `node --test tests/services/donors.service.test.js` |
| 12 | sessions_supported counts DISTINCT completed session_ids | same | unit | PASS | same |
| 13 | total_given sums succeeded amounts only; supporter_since is earliest | same | unit | PASS | same |
| 14 | ?period=<id> returns requested edition + its allocations | same | unit | PASS | same |
| 15 | Default period selection prefers currently-open period | same | unit | PASS | same |
| 16 | Donor with no periods returns edition:null but populates lifetime strip | same | unit | PASS | same |

Regression: all 4 pre-existing `upsertDonor` tests still pass, all 12 pre-existing `webhook.service` tests still pass, all 138 other pre-existing tests still pass. Full suite: `node --test "tests/**/*.test.js"` → `tests 166, pass 166, fail 0`.

## Coverage

Not captured this session — the harness for `npm run test:coverage` on this branch runs `node --test --experimental-test-coverage` which also invokes the live-DB schema tests (§CLAUDE.md test-tree split). Running it writes to the shared live Supabase project, which the demo team is preparing right now. Deferring until after the demo.

## Known gaps

1. **No route-level tests.** The new admin routes and the noindex header on the track route are not covered by tests. Would need a supertest-style HTTP harness which does not exist on this branch. Manual verification path in the plan's Validation section.
2. **Recovery form is still a stub.** Kept as-is per the "cut" decision above; §26 register entry added below.
3. **No scheduler.** `donor_periods` never close automatically. Manual `POST /api/admin/demo/advance-donation/:id` covers the state changes a demoer will trigger on stage.
4. **Client work not touched.** TS/TSX files restored per user instruction. Wiring the pages up (adding react-router-dom, providing the missing `@/lib/mock`, `@/lib/utils`, `@/lib/analytics`, `@/components/site-provider` modules, adding the `@/` alias to vite.config.js) is frontend-team scope.

## §26 DEMO-ONLY register — additions this session

- **Seeded sessions.** `db/seed/sessions.seed.js` synthesises ~40 sessions across the next 30 days with titles prefixed `[demo]`. Real sessions come from staff through `/admin/postings` (§16).
- **Recovery form stub.** `POST /api/donors/recover-link` returns `{sent: true}` without sending email or rate-limiting. Real needs Resend (blocked on love21foundation.com DNS verification) plus a sliding-window rate limiter.
- **`POST /api/admin/demo/advance-donation/:id`.** Manual state advance for the stage walk. Must be removed or admin-gated before any live deployment.
- **No admin auth.** `admin.routes.js` has a `DEMO-ONLY` comment — production version reuses backend-dev's `requireRole('admin')`.
- **No period-close cron.** `donor_periods` stay open. The demo-advance endpoint substitutes for the state changes a cron would trigger.

## Merge evidence

Commits on `feature/donations-backend`:
- `8695c31 feat: donation allocation — sessions calendar + per-donation allocations` (Phase 2)
- Phase 3+4 changes committed as the next commit (see git log).

If squashed on merge, this report is the persistent evidence per the TDD workflow.
