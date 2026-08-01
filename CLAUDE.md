# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Love 21 Foundation website rebuild. Background, challenge statement, and org facts:
[CONTEXT.md](CONTEXT.md). Part I is sourced fact; Parts II–III are team build decisions.

Stack: React 19 + Vite 8 (`client/`, **ESM**, plain JSX — no TypeScript), Express 5 on Node
(`server/`, **CommonJS** — `require`, not `import`). Supabase (Postgres + Auth) behind the
Express API; the browser only imports `supabase-js` for Auth (to obtain the JWT).

## Commands

Two independent workspaces, each with its own `package.json` and `node_modules`. No root
package manager — install and run per workspace.

```bash
# server — port 3000
cd server && npm install
cd server && npm run dev       # node --watch index.js
cd server && npm start         # node index.js
cd server && npm test          # BOTH trees — unit + live-DB schema (~11s, writes to Supabase)
cd server && npm run test:schema                       # the live-DB tree alone
cd server && node --test tests/                        # the offline unit tree alone
cd server && npm run test:coverage
cd server && node --test tests/lib/slug.test.js        # a single file
cd server && node --test --test-name-pattern "slug"    # a single test by name
cd server && npm run seed                              # upsert-only seed (articles, impact, community posts)

# client — port 5173, proxies /api → localhost:3000
cd client && npm install
cd client && npm run dev       # vite
cd client && npm run build     # vite build
cd client && npm run lint      # oxlint (NOT eslint) — react/rules-of-hooks at error
cd client && npm run preview   # vite preview
```

The server test runner is Node's built-in `node:test` — **no Vitest, no Jest, no framework
dependency.** Since the volunteer merge there are **two test trees, and the singular/plural
is not a typo**:

| Tree | What it is | Needs a database |
|---|---|---|
| `server/tests/` | Unit tests, mirroring `src/` (`tests/lib/slug.test.js` ↔ `src/lib/slug.js`) | No — repos are stubbed with `mock.method()` |
| `server/test/schema/` | Volunteer-track SQL contract tests, CRUD against real tables | **Yes — the live shared project** |

`npm test` is bare `node --test`, which discovers **both**. So running it:

- **writes rows to the shared Supabase project** using the service-role key, taking `.env` via
  `test/schema/_helpers.js`. It cleans up after itself, but it is not a local sandbox — do not
  run it while someone is rehearsing the demo.
- **skips the schema tree cleanly** when `SUPABASE_SERVICE_ROLE_KEY` is absent, with a stated
  reason rather than a wall of empty-result failures. A pass on a machine with no `.env` has
  only exercised the unit tree.
- **drops `--test-concurrency=1`**, which `test:schema` sets deliberately. The suites pass
  today, but they share tables, so a future flake here is a concurrency artefact and not a
  real failure. Fixing it means putting the flag on `test`, not chasing the assertion.

Unit tests are **not colocated** — a test reaches back through `../../src/`, so check the
depth when adding one under `tests/services/content/`. The client has **no test tooling at
all**, and no `lint` script exists on the server. Adding either is a shared-file change —
flag it in the PR body (§25).

### Env

`server/.env` (copy from `server/.env.example`) — `HOST`, `PORT`, `CLIENT_ORIGIN`,
`NODE_ENV`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SERVER_SECRET`, `STRIPE_SECRET_KEY`,
`STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `HANDSON_MODE`, `HANDSON_BASE_URL`,
`HANDSON_API_KEY`. The server holds the **service-role** key, not the anon key.

`NODE_ENV=production` suppresses `message` on **every** error, 4xx included — `code` is what
survives, which is the whole reason it exists. Keep it `development` locally or every error
goes blind. **Open question:** forms need to display 4xx detail, so either the client maps
`code` to its own copy, or the handler stops suppressing 4xx. Decide before deploy; it does
not bite locally ([§29](CONTEXT.md#29-api-contract)).

`client/.env.local` (copy from `client/.env.example`) — `VITE_API_BASE_URL`, `VITE_API_MODE`,
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Every `VITE_`-prefixed variable compiles into
the **public bundle**; the anon key is designed to be public, a service-role key or Stripe
secret is not. Add each new variable to the matching `.env.example` in the PR that first
reads it.

### Local Stripe webhooks

`stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## What actually exists — check before assuming

Setup is done and both workspaces run. But **most of CONTEXT.md Part II is the target, not
the codebase.**

**Client — still the stock Vite starter.** `App.jsx` renders a counter, `main.jsx` mounts it
directly and does not route anywhere, `pages/HomePage.jsx` is a 7-line `<div>HomePage</div>`
stub nothing imports, and `Navbar.jsx`, `PageNotFound.jsx`, `news/Articles.jsx` are literally
empty files. Only `react` and `react-dom` are installed — react-router, TanStack Query,
i18next, supabase-js and react-markdown are not.

**Server — routing skeleton, a tested utility layer, validation middleware, the content API,
and (since the volunteer merge) the volunteer SQL schema.** `GET /`, `GET /api`,
`GET /api/health`, `GET /api/health/supabase`, a 404 and an error handler. Built and tested:

- `src/lib/` — `ApiError` + `codeForStatus`/`labelForStatus`, `envelope(data, meta)`,
  `resolveLocale(row, fields, locale)`,
  `parsePaging`/`buildMeta`, `readingTime(blocks)`, `slugify`/`uniqueSlug`,
  `visitorHash(ip, userAgent, day)`.
- `src/schemas/` — Zod (`zod` v4, CommonJS `require`): `blocks.schema.js` (the block union),
  `article.schema.js`, `community-post.schema.js`, `query.schema.js`.
- `src/middleware/validate.js` — Zod middleware; parsed output lands on
  `request.validatedQuery` / `request.validatedParams` / `request.body`.
- `src/data/articles.repo.js`, `src/data/impact.repo.js` — Supabase data access.
- `src/services/content/articles.service.js`, `src/services/content/impact.service.js`.
- `GET /api/articles`, `GET /api/articles/:slug`, `GET /api/impact` — all live and tested.
- `server/db/seed/` — articles, impact, community-posts; `npm run seed` is safe to re-run
  (upserts only, never truncates).
- `server/src/schema/` — the volunteer track's SQL: `volunteers`, `volunteer_opportunities`,
  `volunteer_signups`, `volunteer_interests`, `badges`, `volunteer_badges`,
  `volunteer_email_verifications`. **Applied to the live project**, and covered by
  `server/test/schema/`.

### Two SQL homes — know which one you are in

The merge left the repo with **two directories of schema SQL, in different conventions, and
neither is wrong**:

| | `server/supabase/migrations/` | `server/src/schema/` |
|---|---|---|
| Convention | Supabase CLI, `YYYYMMDD_HHMM` prefixes | Domain-numbered, `00_shared` / `10_volunteers` |
| Owns | articles, community_posts, impact_periods, media bucket | the seven volunteer tables |
| Applied to live? | **No** | **Yes** |

`public.set_updated_at()` is defined in **both** (`_1000_common.sql` and
`00_shared/00_set_updated_at.sql`). That is survivable only because both use
`create or replace` **and both pin `set search_path = ''`** — drop the pin from either and
whichever runs last silently un-hardens the function for every table that triggers off it.
Check both files when touching it.

**The content migrations are still NOT applied.** They are additive and touch nobody else's
tables. Apply them in the SQL editor, and announce it first: an `alter` while someone is
rehearsing breaks them mid-run.

Two things are **deliberately absent** from those files. `profiles` is contested — BE1 owns
identity in §30 — and two `create table profiles` files is a SQL conflict git merges cleanly
and silently, so claim it before writing it. Consequently `community_posts.moderated_by` is a
plain `uuid` with the foreign key left as a commented-out `alter table` in the file.
`content_events` belongs to the later view-tracking step.

**Still not built, despite being described in CONTEXT.md:** `apiClient` and the mock/real
seam, router, providers, i18n and locale files, design tokens, layouts, auth middleware,
rate limiting, pino, and any client-side test tooling.

[CONTEXT.md §28](CONTEXT.md#28-repository-layout-and-setup-state) is the full inventory and
the tiebreaker: **where another section describes something as built and §28 does not list
it, §28 is right.** Read a file before writing code that depends on it.

## Server coding patterns

### 3-layer structure

Every domain follows `routes/<name>.routes.js` → `services/<domain>/<name>.service.js` →
`data/<name>.repo.js`. Routes are registered in `routes/index.js` — **add new entries
alphabetically** to minimise merge conflicts when multiple tracks land at once.

```
routes/articles.routes.js        # thin: validate → service → envelope → json
services/content/articles.service.js  # all business rules
data/articles.repo.js            # Supabase queries only, no rules
```

### Supabase queries

Every repo call destructures `{ data, error }` and immediately calls `assertOk(error)` from
`src/data/supabase-error.js`. Never throw manually on a DB error — `assertOk` converts any
PostgREST error into an `ApiError(500, ...)` that the error handler formats correctly.

Repos use **explicit column lists** (named constants `LIST_COLUMNS` / `DETAIL_COLUMNS`) —
never `select('*')`. List queries omit `body_en` / `body_zh`; detail queries include them.

### Bilingual columns

The DB stores `<field>_en` and `<field>_zh` (e.g. `title_en`, `title_zh`). The suffix in
the DB is always `_zh`, not `_zh_Hant`. `resolveLocale(row, ['title', 'excerpt'], locale)`
collapses both suffixes into plain `title`, `excerpt` on the returned object, falling back
to English when the `_zh` value is null or empty — it never mutates the row.

### Article categories

`articles.category` is `'news' | 'education' | 'report'` only. **Voices are not an article
category** — they live in `community_posts` (with the moderation state the tab needs).

### Zod v4 specifics

`require("zod")` on this project gives Zod v4 (`"zod": "^4.4.3"`). Use `z.strictObject`
for request bodies and `z.object` for query schemas. Validation errors carry `.issues[]`,
not `.errors[]` — `validate.js` checks `Array.isArray(error?.issues)`.

### Service test pattern

Use Node's built-in `mock.method()` to stub the repo, always restoring in `t.after`:

```js
const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const articlesRepo = require("../../../src/data/articles.repo");
const { listArticles } = require("../../../src/services/content/articles.service");

test("description", async (t) => {
  mock.method(articlesRepo, "listPublished", async () => ({ rows: [], total: 0 }));
  t.after(() => mock.restoreAll());
  // ...assert
});
```

## Architecture — the parts a single file can't show

- **Frontend never queries Supabase directly.** Every read/write goes through the Express
  API. The browser uses `supabase-js` **for Auth only** — to obtain a JWT it sends as
  `Authorization: Bearer <jwt>`. The server holds the service-role key. RLS is defence in
  depth ([§9](CONTEXT.md#9-stack-and-team-split), [§11](CONTEXT.md#11-backend-architecture)).
- **The mock/real seam is `lib/apiClient`.** Frontend features import from it; fixtures live
  behind one env flag; cutover is a config change, not a refactor. It does not exist yet, and
  until it does every FE track is either blocked or writing throwaway `fetch` calls
  ([§12](CONTEXT.md#12-frontend-architecture)).
- **`HANDSON_MODE=mock|live`** is the second seam. `mock` returns seeded data in the shape
  HandsOn's API would take; `live` is unimplemented. External volunteer hours therefore
  **only appear** to count toward badges — never claim otherwise to a judge
  ([§17](CONTEXT.md#17-integration-setup-notes)).
- **Response envelope: the resource under `data`.** Collections are `{ data: [...], meta }`
  where `meta` comes from `buildMeta` and sits *beside* `data`, never inside it. Build it
  with `envelope(data, meta)` from `lib/envelope`, **in the route layer only** — services
  return domain results (`listArticles` still returns `{ items, meta }`) so their tests never
  assert on transport. `/api/health` and `/api/` stay unwrapped: they are probes, not
  resources. Errors are `{ error, message, code }` — and **never** a `data: null` alongside,
  because success and failure are told apart by which key is present. `error` is the
  `node:http` status label; `code` is the machine-readable field, derived from the status by
  `codeForStatus` unless passed explicitly. Throw `ApiError` from `lib/api-error`
  (`ApiError.notFound(msg)`, `ApiError.badRequest(msg)`, or `new ApiError(500, msg)`) and let
  `middleware/error-handler.js` format it — never `response.status(...).json(...)` in a
  route or in `not-found.js`, which is how the envelope drifts. Money is `amount_hkd` integer
  dollars; the ×100 to Stripe cents lives server-side and never crosses this API
  ([§29](CONTEXT.md#29-api-contract)).
- **Validation asymmetry, on purpose.** Request **bodies** are `z.strictObject` — an unknown
  key is a 400, because silently stripping it means a save that looks like it worked and
  quietly lost a field. Request **queries** (`listQuerySchema`) strip undeclared keys
  instead, because link-sharing and client libraries append parameters we never declared and
  a 400 for an unknown query key is a baffling failure. That leniency is about *unknown* keys
  and the `limit` ceiling only — a declared key with a bad value still 400s (`?locale=fr`
  fails, and the enum is exactly `en` / `zh-Hant`, so `?locale=zh` is a 400 too).
  Server-derived fields (`slug`,
  `status`, `reading_time_minutes`, `published_at`) are **absent from the create schema**, so
  a client that sends one gets a 400 rather than having its value ignored.
- **Article bodies are JSONB block arrays** (`paragraph`, `heading`, `image`, `quote`,
  `stat`, `mythFact`, `embed`), not markdown or HTML strings. `paragraph` text goes through
  `react-markdown` with raw HTML disabled. **No `dangerouslySetInnerHTML`, ever.**
  `image.alt` is required by the schema ([§21](CONTEXT.md#21-news-page)).
- **Donor tracking (§15).** `donors` keys on **normalised (lowercased, trimmed) email** —
  fail to normalise and collation silently splits one supporter into many. Allocation runs
  per donation; display and email aggregate per `donor_period`. `cost_at_allocation` is
  **snapshotted**, never recomputed. The lifetime strip uses `COUNT(DISTINCT session_id)`
  over completed allocations. Recovery form must return an **identical response** for known
  and unknown addresses (privacy property, not a feature).

### Reads like a bug, is deliberate — do not "fix" these

- **The Voices honeypot is accepted, not rejected.** `website` is a valid optional field in
  `createCommunityPostSchema`; when filled, the service returns the same `201` and writes no
  row. Rejecting it with a 400 would tell a bot exactly which field caught it.
- **A changed title never re-derives the slug.** Renaming an article must not move its public
  URL, so `slug` is editable only through `updateArticleSchema`, as a deliberate act.
- **`?limit=` is clamped at the top but rejected at the bottom.** `?limit=100` returns 50
  rows, because that value arrives from a shared link the visitor merely clicked and an
  error they cannot act on is worse than fewer rows; `meta.limit` reports what was actually
  applied, so no warning is needed and **no `console.log` belongs here**. `?limit=0` asks for
  nothing and is a real bug, so it 400s. Both `listQuerySchema` and `parsePaging` clamp —
  keep them agreeing.
- **An empty `zh-Hant` translation falls back to English.** Rendering a blank heading is the
  dishonest option; `resolveLocale` returns a new object and never mutates the row.
- **`SERVER_SECRET` throws lazily, at hash time, not at boot.** A missing secret must not
  stop a teammate's server from starting when they pull.

### Two constraints to get right rather than discover late

- **`express.json()` is global in `app.js`.** A Stripe webhook route needs `express.raw()`
  mounted *above* it in the same PR, or signature verification fails on a valid signature
  ([§17](CONTEXT.md#17-integration-setup-notes)).
- **CORS is hand-rolled in `app.js`, not the `cors` package.** One origin, from
  `CLIENT_ORIGIN` (default `http://localhost:5173`), with `OPTIONS` short-circuited to 204
  and **no `Access-Control-Allow-Credentials`** — auth rides the `Authorization` header, not
  cookies, so adding a cookie-based flow means editing this block. A second deployed origin
  needs the header made conditional; do not just append to the string.
- **Role never settable through signup.** `role` in `profiles` is server-side only;
  `requireRole('admin')` enforced server-side. `AdminLayout` guards are UX, not security
  ([§9](CONTEXT.md#9-stack-and-team-split), [§12](CONTEXT.md#12-frontend-architecture)).

Adding a dependency is a shared-file change for six people — say so in the PR body.

## Toolchain quirks

- **CommonJS server, ESM client.** `require`/`module.exports` under `server/`;
  `import`/`export` under `client/`. The ECC packs show ESM throughout; on the server, read
  their examples as `require`.
- **React Compiler is on.** Do **not** hand-add `useMemo` / `useCallback` — the compiler
  handles memoisation. See `client/vite.config.js`.
- **Linter is `oxlint`, not ESLint**, configured in `client/.oxlintrc.json` with
  `react/rules-of-hooks` at error. No lint script on the server.
- **No TypeScript, anywhere.** `.jsx` for JSX, `.js` for logic. **JSDoc carries what types
  would** — on exported functions, shared utilities, component props, and above all the §29
  contract shapes.
- **Testing posture overrides ECC's default.** [§26](CONTEXT.md#26-demo-first-priority-and-the-demo-only-flag)
  outranks the 80% coverage rule. Test where a bug is **silent and expensive**: allocation
  engine (clamp, eligibility window, `COUNT DISTINCT`), fortnight boundary, webhook
  idempotency, email normalisation, recovery uniform-response. Skip presentational
  components. Say so in the PR. On the server the runner is `node:test` with
  `node:assert/strict` — match the existing `src/lib/*.test.js` files rather than reaching
  for Vitest or Jest, which would be a new shared dependency.

## Demo-first — read before scoping or building anything

This is a 4-day hackathon build for a 5–10 minute demo on **3 August 2026**. Nothing here
reaches a real user during the event. Full rule:
[CONTEXT.md §26](CONTEXT.md#26-demo-first-priority-and-the-demo-only-flag).

**Priority order when time is short:** (1) it runs on demo day → (2) it meets the §24 design
bar on every surface a judge sees → (3) it is complete. **Demo viability and speed outrank
completeness.** Prefer the shortest path that demos convincingly; propose the cut rather
than building the thorough version silently.

**Cut breadth, never the bar.** Drop features, back-half CRUD, pagination, retries,
unreached edge cases. Never drop §24 design quality, accessibility, bilingual coverage on
demoed surfaces, truthful copy (§15/§17/§18.6), secrets discipline, or the mock/real seams
(`apiClient`, `HANDSON_MODE`).

### The `DEMO-ONLY` flag — mandatory, every time

A feature is `DEMO-ONLY` when it is built to survive the demo path and would need real work
before real use: mock/seeded data standing in for a real source, test-mode or throwaway
credentials, happy path only, a force-state admin control, a deliberately absent
auth/approval/consent gate, or anything that only works on our machines (localhost, local
Ollama, our verified email addresses).

Whenever you write one, do all three in the same turn — never after the fact, never only in
a comment:

1. **Code marker** — `// DEMO-ONLY: <what is faked> — real version needs <what> (§ref)` at
   the top of the file or function.
2. **Say it in the response** delivering the code, and in the PR body: one line,
   `DEMO-ONLY: <what is faked> — real needs <what>`.
3. **Add a line to the §19 pre-production checklist** in CONTEXT.md.

Never present a fake as real — not to the team, and least of all in demo framing, since
Love 21 staff sit on the judging panel (§7, §17 demo-integrity rule). The §26 register lists
what is already flagged.

## Git workflow (§25)

Nothing lands on `main` without a PR. Branch as `feature/<page_name>/<feature_name>`, where
`page_name` follows the §10/§12 site structure (`landing`, `news`, `help`, `volunteer`,
`donate`, `admin`). Optional `page/<page_name>` integration branch when several features on
one page must land together. Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`,
`test:`, `chore:`, `perf:`, `ci:`). Rebase or merge `main` in before opening the PR. Delete
branches on merge. Screenshot every UI PR — §24 is a stated requirement and can't be
reviewed from a diff.

`CLAUDE.md`, `CONTEXT.md` and `.claude/rules/` are **tracked** as of `9b98d43` — edits to them
show up in `git status` as normal working-tree changes and belong in a `docs:` commit.
`.claude/settings.local.json` is the one ignored path (per-machine permission grants).

## ECC rule packs

Vendored from [affaan-m/ECC](https://github.com/affaan-m/ECC) under `.claude/rules/ecc/`.
ECC ships no `javascript` pack. `common` + `react` + `web` apply to this stack, plus
`typescript` — despite the name, every file in it is scoped to `**/*.js` / `**/*.jsx` and it
carries the JSDoc guidance for untyped JS. Where the `react` pack shows `.tsx` /
`type Props = {}`, read `.jsx` / a JSDoc block.

@.claude/rules/ecc/common/coding-style.md
@.claude/rules/ecc/common/patterns.md
@.claude/rules/ecc/common/security.md
@.claude/rules/ecc/common/testing.md
@.claude/rules/ecc/common/code-review.md
@.claude/rules/ecc/common/development-workflow.md
@.claude/rules/ecc/common/git-workflow.md
@.claude/rules/ecc/common/performance.md
@.claude/rules/ecc/common/agents.md
@.claude/rules/ecc/common/hooks.md

@.claude/rules/ecc/typescript/coding-style.md
@.claude/rules/ecc/typescript/patterns.md
@.claude/rules/ecc/typescript/security.md
@.claude/rules/ecc/typescript/testing.md
@.claude/rules/ecc/typescript/hooks.md

@.claude/rules/ecc/react/coding-style.md
@.claude/rules/ecc/react/patterns.md
@.claude/rules/ecc/react/hooks.md
@.claude/rules/ecc/react/security.md
@.claude/rules/ecc/react/testing.md

@.claude/rules/ecc/web/coding-style.md
@.claude/rules/ecc/web/design-quality.md
@.claude/rules/ecc/web/patterns.md
@.claude/rules/ecc/web/performance.md
@.claude/rules/ecc/web/security.md
@.claude/rules/ecc/web/testing.md
@.claude/rules/ecc/web/hooks.md
