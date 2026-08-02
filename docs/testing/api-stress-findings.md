# API stress test — findings

**Run date:** 2026-08-03 · **Commit under test:** `8af092c` (`integration-branch`, as pushed)
**Result:** 136 assertions passed, 4 failed.

Harness: `stress-fundraisers.mjs` (kept outside the repo at `D:\repos\` so it is not
committed). Re-run against a booted server with:

```bash
cd server && node index.js          # or: PORT=3877 node index.js
node D:\repos\stress-fundraisers.mjs
BASE=http://localhost:3877 node D:\repos\stress-fundraisers.mjs   # non-default port
```

Dimensions covered: pagination boundaries, slug fuzzing (traversal / injection / unicode /
overlong), write-validation fuzzing, auth on admin surfaces including mutating verbs, 120-way
concurrent read load, and HTTP method hygiene.

The harness deliberately avoids writing to the **shared** Supabase project — every `POST` in
it is expected to be rejected by validation before reaching the database. See Finding 3 for
where that intent failed.

---

## Summary

| # | Finding | Severity | Introduced by the fundraiser work? |
|---|---|---|---|
| 0 | Fundraiser crediting never fired — `campaign_id` missing from the repo select | **CRITICAL** | **Yes — fixed** |
| 1 | Pagination past the last page returns 500 on 4 list endpoints | HIGH | No — pre-existing, systemic |
| 2 | `GET /api/opportunities` returns 500 at `page=1` | HIGH | No — unrelated track |
| 3 | `STRIPE_SECRET_KEY` empty — the whole donate flow 500s | **HIGH** | No — local config |
| 4 | Stray `campaigns` row created in the shared project | MEDIUM | No — harness bug (cleaned up) |
| 5 | Upstream WAF HTML + egress IP leaked into `message` | LOW | No — pre-existing, dev-only |
| — | `X-Demo-Auth: admin` grants admin | not a bug | Working as designed |

The volume/frequency pass (findings 1–5) found no regression in the fundraiser feature.
**The functional walkthrough did** — see Finding 0, which 558 green unit tests could not
catch.

---

## 0. Fundraiser crediting never fired in reality — CRITICAL (fixed)

The headline result of the functional pass. Every unit test passed, the endpoint returned
`201`, the donation was recorded with its `campaign_id`, the webhook reported success — and
`raised_hkd` stayed at **0**.

```
raised_hkd before        : 0
campaign outcome         : null
raised_hkd after 1st     : 0   (expected 750)
donation campaign_id     : undefined     <-- the tell
```

**Root cause.** `findByStripeSession` in `server/src/data/donations.repo.js` selects an
explicit column list, per the repo convention, and that list **omitted `campaign_id`**. The
webhook's credit is guarded by `if (donation.campaign_id)`. An omitted column is not an
error and not `null` — it is `undefined`, so the branch simply never ran. No exception, no
log line, no failing test. The money was really in Stripe and the fundraiser read zero.

**Why the test suite could not catch it.** Service unit tests stub the repo with
`mock.method()` and return a donation object that already carries `campaign_id`. The stub is
strictly more generous than the real query, so the test proved the *logic* and never touched
the *shape*. This is the structural blind spot of stubbed-repo testing: it cannot detect a
field the real query does not return.

**Fix.** Add `campaign_id` to the select list, plus a regression test that reads the source
of `findByStripeSession` and asserts every column the webhook consumes is present —
`server/tests/data/donations-columns.test.js`. That technique is borrowed from
`tests/routes/admin-mount.test.js`, which guards a similar "invisible at runtime" property.
The test was verified to fail when `campaign_id` is removed again.

**Verified against the real database after the fix:**

```
campaign outcome         : {"campaign_id":"9c2e6fd8-…","credited_hkd":750}
raised_hkd after 1st     : 750   PASS
raised_hkd after retry   : 750   PASS (duplicate delivery did not double-credit)
```

**Lesson worth keeping.** Any repo using an explicit column list is one omission away from a
silently skipped branch downstream. When a service reads `row.someField` behind an `if`,
something must pin that the repo actually selects it.

---

## 3. `STRIPE_SECRET_KEY` is empty — HIGH (config, not code)

`server/.env` on this machine has both `STRIPE_SECRET_KEY=` and `STRIPE_WEBHOOK_SECRET=` set
to empty strings, so the donate flow fails at the first step:

```bash
curl -s -X POST http://localhost:3000/api/donations/checkout \
  -H "Content-Type: application/json" \
  -d '{"amount_hkd":750,"frequency":"once"}'
# {"error":"Internal Server Error","code":"INTERNAL",
#  "message":"STRIPE_SECRET_KEY is not set — see server/.env.example"}
```

**Demo impact:** if the run-through includes donating, it 500s at the "Give" button. Needs a
`sk_test_…` key in `server/.env`; `src/lib/stripe.js` refuses anything that is not a test key,
so there is no risk of a live key slipping in. `STRIPE_WEBHOOK_SECRET` additionally requires
`stripe listen --forward-to localhost:3000/api/webhooks/stripe`, which is also **not installed
on this machine** — without it no webhook reaches localhost, so `raised_hkd` will not move
during a live demo even once the key is set.

---

## 1. Pagination past the last page returns 500 — HIGH

A page beyond the end of the result set should be an empty `200`, not a server error.

```bash
curl -s "http://localhost:3000/api/campaigns?page=999999"
# {"error":"Internal Server Error","code":"INTERNAL",
#  "message":"Database query failed: Requested range not satisfiable"}
```

**Affected** (all on the shared paging helper):

| Endpoint | `?page=999999` | `?page=1` |
|---|---|---|
| `/api/campaigns` | 500 | 200 |
| `/api/articles` | 500 | 200 |
| `/api/community-posts` | 500 | 200 |
| `/api/opportunities` | 500 | 500 (see Finding 2) |
| `/api/wishlist` | 200 | 200 (different impl — unaffected) |

**Root cause.** `server/src/lib/pagination.js:23` computes `from = (page - 1) * limit`, so
`page=999999` at the default limit asks PostgREST for row 11,999,976 of a table holding one
row. PostgREST answers HTTP 416, `assertOk` turns any PostgREST error into
`ApiError(500)`, and the request dies.

Note this is *not* the `?limit=` clamp misbehaving — `limit` is clamped correctly at the top
and rejected at the bottom, exactly as documented. Only the page offset is unguarded.

**Why it is not a fundraiser regression.** `campaigns` inherits it by correctly following the
house pattern (`parsePaging` + `.range(from, to)`), the same as three other tracks.

**Recommended fix** — treat "range past the end" as an empty page rather than an error.
Either short-circuit in the repo when the requested `from` exceeds the counted total, or
detect PostgREST's range error (`PGRST103`) and return `{ rows: [], total }`. Both need a
`count` first, so the repo layer is the right home.

> **Shared-file warning.** The fix lands in `lib/pagination.js` or across four `*.repo.js`
> files, which four tracks depend on. Do not land it mid-rehearsal without telling the team
> (§25). It was deliberately *not* fixed during this run for that reason.

---

## 2. `GET /api/opportunities` returns 500 at page 1 — HIGH

Not an edge case — this endpoint fails on an ordinary first-page request, so it is broken
right now rather than only under stress.

```bash
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/opportunities?page=1"
# 500
```

Unrelated to the fundraiser work and outside its ownership; surfaced incidentally. Belongs to
whoever owns the volunteer track. **Diagnose before the demo if the volunteer surface is on
the script** — of everything on this page, this is the only finding that breaks a normal user
path rather than an edge one.

---

## 4. Stray `campaigns` row in the shared project — MEDIUM (cleaned up)

| | |
|---|---|
| id | `97956127-0398-4a03-854f-41b4ae2762a2` |
| slug | `a-perfectly-real-title` |
| status | `pending_approval` · `goal_hkd` 5000 · `raised_hkd` 0 · no donations |

**Cause — a bug in the harness, not in the API.** The prototype-pollution case was written as
`{ ...valid, __proto__: { admin: true } }`. In a JavaScript object literal `__proto__:` sets
the object's prototype instead of adding an own property, so `JSON.stringify` emitted a
perfectly ordinary payload. The API correctly accepted a valid fundraiser and returned `201`.

**Impact.** `pending_approval` is filtered out of the public directory, so it is invisible to
visitors — but it *does* appear in the admin moderation queue, which is the screen a CRUD demo
would show.

**Action taken:** deleted through `DELETE /api/admin/campaigns/:id`, which also served as the
happy-path test of the delete route. All functional-walkthrough data was removed afterwards
(2 campaigns, 2 donations, 4 donation_allocations, 1 donor, 1 donor_period, 2 stripe_events);
a follow-up count confirmed zero residue and the public directory back to its original
contents.

**Harness fix for next time:** send prototype-pollution payloads as raw strings —
`post("/api/campaigns", '{"__proto__":{"admin":true}, …}')` — so the key survives
serialisation.

---

## 4. Upstream WAF HTML and egress IP leak into `message` — LOW

A slug containing WAF-triggering text is blocked by **Cloudflare in front of Supabase**. The
Supabase client receives an HTML error page, and `assertOk` embeds the whole page in the error
`message` — including the server's public egress IP.

```bash
curl -s "http://localhost:3000/api/campaigns/%27%3B%20DROP%20TABLE%20campaigns%3B--"
# {"error":"Internal Server Error","code":"INTERNAL",
#  "message":"Database query failed: <!DOCTYPE html> … Cloudflare … Your IP: 137.189.241.62 …"}
```

**Bounded by design.** `NODE_ENV=production` suppresses `message` on every error, so this
cannot leak from a deployed environment — it is a development-only exposure.

**Explicitly not SQL injection.** A plain apostrophe returns a correct `404`:

```bash
curl -s "http://localhost:3000/api/campaigns/it%27s"
# {"error":"Not Found","code":"NOT_FOUND","message":"Campaign not found"}
```

The Supabase client parameterises values; the 500 is the WAF reacting to the *string*, not the
database reacting to a query. Worth a §19 line to truncate upstream non-JSON error bodies
before they reach `message`; not worth code churn before the demo.

---

## Not a bug: `X-Demo-Auth: admin` returns 200

The stress run flagged this; it is the documented DEMO-ONLY bypass behaving correctly. It is
triple-gated at `server/src/services/auth/authenticate.js:44` — it requires
`DEMO_ADMIN_USER_ID` **and** `NODE_ENV === "development"` **and** the header. Both env values
are set on this machine, so `200` is the expected result. Already tracked on the §19
pre-production checklist.

---

## What held up

- **Concurrency.** 120 simultaneous `GET /api/campaigns` → 120 × `200`, no 5xx, no transport
  errors, 11.7 ms average, and every response agreed on `meta.total`.
- **Write validation.** All 22 malformed bodies rejected with `400`. Every server-derived
  field (`status`, `slug`, `raised_hkd`, `id`) rejected rather than silently dropped, which is
  the §29 property that matters. Malformed JSON, bare arrays and empty bodies all 4xx.
- **Auth.** Four admin surfaces returned `401` unauthenticated, including `PATCH` and
  `DELETE`; five forged credential shapes (empty bearer, garbage token, `alg:none` JWT, Basic,
  bare `admin`) all failed to reach `200`.
- **Limit clamping.** `?limit=99999` → 50 rows with an honest `meta.limit: 50`; `?limit=0` and
  `?limit=-1` → `400`. Matches the documented intent exactly.
- **Envelope integrity.** Every response carried `data` xor `error` — never both, never
  neither — across all 140 assertions.
- **Slug fuzzing.** Path traversal, encoded traversal, XSS, null bytes, 500-character slugs
  and CJK slugs all returned clean 4xx with no stack traces in the body.

---

## Functional walkthrough — the full fundraiser lifecycle

Run against the real API and the real database, as a user would use it, rather than by
volume. This is the pass that found Finding 0.

| Step | Behaviour | Result |
|---|---|---|
| 1 | Visitor creates a fundraiser | 201, `status` forced to `pending_approval` |
| 2 | Not listed in the public directory while pending | absent |
| 3 | Present in the admin moderation queue | present |
| 4 | Admin PATCHes title and goal | applied |
| 5 | **Renaming does not move the slug** | old `/c/:slug` still resolves 200 |
| 6 | A partial PATCH leaves untouched fields alone | `story` unchanged |
| 7 | PATCH rejects `status` / `slug` / `raised_hkd` / `{}` | 400 each |
| 8 | PATCH on an unknown id | 404 |
| 9 | Moderate → approved | status flips |
| 10 | Now appears publicly, gone from the pending queue | both correct |
| 11 | Re-moderating an approved row | 400, not a silent no-op |
| 12 | Moderate with a bogus status | 400 |
| 13 | Donation succeeds → fundraiser credited | +750, visible via the public API |
| 14 | Duplicate webhook delivery | still 750, not double-credited |
| 15 | **DELETE while donations exist** | **409**, campaign intact, donations still attached |
| 16 | DELETE once donations are removed | 200 `{deleted:true}` |
| 17 | DELETE the same id again | 404, not a second success |

Step 15 is the one worth keeping in mind: the FK is `ON DELETE SET NULL`, so without the
service-level guard Postgres would have accepted the delete and silently stripped the
attribution from two real donations.

### Reproducing the credit path without Stripe

Stripe cannot reach localhost here (no Stripe CLI, and see Finding 3). The credit path was
driven by calling `handleEvent` directly — the same function the webhook route calls *after*
signature verification — against a pending donation row inserted through the real repo.
Everything downstream of the signature check is therefore the real code and the real
database. If the Stripe CLI is installed later, prefer:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
