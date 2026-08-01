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
| Donations + Stripe | `/api/donations/*`, `/api/donors/*`, `/api/webhooks/stripe` | BE2 / donate track |
| Campaigns | `/api/campaigns/*` | donate track |
| Sessions calendar | `/api/sessions/*` | volunteer track |
| Wishlist | `/api/wishlist/*` | donate track |
| HandsOn sync | `/api/admin/handson/sync` | volunteer track |
| Demo controls | `/api/admin/demo/*` | shared |

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

## Migrations

Two separate SQL homes — both are correct, neither supersedes the other:

| Directory | Convention | Applied to live? |
|---|---|---|
| `supabase/migrations/` | Supabase CLI prefixes | **No** — apply manually in SQL editor |
| `src/schema/` | Domain-numbered | **Yes** — volunteer tables are live |

Apply content migrations one at a time and announce before running — an `ALTER` mid-rehearsal breaks teammates.
