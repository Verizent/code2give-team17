# Server README

> This file lives at `server/SERVER_README.md` and covers the Express API workspace only.
> For full project context (stack, architecture, git workflow, demo rules) see the root
> [`CLAUDE.md`](../CLAUDE.md) and [`CONTEXT.md`](../CONTEXT.md).

## Setup

```bash
cd server
npm install
cp .env.example .env   # fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY at minimum
npm run dev            # node --watch index.js — port 3000
```

For the **donation flow** you additionally need `STRIPE_SECRET_KEY` (test mode, `sk_test_`)
and `STRIPE_WEBHOOK_SECRET` — the latter is printed fresh by every `stripe listen` run and
must be re-pasted each session. `EMAIL_MODE` defaults to `log`, which is what the demo uses.
See [Running it locally](#running-it-locally).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Start with file-watching (`node --watch`) |
| `npm start` | Production start (`node index.js`) |
| `npm test` | Run **both** test trees (unit + live-DB schema) |
| `node --test tests/` | Unit tests only — no database needed |
| `npm run test:schema` | Live-DB schema tests only (`test/schema/`) |
| `npm run test:coverage` | Coverage report |
| `node --test tests/lib/slug.test.js` | Single file |
| `node --test --test-name-pattern "slug"` | Single test by name |
| `npm run seed` | Upsert seed data — safe to re-run |

> **`npm test` writes to the shared live Supabase project.** Do not run it while someone
> is rehearsing the demo. `node --test tests/` is always safe.

## Architecture

```
index.js              entry — loads .env, starts server
src/
  app.js              express setup: json, CORS (hand-rolled), routes, 404, error handler
  config/supabase.js  singleton service-role client — never expose this key to the client
  routes/             thin handlers: validate → service → envelope → json
  services/           all business rules — what routes and cron jobs share
  data/               Supabase queries only; every call ends with assertOk(error)
  lib/                pure utilities (ApiError, envelope, resolveLocale, parsePaging, …)
  schemas/            Zod v4 schemas — strictObject for bodies, object for queries
  middleware/         validate.js, error-handler.js, not-found.js
db/seed/              upsert-only seed scripts
supabase/migrations/  content-track SQL (NOT yet applied — see below)
src/schema/           volunteer-track SQL (applied to live project)
test/schema/          live-DB tests for the volunteer schema
tests/                unit tests mirroring src/ (no database)
```

**New routes** go in `src/routes/index.js`, registered alphabetically.

---

## API endpoints

### ✅ Built and live

#### Probe routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Server banner `{ message, status }` |
| `GET` | `/api` | API banner `{ message, status }` |
| `GET` | `/api/health` | Health check `{ status, timestamp }` |
| `GET` | `/api/health/supabase` | Supabase connectivity check |

These four are **unwrapped** — no `data:` envelope, as they are probes, not resources.

---

#### Content — Home + News track (our responsibility)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/articles` | None | Paginated article list |
| `GET` | `/api/articles/:slug` | None | Single article by slug |
| `GET` | `/api/community-posts` | None | Approved Voices posts, paginated |
| `POST` | `/api/community-posts` | None | Submit a Voices post (goes to moderation queue) |
| `GET` | `/api/impact` | None | Current impact period figures |
| `GET` | `/api/admin/community-posts` | Admin | Moderation queue (all pending posts) |
| `POST` | `/api/admin/community-posts/:id/moderate` | Admin | Approve or reject a Voices post |
| `GET` | `/api/opportunities` | None | Volunteer opportunity listings (open/full) |
| `GET` | `/api/opportunities/:id` | None | Single opportunity |
| `POST` | `/api/email-verifications` | Rate-limited | Start email verification |
| `PUT` | `/api/email-verifications/:id/confirmation` | None | Confirm 6-digit code, receive `verification_token` |
| `POST` | `/api/volunteers` | None | Register volunteer with `verification_token` |
| `GET` | `/api/volunteers/:token` | None | Volunteer page (by anonymous token) |
| `PUT` | `/api/volunteers/:token/account` | Auth | Claim permanent account by linking auth user |
| `GET` | `/api/volunteer/me` | Auth | Volunteer profile with hours, badges, signups |
| `POST` | `/api/volunteer/interest` | Optional auth | Programme or opportunity interest |
| `POST` | `/api/volunteer-signups` | Optional auth | Create signup |
| `PATCH` | `/api/volunteer-signups/:id` | Volunteer token | Capture §23 discovery + feedback fields (owner-checked) |
| `DELETE` | `/api/volunteer/signups/:id` | Auth | Cancel own signup |
| `GET` | `/api/admin/postings` | Admin | List all opportunities (every status) |
| `POST` | `/api/admin/postings` | Admin | Create opportunity |
| `PATCH` | `/api/admin/postings/:id` | Admin | Update opportunity |
| `DELETE` | `/api/admin/postings/:id` | Admin | Delete opportunity |
| `GET` | `/api/admin/postings/:id/signups` | Admin | Full signup roster with §23 fields + joined volunteer info |
| `GET` | `/api/admin/postings/:id/feedback` | Admin | Aggregate: avg rating, would_return %, discovery breakdown |
| `POST` | `/api/admin/attendance/:id/attendance` | Admin | Bulk mark attendance + evaluate badges + auto-send thank-you email |
| `POST` | `/api/admin/handson/sync` | Admin | DEMO-ONLY HandsOn stub sync |

> **DEMO-ONLY: `POST /api/admin/handson/sync` returns a stub.** Real integration
> needs HandsOn partner credentials and an actual client implementation (§17).
> `HANDSON_MODE=live` currently 400s.

> **DEMO-ONLY: attendance auto-sends a thank-you email via `EMAIL_MODE=console`.**
> The rendered preview lands in the server log and in the API response
> (`thank_you_emails_sent: N`). `thank_you_email_sent_at` guards against
> resending on a second attendance mark. `EMAIL_MODE=live` throws — real send
> needs Resend credentials + a verified sender domain (§17).

> **DEMO-ONLY: `EMAIL_MODE=console`** returns `demo_code` in the verification
> start response so the demo can read it back without an inbox. Real version
> uses Resend delivery and omits the plaintext code from the API response.

> **DEMO-ONLY: `POST /api/community-posts` has no rate limit.** Real version needs
> `express-rate-limit` (adds to the shared lockfile — flag in the PR).

**`GET /api/articles`** query parameters:

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | integer ≥ 1 | `1` | |
| `limit` | integer 1–50 | `12` | Values above 50 are clamped, not rejected |
| `locale` | `en` \| `zh-Hant` | `en` | |
| `category` | `news` \| `education` \| `report` | — | Omit for all tabs |
| `tag` | string | — | Exact tag match |
| `is_featured` | `"true"` \| `"false"` | — | String, not boolean — `z.coerce.boolean()` reads `"false"` as true |

Response shape (all collections):
```json
{
  "data": [ ...articles ],
  "meta": { "total": 42, "page": 1, "limit": 12 }
}
```

**`GET /api/articles/:slug`** query parameters:

| Param | Type | Default |
|---|---|---|
| `locale` | `en` \| `zh-Hant` | `en` |

Returns a single `{ "data": { ...article } }`. Both an unknown slug and an unpublished
slug resolve to `404` — distinguishing them would let anyone probe for drafts.

**`GET /api/impact`** query parameters:

| Param | Type | Default |
|---|---|---|
| `locale` | `en` \| `zh-Hant` | `en` |

Returns `{ "data": { label, period_start, period_end, families_served, total_sessions, activity_types, yoy_growth_pct, programme_spend_pct, by_programme: { sports, fitness, nutrition, family_support }, narrative } }`.

---

#### Donations + donor tracking

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/donations/checkout` | None | Create a Stripe Checkout Session + `pending` donation |
| `POST` | `/api/webhooks/stripe` | Signature | Stripe events — the only writer of `succeeded` |
| `GET` | `/api/donations/session/:session_id` | None² | Thanks-page poll while the webhook lands |
| `POST` | `/api/donations` | None | **DEMO-ONLY** — succeeded donation with no payment |
| `POST` | `/api/donations/:id/feedback` | None² | Post-payment optional form |
| `GET` | `/api/donors/track/:token` | Bearer token² | The donor tracking page |
| `POST` | `/api/donors/recover-link` | None | "Find my page" — uniform response, **DEMO-ONLY stub** |
| `GET` | `/api/admin/donations` | Admin¹ | Donation table, filter by status |
| `GET` | `/api/admin/donations/stats` | Admin¹ | Dashboard aggregate strip |
| `GET` | `/api/admin/donors` | Admin¹ | Donor directory |
| `GET` | `/api/admin/allocations` | Admin¹ | Allocation list |
| `PATCH` | `/api/admin/allocations/:id` | Admin¹ | Reassign an allocation to another session |
| `POST` | `/api/admin/cron/close-periods` | Admin¹ | Manual trigger for the batching job |
| `POST` | `/api/admin/demo/advance-donation/:id` | Admin¹ | **DEMO-ONLY** — force allocation state |

> ² **Unguessable-identifier auth.** These carry no session — the Stripe session id and the
> donor `access_token` are long random values that *are* the credential. See
> [Why the token is in the URL](#why-the-token-is-in-the-url).

Full mechanics in [Donor tracking — how it works](#donor-tracking--how-it-works) below.

---

### 🚧 Not yet built — our responsibility

These are planned endpoints for the Home + News track. Register each in `routes/index.js`
alphabetically when built.

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/events` | None | Batch article view events (`sendBeacon`) |
| `GET` | `/api/admin/articles` | Admin | List all articles (including drafts) |
| `POST` | `/api/admin/articles` | Admin | Create article |
| `PATCH` | `/api/admin/articles/:id` | Admin | Update article |
| `DELETE` | `/api/admin/articles/:id` | Admin | Delete article |
| `GET` | `/api/admin/impact` | Admin | List all impact periods |
| `POST` | `/api/admin/impact` | Admin | Create impact period |
| `PATCH` | `/api/admin/impact/:id` | Admin | Update impact period |
| `GET` | `/api/admin/insights` | Admin | Per-article views + daily visitors |
| `GET` | `/api/admin/instagram/status` | Admin | Ollama availability + post history |
| `POST` | `/api/admin/instagram/draft-caption` | Admin | AI caption draft via local Ollama |
| `POST` | `/api/admin/instagram/prepare-media` | Admin | Upload + crop to Supabase Storage |
| `POST` | `/api/admin/instagram/publish` | Admin | Publish to Instagram |

> **`POST /api/events` is unauthenticated with no human in the loop** — rate-limit per IP
> and validate `article_id` existence before inserting. See CONTEXT.md §18.10 and §23.

> **`POST /api/admin/instagram/draft-caption`** calls a local Ollama instance. The route
> must probe availability first and return a clear error when Ollama is down — the demo
> cannot depend on a background process nobody started (CONTEXT.md §22).

---

### Routes owned by other tracks

These exist in `CONTEXT.md §14` but are **not this track's responsibility**. Listed here
so there is no accidental overlap.

| Domain | Path prefix | Owner track |
|---|---|---|
| Volunteer | `/api/opportunities`, `/api/volunteer/*`, `/api/admin/postings/*` | BE1 / volunteer track |
| Sessions calendar | `/api/sessions/*` | volunteer track — **but `sessions` the table is created by this branch's migration**, see below |
| HandsOn sync | `/api/admin/handson/sync` | volunteer track |
| Attendance | `/api/admin/sessions/attendance/bulk` | volunteer track — overlaps our demo-advance control |

> **`/api/donations/*`, `/api/donors/*`, `/api/webhooks/stripe`, `/api/campaigns/*` and
> `/api/wishlist/*` used to be listed here as another track's work. They are now built on
> this branch** — see [Donations + donor tracking](#donations--donor-tracking) above.

> **`sessions` is a shared table** (CONTEXT.md §13) and **already exists on live**. This
> branch reads it for donor tracking but does not own its DDL. Its live shape does not match
> what this branch's code queries — see
> [🔴 BLOCKER — `sessions` shape mismatch](#-blocker-for-whoever-merges-this-branch--sessions-shape-mismatch)
> before merging. The `create table` block in `20260803_1055` should be removed or converted
> to `alter … add column if not exists` as part of that reconciliation.

---

## Donor tracking — how it works

The flagship donation feature. A donor pays, gets a private page showing the specific
sessions their gift supports, and receives a batched email when those sessions actually
happen. No account, ever — the tokenised link *is* the identity.

### The end-to-end procedure

```
 ┌── 1. CHECKOUT ─────────────────────────────────────────────────────┐
 │  POST /api/donations/checkout  { amount_hkd, frequency }           │
 │     → Stripe Checkout Session created                              │
 │     → donations row INSERT  status='pending', donor_id=NULL        │
 │     → returns { checkout_url, session_id, donation_id }            │
 │  Browser redirects to Stripe's hosted page. We never see a card.   │
 └────────────────────────────────────────────────────────────────────┘
                                 │  donor pays
                                 ▼
 ┌── 2. WEBHOOK ──────────────────────────────────────────────────────┐
 │  POST /api/webhooks/stripe   checkout.session.completed            │
 │   a. INSERT stripe_events (event_id PK) — duplicate ⇒ 200, stop    │
 │   b. read email off the session, normalise, upsert donors row      │
 │   c. UPDATE donations: donor_id, events_credited,                  │
 │      cost_per_event_at_donation, status='succeeded'                │
 │   d. allocateForDonation()  ← attaches real sessions               │
 └────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
 ┌── 3. ALLOCATION ───────────────────────────────────────────────────┐
 │  n = events_credited                                               │
 │  eligible = sessions WHERE status='scheduled'                      │
 │             AND starts_at IN [donation+7d, donation+30d]           │
 │             ORDER BY starts_at ASC LIMIT n                         │
 │  find-or-open donor_periods row for this gift's calendar window    │
 │  INSERT n × donation_allocations  status='pending'                 │
 │         cost_at_allocation = donation.cost_per_event_at_donation   │
 └────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
 ┌── 4. THE PAGE ─────────────────────────────────────────────────────┐
 │  GET /api/donors/track/:token                                      │
 │  lifetime strip (never resets) + current edition + session list    │
 └────────────────────────────────────────────────────────────────────┘
                                 │  sessions run, admin records attendance
                                 ▼
 ┌── 5. BATCHING (15th / end-of-month) ───────────────────────────────┐
 │  POST /api/admin/cron/close-periods                                │
 │  for each open donor_period past its period_end:                   │
 │     completed = allocations WHERE status='completed'                │
 │                 AND email_sent_at IS NULL                          │
 │     if completed is empty → roll forward, DO NOT email             │
 │     else → send ONE email listing all of them                      │
 │            stamp email_sent_at (starts the 14-day removal clock)   │
 │            close the period                                        │
 └────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
 ┌── 6. REMOVAL (next boundary) ──────────────────────────────────────┐
 │  Track view filters out allocations whose email_sent_at is         │
 │  older than 14 days. Lifetime strip still counts them.             │
 └────────────────────────────────────────────────────────────────────┘
```

### How many sessions a gift buys

`src/lib/donation-credit.js`:

```
events_credited = max(1, ceil(amount_hkd / COST_PER_EVENT_HKD))
```

`COST_PER_EVENT_HKD = 500`. HKD 2,500 → 5 events; HKD 501 → 2 events.

**`ceil`, not `floor`, and this is deliberate.** Under `floor`, a HKD 501 donor is told
their extra dollar bought nothing. The claim we make is *"your gift helped make this
session possible"* — never *"paid for"* — so rounding up is truthful. A refactor to
`Math.floor` or integer division silently changes 2 → 1 and **only
`tests/lib/donation-credit.test.js` would catch it.**

**Uncapped.** HKD 50,000 credits 100 events. The number is the honest one and every
lifetime total derives from it; only the *rendered list* is capped, at
`MAX_EVENTS_SHOWN = 10`.

**The divisor is snapshotted** onto each donation as `cost_per_event_at_donation`. Revising
the constant later must never rewrite what a donor was already told. `creditFor()` accepts an
override precisely so a historical donation can be replayed against its own snapshot.

### Which sessions get picked

A **rolling window**: sessions starting between `donation + 7 days` and `donation + 30 days`,
`status='scheduled'`, ordered by `starts_at` ascending, limited to `events_credited`.

The 7-day floor matters — a session must not run before the donor has had a chance to read
about it. The 30-day ceiling keeps the list to things they can actually anticipate.

If fewer eligible sessions exist than credited, the service inserts what it found and returns
`{ insufficient: true, remaining: N }`. Nothing retries automatically yet (see
[gaps](#demo-only-gaps-in-donor-tracking)).

### Editions and the batching calendar

Session *eligibility* is rolling; email *cadence* is a fixed calendar. These are decoupled
on purpose.

`src/lib/donation-periods.js` maps a donation date to its edition:

| Gift made | Edition sends | Covers |
|---|---|---|
| 1st – 15th | **last day of that month** | 15th → EOM−1 |
| 16th – EOM | **15th of next month** | last month's EOM → 14th |

> **"The 31st" is not a date.** February has 28 or 29; April, June, September and November
> have 30. `lastDayOfMonth()` computes it. A job literally scheduled on the 31st skips five
> months a year.

An edition never reports on a session happening the day it sends — that day rolls into the
next edition, where it is a settled fact.

**Empty editions never send.** A period whose completed allocations are all already emailed
(or which has none) rolls forward untouched. Six lines of "headcount pending" is a worse
email than no email, and a one-time donor only gets two emails total.

### The lifetime strip

Computed on read in `donors.service.buildTrackView()` — never stored as counters, so a
data correction never has to sweep denormalised aggregates.

| Field | Definition |
|---|---|
| `sessions_supported` | `COUNT(DISTINCT session_id)` over `status='completed'` allocations |
| `sessions_on_the_way` | `COUNT(DISTINCT session_id)` over `pending` + `planned` |
| `people_reached` | `SUM(attendance_count)` over those distinct completed sessions |
| `total_given_hkd` | `SUM(amount_hkd)` over `status='succeeded'` donations only |
| `donation_count` | `COUNT` of succeeded donations |
| `donor.supporter_since` | `MIN(created_at)` over succeeded donations |

**`DISTINCT` is load-bearing.** Two of a donor's gifts can land on the same session; counting
rows would inflate the headline number.

**Failed and refunded donations are excluded from every figure.** A refund still counting
toward a lifetime total is a number we would have to defend in front of the judging panel
and lose.

**New-donor case:** a first-timer sees `sessions_supported: 0` alongside
`sessions_on_the_way: 5`. The client renders *"0 supported · 5 on the way"* — zero must not
read as failure at the moment of peak engagement.

**Null attendance counts as 0, not omitted.** A session that ran but whose headcount staff
haven't entered still counts as supported; it contributes 0 to `people_reached` and the
client renders *"ran · headcount pending"*. Never fabricate a number, never show a bare `0`
as if it were fact.

### Track response shape

```jsonc
{ "data": {
  "donor":    { "full_name": "Alex", "supporter_since": "2026-06-01T00:00:00Z" },
  "lifetime": { "sessions_supported": 3, "sessions_on_the_way": 2,
                "people_reached": 34, "total_given_hkd": 2500, "donation_count": 1 },
  "period":   { "id": "...", "period_start": "2026-08-15", "period_end": "2026-08-31",
                "status": "open", "is_current": true,
                "events_credited": 5,     // what the gift bought
                "events_shown": 5,        // capped at MAX_EVENTS_SHOWN
                "events": [ { "kind": "session", "id": "...",
                              "title": "Floor curling",      // resolved to donor.locale
                              "location": "San Po Kong",
                              "starts_at": "2026-08-20T10:00:00Z",
                              "status": "scheduled",         // the SESSION's status
                              "expected_participants": null,
                              "attendance_count": null,      // null ⇒ pending, never 0
                              "photo_url": null } ] },
  "periods":  [ { "id": "...", "label": "15 Aug – 30 Aug", "status": "open" } ]
} }
```

`?period=<uuid>` returns an archived edition instead of the current one.

**There is no `allocations` key, and `events[].status` is the session's own
`scheduled | completed | cancelled`** — not the allocation's internal
`pending | planned | completed`. The allocation table is an implementation detail; the donor
sees events, not bookkeeping.

`title` and `location` collapse `_en` / `_zh` pairs via `lib/locale.resolveLocale()` using
`donor.locale`, falling back to English when a translation is empty.

### Why the token is in the URL

`donors.access_token` is `crypto.randomBytes(32).toString('hex')` — 64 hex chars, generated
once and **stable forever**, so an old email link never breaks.

Putting a bearer credential in a URL is an accepted tradeoff, not an oversight. Mitigations:

- the token is cryptographically random, never a sequential id
- `GET /api/donors/track/:token` sets `X-Robots-Tag: noindex, nofollow`
- there is **no enumeration endpoint** — you cannot list donors or tokens
- an unknown token returns `404`, never `403` — a 403 would confirm the token shape

Anyone the email is forwarded to sees the page, including cumulative giving history. That
is the known cost of "no accounts, ever".

### Data model

| Table | Role |
|---|---|
| `donors` | Keyed on **normalised** email (lowercase + trim). `access_token`, `tracking_opt_in`, `last_completion_email_at`. |
| `donations` | `donor_id` (nullable until the webhook), `amount_hkd`, `events_credited`, `cost_per_event_at_donation`, `stripe_session_id` (unique), `status`, plus the optional feedback columns. |
| `donation_allocations` | The join: `donation_id`, `session_id`, `donor_period_id`, `cost_at_allocation`, `status`, `email_sent_at`. Unique on `(donation_id, session_id)`. |
| `donor_periods` | One edition. `period_start`, `period_end`, `status`, `emailed_at`. Partial unique index enforces **one open period per donor**. |
| `sessions` | The events calendar. Also the public calendar. `attendance_count`, `attendance_source`, `photo_url`. |
| `stripe_events` | Idempotency ledger. `event_id` is the PK. |

> **Email normalisation is not cosmetic.** `Bob@X.com` and `bob@x.com` must resolve to one
> donor or collation silently splits a supporter's history across two tracking pages. Done in
> `lib/normalize.js`, applied on every write path.

### Idempotency

Three independent guards, because Stripe retries on any timeout or non-2xx:

1. **`stripe_events` ledger** — written *before* any handler runs. A duplicate delivery
   short-circuits to `200` without touching donors, donations or email.
2. **`donations.stripe_session_id` unique** — a second insert for the same session fails at
   the DB.
3. **Status check** — an already-`succeeded` donation is never re-credited.

The webhook always returns `200` once the event is recorded, including for unhandled event
types. A non-2xx would make Stripe retry forever.

Allocation runs inside `handleCheckoutCompleted` but wrapped in its own `try/catch` — a query
failure there must not prevent the `200`, or the retry loop never converges.

### The state machine

```
allocation:  pending ──► planned ──► completed
                 └──► cancelled (session cancelled)

session:     scheduled ──► completed
                  └──► cancelled
```

`POST /api/admin/demo/advance-donation/:id` with `{ "to": "planned" | "completed" }` forces
every allocation on a donation. **DEMO-ONLY** — it exists so a 10-minute stage demo can reach
the completed state without waiting two weeks.

> **Overlaps `POST /api/admin/sessions/attendance/bulk`** (volunteer track). Both mark things
> completed. Theirs is the real path — session-driven, with genuine attendance. Coordinate
> before either is wired into the demo script.

### Running it locally

```bash
# 1. Apply the migrations (announce first — an ALTER mid-rehearsal breaks a teammate)
#    supabase/migrations/20260803_1055_sessions_and_allocations.sql
#    supabase/migrations/20260803_1060_donations_drop_programme.sql   ← needs sign-off

# 2. Seed ~40 demo sessions across days +2 to +30
npm run seed

# 3. Stripe listener — copy the whsec_ it prints into server/.env
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 4. Boot
npm run dev
```

> **`STRIPE_WEBHOOK_SECRET` is regenerated by every `stripe listen` session.** Forget to
> re-paste it and the webhook 500s, the donation stays `pending` forever, and nothing
> allocates. This is the single most common way the demo breaks.

Watch the batch email land in the server terminal (`EMAIL_MODE=log`) after
`POST /api/admin/cron/close-periods`.

### Items from the team's PLAN.md / HANDOFF.md not carried into this branch

Audited 2026-08-02 against the donate-track PLAN.md and the outgoing teammate's HANDOFF.md.
These were specified there and are **not** in this branch. Listed so they are decisions rather
than oversights.

| # | Specified in | What's missing | Severity |
|---|---|---|---|
| 1 | PLAN §3 A5 | **`GET /api/donations/session/:session_id` does not return `tracking_token`.** PLAN: *"`tracking_token` present only once `succeeded` **and** `tracking_opt_in`."* The route's own comment claims it does; the response body omits it. **The thanks page therefore has no way to link a donor to their tracking page** — the token exists in `donors` the moment the webhook fires, but nothing exposes it. | 🔴 demo-blocking |
| 2 | HANDOFF | **`content_events` has no `service_role` DML grants** — verified: only `REFERENCES, TRIGGER, TRUNCATE`. Any repo touching it 500s. The handoff called this out explicitly and it was never applied. `donations` and `donors` *are* correctly granted. | 🔴 breaks §23 analytics |
| 3 | PLAN §4 | ~~**Stale `20260801_1050_donations.sql` was not deleted.**~~ **Resolved** — deleted. It declared `donations.programme NOT NULL` and `donor_id NOT NULL`, both contradicted by live. See the migrations table below for the `create table` gap this leaves. | ✅ resolved |
| 4 | PLAN §7 | **Envelope drift in wishlist/campaigns/admin not flagged in the PR.** Six sites bypass `envelope()`: `wishlist.routes.js:13,23`, `campaigns.routes.js:40,47`, `admin.routes.js:23,32` — raw `{items, meta}` and hand-rolled `response.status(404).json(...)`. PLAN deliberately did *not* rewrite them (another track's working code) but required the drift be flagged with the one-line fix offered as follow-up. | 🟡 contract drift |
| 5 | PLAN §2 | **The whole Stripe mock-gateway design is absent.** No `src/lib/stripe/{mock,live}.driver.js`, no `STRIPE_MODE` env var (absent from `.env.example` and all code), no `/api/mock/stripe/checkout/:id` pages. This branch calls the real Stripe SDK, so a demo needs live `stripe listen` — which is exactly the per-session `STRIPE_WEBHOOK_SECRET` footgun the mock was designed to remove. | 🟠 demo fragility |
| 6 | HANDOFF + PLAN §Phase B | **No demo-donor seed.** Both documents asked for donors at three lifecycle points — gave yesterday (all upcoming), mid-window (mixed), edition closed (all completed) — so three tracking pages show three states without pressing a force button. `db/seed/sessions.seed.js` seeds sessions only. | 🟠 weakens the demo |
| 7 | PLAN §3 A1 | Checkout minimum is **`amount_hkd ≥ 4`**; PLAN specifies **≥ 10**. `4` is Stripe's floor, `10` was the product choice. Trivial to change, worth a deliberate decision. | 🟢 minor |
| 8 | PLAN §Phase B | **Cancelled sessions are not substituted.** PLAN's credit model re-runs a display query, so a cancelled session drops out and the next one slides up *for free*. This branch **stores** allocations, so a cancelled session just sits in the donor's list until someone `PATCH`es it. The "swap is silent, no reassignment job needed" property was a stated payoff of the model this branch diverged from. | 🟠 behavioural divergence |

Items 1, 2 and 3 are small and self-contained. Items 5, 6 and 8 are design-level and follow
from this branch keeping `donation_allocations` where PLAN.md had deleted it — see the
reconciliation note in the branch's plan artefact.

### DEMO-ONLY gaps in donor tracking

| What is faked / missing | Real version needs |
|---|---|
| Seeded `[demo]`-prefixed sessions | Staff-authored sessions via `/admin/postings` |
| `POST /api/donors/recover-link` returns `{sent:true}`, sends nothing | Resend + a sliding-window rate limiter |
| `EMAIL_MODE=log` prints to stdout | DNS verification on `love21foundation.com` (§17) |
| Batching runs only on manual trigger | A real scheduler (`node-cron` or platform cron) |
| No retry for `insufficient` allocations | Nightly job re-running `allocateForDonation` |
| No admin auth on `/api/admin/*` | `requireRole('admin')` from backend-dev |
| `advance-donation` forces state | Deletion before any real deployment |
| `sessions.expected_participants` always `null` | The column, plus admin entry at scheduling |
| Only `sessions` are allocatable | Union with `volunteer_opportunities` |

### Where the code lives

```
src/lib/donation-credit.js            the ceil formula + COST_PER_EVENT_HKD
src/lib/donation-periods.js           fixed-calendar edition maths, editionLabel
src/lib/email.js                      EMAIL_MODE=log|send wrapper
src/lib/stripe.js                     Stripe client + signature verification
src/services/donations/
  checkout.service.js                 Checkout Session + pending donation
  webhook.service.js                  event dispatch, idempotency, credit snapshot
  allocation.service.js               the rolling-window selection algorithm
  period-close.service.js             batching, email, email_sent_at stamping
src/services/donors.service.js        upsertDonor + buildTrackView (the strip)
src/data/{donations,donors,allocations,donor-periods,sessions}.repo.js
tests/services/donations/             allocation, webhook, checkout, period-close
tests/services/donors.service.test.js buildTrackView guarantees
tests/lib/donation-credit.test.js     the ceil table — the tripwire
```

---

## Error envelope

All errors follow `{ error, message, code }` — `data:` is **never** present on error
responses. Throw `ApiError` and let `middleware/error-handler.js` format it:

```js
const { ApiError } = require("../lib/api-error");

// In a route or service:
throw ApiError.notFound("No article with that slug");
throw ApiError.badRequest("Validation failed");
throw new ApiError(409, "Slug already taken");
```

Error codes (the `code` field clients branch on):

| Status | `code` |
|---|---|
| 400 | `VALIDATION_FAILED` |
| 401 | `UNAUTHENTICATED` |
| 403 | `FORBIDDEN` |
| 404 | `NOT_FOUND` |
| 409 | `CONFLICT` |
| 429 | `RATE_LIMITED` |
| 500 | `INTERNAL` |

`message` is omitted in `NODE_ENV=production`. Keep `NODE_ENV=development` locally.

---

## Rate limiting

`middleware/rate-limit.js` is a fixed-window limiter held in the process's own memory. It was a
no-op stub until recently — three routes mounted it and looked protected while being wide open.

Mount it with a budget:

```js
const rateLimit = require("../middleware/rate-limit");

router.post("/thing", rateLimit({ key: "thing", limit: 10 }), handler);
```

Each call to `rateLimit()` closes over its **own** `Map`, so routes cannot throttle or evict one
another, and a test gets a clean store just by building new middleware.

### Current budgets

All windows are 15 minutes.

| Route | Limit | Keyed on | Why |
|---|---|---|---|
| `GET /api/donations/referral-status` | 30 | IP | Unauthenticated, so it can be used to test whether an address is a known donor. The donate form calls it from a debounced `onChange`, so one honest donor makes a handful — 30 still makes enumeration useless. |
| `POST /api/email-verifications` | 5 per address **+** 10 per IP | address, IP | Sends real mail. Capping IP alone still lets a spread of hosts bury one person's inbox; capping the address alone punishes a shared office NAT. Two limiters, two budgets. |
| `POST /api/opportunities/:id/interest` | 10 | IP | Unauthenticated write. |

`MAX_ATTEMPTS` in `email-verification.service.js` is **not** related — it caps guesses against an
existing code, not how many codes we send.

### Limiting on more than one axis

`identify(request)` may return several identities. The request is refused when **any** of them is
exhausted, and every one is charged only if the request is allowed through:

```js
rateLimit({
  key: "email-verification-address",
  limit: 5,
  identify: (request) =>
    typeof request.body?.email === "string" ? request.body.email.trim() : null,
});
```

`identify` runs **before** `validate()`, so `request.body` is parsed but not yet trusted — check
types rather than assuming a string is there. Returning nothing lets the request through: an
unidentifiable caller fails open rather than blocking the route for everyone.

### What a refusal looks like

Standard §29 envelope, plus a `Retry-After` header in whole seconds:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 871

{"error":"Too Many Requests","code":"RATE_LIMITED","message":"Too many requests. Try again in 871s."}
```

### `TRUST_PROXY` — read this before deploying

The limiters key on `request.ip`, and what that means depends on this setting. **Both directions
fail badly**, so it is not a detail to leave to chance:

| Situation | Result |
|---|---|
| Unset, behind a reverse proxy | Every visitor collapses into the proxy's single IP and they throttle each other. The 31st honest donor in the window gets a 429. |
| Set, but reachable directly | `X-Forwarded-For` is caller-supplied, so anyone can forge a fresh bucket per request and skip the limits entirely. |

Set `TRUST_PROXY=1` for a single proxy hop; leave it empty when the server is directly reachable.
It defaults to empty, which is what this app has always done.

### Demo day

The limits are a **rate over a fixed 15-minute window, not a concurrency cap** — spreading requests
out does not help unless they cross the window boundary. At a venue everyone is usually behind one
NAT, so the server sees a single IP for a whole room and they share one budget. That works out to
**10 volunteer actions between all of them** per 15 minutes.

Only one question decides what to set: *do the audience's browsers hit the server directly?*

| Situation | Set | Why |
|---|---|---|
| You drive the demo yourself | **nothing** | One client. The budgets are unreachable. |
| Audience browses on their own devices | `RATE_LIMIT_DISABLED=true` | They share a NAT IP, and 10 actions between them is too tight to gamble a demo on. |
| Deployed behind your own reverse proxy, limits kept on | `TRUST_PROXY=1` | Otherwise every visitor collapses into the proxy's IP. |

**`TRUST_PROXY` does not solve the shared-audience problem.** It recovers the real client IP from
behind *your* proxy — but if a room genuinely shares one NAT address, that *is* their real IP and
they still share a bucket. Only `RATE_LIMIT_DISABLED` removes that.

The donation flow is safe either way: `referral-status` fails open, so even a 429 leaves the form
working and the gift going through. It is the volunteer routes that stop.

Both variables need a **restart**. `RATE_LIMIT_DISABLED` is read per request, but `process.env` is
only populated at boot, so editing `server/.env` mid-run changes nothing until the server bounces.
`TRUST_PROXY` is read once at startup.

Verify the flag is actually doing something — with it set, this should be 15 × `201` rather than
`201` ×10 then `429`:

```bash
for i in $(seq 1 15); do
  curl -s -o /dev/null -w "%{http_code} " \
    -X POST http://localhost:3000/api/email-verifications \
    -H "Content-Type: application/json" -d "{\"email\":\"probe$i@example.com\"}"
done
```

If a 429 shows up mid-demo, that one line in `server/.env` plus a restart is the whole fix. No data
is affected and nothing else needs reverting.

### Known limits

Both deliberate, and both worth fixing before this faces real traffic:

- **Per process.** Counters reset on restart and do not coordinate across instances — a second
  instance doubles every limit. A shared store (Postgres or Redis) is the fix.
- **In-memory only.** Bucket count is capped at `MAX_TRACKED_KEYS` (10,000) with expired entries
  swept on an interval, so a spray of distinct identities cannot grow the Map without bound.

`RATE_LIMIT_DISABLED=true` bypasses every limiter. It exists so a demo cannot be interrupted by
its own throttling — never set it anywhere the public can reach.

---

## Migrations

Two separate SQL homes — both are correct, neither supersedes the other:

| Directory | Convention | Applied to live? |
|---|---|---|
| `supabase/migrations/` | Supabase CLI prefixes | **No** — apply manually in SQL editor |
| `src/schema/` | Domain-numbered | **Yes** — volunteer tables are live |

Apply content migrations one at a time and announce before running — an `ALTER` mid-rehearsal breaks teammates.

### Donation-track migrations on this branch

| File | Contents | Destructive? |
|---|---|---|
| `20260802_1050_donations_stripe.sql` | Stripe columns, `events_credited`, `stripe_events` | No |
| `20260803_1055_sessions_and_allocations.sql` | `sessions`, `donation_allocations`, `email_sent_at`, **service_role grants** | No |
| `20260803_1060_donations_drop_programme.sql` | `drop column donations.programme` | **YES — needs sign-off** |
| `20260803_1065_grant_service_role_content_events.sql` | `service_role` DML on `content_events` + `sessions` | No — grants only |

> **`donors` and `donations` have no `create table` in this repo.** `20260801_1050_donations.sql`
> held them and was deleted (PLAN §4) because it contradicted the live schema and was never
> applied — it declared `donations.programme NOT NULL` and `donor_id NOT NULL`, where live has
> no `programme` column and a nullable `donor_id`. Both tables exist on the live project; treat
> the live schema as the source of truth. Rebuilding from an empty project needs them dumped
> from live first — a known, accepted gap, not an oversight.

> **`service_role` grants are not optional.** A table created through `apply_migration` lands
> without DML grants. Enabling RLS blocks anon; without the explicit
> `grant select, insert, update, delete … to service_role` the server's own writes fail with
> `42501 permission denied`. `20260803_1055` includes them for both tables it creates — any
> future donation-track migration must do the same.

---

## 🔴 BLOCKER FOR WHOEVER MERGES THIS BRANCH — `sessions` shape mismatch

**Verified against the live project on 2026-08-02. This is not speculative.**

`public.sessions` **already exists on live** and its shape does **not** match what this
branch's code queries. `20260803_1055_sessions_and_allocations.sql` uses
`create table if not exists`, so applying it will **silently no-op** and leave the mismatch
in place. Every donor-tracking read will then fail with **PostgREST `42703` undefined column**.

`sessions` is a **shared** table (CONTEXT.md §13). Reconciling it is a cross-track decision,
not a unilateral one — which is why this branch flags it rather than rewriting the table.

### The diff

| Column | Live | This branch's code expects |
|---|---|---|
| `location` | ✅ single `text` | ❌ queries `location_en` + `location_zh` |
| `description_en` / `description_zh` | ✅ present | not referenced |
| `note_en` / `note_zh` | ❌ absent | ❌ queried in two selects |
| `completed_at` | ❌ absent | ❌ queried in two selects |
| `expected_participants` | ❌ absent | read defensively (`?? null`) — safe |
| `capacity` | ✅ present | closest live analog to `expected_participants` |
| `ends_at` | `NOT NULL` | seed supplies it — safe |
| `programme`, `title_en/zh`, `starts_at`, `attendance_count`, `attendance_source`, `photo_url`, `estimated_cost_hkd`, `status` | ✅ | ✅ match |

**Live `sessions` currently holds 0 rows**, so a corrective `ALTER` is cheap right now.

### Exactly what needs changing

| File | Line(s) | Change |
|---|---|---|
| `src/data/sessions.repo.js` | 6 (`ELIGIBLE_COLUMNS`) | `location_en, location_zh` → `location` |
| `src/data/sessions.repo.js` | 41 (`findById`), 61 (`listByIds`) | same, **plus drop** `note_en, note_zh, completed_at` |
| `src/services/donors.service.js` | `toEvent()` | `resolveLocale(session, ["title","location"], …)` → resolve `title` only; pass `location` straight through |
| `db/seed/sessions.seed.js` | 54–55 | `location_en` / `location_zh` → single `location` |
| `tests/services/donors.service.test.js` | 202, 205, 232, 266 | fixture rows use `location_en`/`location_zh` — update to `location` |
| `20260803_1055_…sql` | `create table sessions` block | Remove it, or convert to `alter table … add column if not exists`. **The table is shared and already live — this branch should not own its DDL.** |

Two ways to resolve — pick one **with the volunteer track**, do not guess:

- **Adopt live's shape** (recommended — smallest diff, no shared-table DDL): change the six
  code sites above. Accept a single `location` string; bilingual location is lost, which
  matters for §24's bilingual bar and should be raised explicitly if it's a requirement.
- **Migrate live to bilingual**: `alter table sessions add column location_en text,
  add column location_zh text`, backfill from `location`, then drop it. Touches a shared
  table, so it needs the volunteer track's sign-off and an announcement.

### Second blocker on the same table

`sessions` has **no DML grants for `service_role`** — verified via
`information_schema.role_table_grants`, which returns only `REFERENCES`, `TRIGGER` and
`TRUNCATE`. There is no `SELECT`, `INSERT`, `UPDATE` or `DELETE`. Even a corrected column
list will fail with `42501 permission denied` until this runs:

```sql
grant select, insert, update, delete on public.sessions to service_role;
```

`20260803_1055` already carries this statement — but because the `create table if not exists`
above it no-ops, confirm the grant actually applied rather than assuming.

### Quick verification

```sql
-- expect: location (not location_en/location_zh); no note_en/note_zh/completed_at
select column_name, data_type from information_schema.columns
 where table_schema='public' and table_name='sessions' order by ordinal_position;

-- expect SELECT/INSERT/UPDATE/DELETE for service_role — currently missing
select grantee, privilege_type from information_schema.role_table_grants
 where table_schema='public' and table_name='sessions' and grantee='service_role';
```

`donation_allocations` does **not** exist on live yet (`to_regclass` returns null), so that
half of `20260803_1055` will create cleanly and its grants will apply normally.

---

> **Live-vs-migration drift on `donations` — RESOLVED, verified 2026-08-02.** An earlier
> revision of this file warned that `stripe_session_id` might be missing from the live table.
> It is **not** missing. Queried `information_schema.columns` directly: live `donations` has
> `stripe_session_id`, `stripe_payment_intent`, `events_credited`,
> `cost_per_event_at_donation`, `tracking_opt_in`, `is_anonymous`, `message`,
> `referral_source` and `referral_source_other`. `20260802_1050_donations_stripe.sql` was
> applied. No action needed.

> **`donations.programme` is already dropped on live** — also verified 2026-08-02, the column
> is absent. `20260803_1060_donations_drop_programme.sql` is therefore a **no-op** (it uses
> `drop column if exists`). Note the original safety argument is now stale: `donations` holds
> **3 rows**, not 0. The drop already happened while the table was empty, so nothing was lost —
> but do not reuse that "safe because empty" reasoning for any future destructive migration
> without re-checking the row count.
