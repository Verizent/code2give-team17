# Fundraisers (campaigns) — CRUD + Stripe payment

TDD evidence for the fundraiser work on `work/integration-dillon`. Journeys were derived
during this run; there is no separate `.plan.md`.

Runner is `node:test`. **Offline tree only** — never bare `npm test`, which also runs
`server/test/` against the shared live Supabase project:

```bash
cd server && node --test --test-concurrency=1 "tests/**/*.test.js"
```

## Why this was mostly repair

Two implementations of the domain existed. `services/donations/campaigns.service.js` follows
the house rules and had unit tests; `services/campaigns.service.js` was what actually served
traffic, bypassing the repo layer. The client (`features/donations/campaign-store.ts`) was
written against the **compliant** contract, so three things were already broken in `main`:

| Break | Why it was invisible |
|---|---|
| Public directory always empty | Legacy route returned `{public, mine, meta}`; `apiData` unwraps `data`, so `(data ?? [])` yielded `[]`. No error anywhere. |
| Admin moderation always 404 | Legacy `mapCampaign` omitted `id`, so the client sent `/api/admin/campaigns/undefined/moderate`. The legacy route was slug-keyed anyway. |
| `raised_hkd` permanently 0 | Checkout stored `campaign_id` on the donation; the webhook never credited the campaign. `campaignsRepo.addRaised` was dead code. |

## User journeys

1. As a visitor, I start a fundraiser, so that it awaits admin approval.
2. As a visitor, I see approved fundraisers and their real progress, so that I can decide who to give to.
3. As a donor, I give to a specific fundraiser, so that my gift moves *that* fundraiser's total.
4. As an admin, I edit a fundraiser, so that I can correct a typo without moving its public URL.
5. As an admin, I delete a fundraiser, so that spam does not sit in the queue — but never one that has taken money.

## Test specification

| # | What is guaranteed | Test | Type | Result |
|---|---|---|---|---|
| 1 | An earmarked donation credits its fundraiser by the donation amount | `webhook.service.test.js:a donation earmarked for a fundraiser credits its raised total` | unit | PASS |
| 2 | An unearmarked donation never touches a fundraiser | `webhook.service.test.js:an unearmarked donation never touches a fundraiser` | unit | PASS |
| 3 | A replayed/already-succeeded donation is not credited twice | `webhook.service.test.js:an already-succeeded fundraiser donation is not credited twice` | unit | PASS |
| 4 | A failing credit does not escape the webhook (no Stripe retry loop) | `webhook.service.test.js:a failing fundraiser credit does not fail the webhook` | unit | PASS |
| 5 | Delete refuses once any donation references the fundraiser, and does not call `remove` | `campaigns.service.test.js:deleteCampaign refuses to orphan donations` | unit | PASS |
| 6 | Delete proceeds when no donation references it | `campaigns.service.test.js:deleteCampaign removes a fundraiser that has taken no money` | unit | PASS |
| 7 | Delete 404s on unknown id, checking existence before counting | `campaigns.service.test.js:deleteCampaign 404s on an unknown id` | unit | PASS |
| 8 | Update 404s on unknown id | `campaigns.service.test.js:updateCampaign 404s on an unknown id` | unit | PASS |
| 9 | Update forwards only the supplied fields (no widening to every column) | `campaigns.service.test.js:updateCampaign forwards only the fields it was given` | unit | PASS |
| 10 | An empty patch 400s rather than reporting a no-op success | `campaigns.service.test.js:updateCampaign rejects an empty patch...` | unit | PASS |

## RED / GREEN evidence

**Phase 1 — money path.** RED: `addRaised` call count `0 !== 1`, and `result.campaign`
undefined. Commit `a30eab7`. GREEN after crediting in `handleCheckoutCompleted`: 15/15 in
`webhook.service.test.js`. Commit `ba41dcb`.

**Phases 2–3 — update/delete.** RED: 6 new tests fail (missing `updateCampaign`,
`deleteCampaign`, `campaignsRepo.update/remove`, `donationsRepo.countByCampaign`), 6 existing
pass. Commit `4a347bd`. GREEN: 12/12 in `campaigns.service.test.js`. Commit `c9c8a2d`.

**Phase 4 — rewiring.** Routes converged, legacy service deleted. Commit `572de8f`.

**Full tree:** 541 → **551 tests, 528 passing, 0 failing, 23 skipped.**

## Why the idempotency argument holds

The credit sits behind three gates, which is deliberate — a double credit raises no error and
writes no bad row; the total is just wrong.

1. `handleEvent` calls `stripeEventsRepo.recordOnce` **before** any handler runs.
2. `handleCheckoutCompleted` returns early when `donation.status === "succeeded"`.
3. The credit is placed *after* the status flip, so a replay past gate 1 still meets gate 2.

## Manual verification

Booted on a free port (see "Ports" below) against the live schema:

```
GET /api/campaigns        200  {"data":[{"id":"f93819fa-…", …}], "meta":{"total":1,"page":1,"limit":2}}
GET /api/admin/campaigns  401  (mounted and guarded)
```

`data` present and `id` present are exactly the two things the client needs and the legacy
route did not provide.

## Ports — read before probing a running server

Long-lived stale `node` servers were found holding **3000** (started 08-01) and **3100**
(started 08-02). Probing them returned a `404` for `/api/campaigns` and then the legacy
`{"public": …}` body, which reads exactly like the new code being broken. It was not. Check
the owner before trusting a probe:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen |
  ForEach-Object { Get-Process -Id $_.OwningProcess | Select-Object Id, ProcessName, StartTime }
```

A `StartTime` older than your session means you are talking to someone else's server.

## Coverage and known gaps

Per [CONTEXT.md §26](../../CONTEXT.md), effort went to failures that are silent and
expensive rather than to a coverage percentage. Deliberately untested: route-level wiring
(covered by `tests/routes/admin-mount.test.js` for the guard) and the repo functions
themselves, which are thin PostgREST calls with no branching.

## DEMO-ONLY

- **`addRaised` is a read-then-write.** Two donations to one fundraiser landing together can
  lose an update. Real version needs an atomic `raised_hkd = raised_hkd + $1` via RPC or
  migration. Harmless at demo volume.
- **Mutations are admin-only**, standing in for a per-creator ownership model. `campaigns`
  has no `owner_id`, so "the creator may edit it" is not expressible without a migration.
  The client's "my campaigns" list is sessionStorage — a convenience, not a permission.
- **`POST /api/campaigns` is public and unrate-limited**, matching the existing
  `POST /api/community-posts` posture.
