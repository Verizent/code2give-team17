# code2give-team17

Love 21 Foundation website rebuild. Background, challenge statement, and org facts: [CONTEXT.md](CONTEXT.md).

Stack: React 19 + Vite 8 (`client/`, **ESM**, plain JSX — no TypeScript), Express 5 on Node
(`server/`, **CommonJS** — `require`, not `import`).

## What actually exists — check before assuming

Setup is done and both workspaces run: `server` on **3000**, `client` on 5173 proxying `/api`
to it. But **most of CONTEXT.md Part II is the target, not the codebase.**

On disk today: the stock Vite starter (`App.jsx` renders a counter — `main.jsx` does not route
anywhere), four empty or placeholder files under `client/src/{components,pages}/`, and an
Express server with `GET /`, `GET /api`, `GET /api/health` and `GET /api/health/supabase`,
plus a 404 and an error handler.

**Not built, despite being described in CONTEXT.md:** `apiClient` and the mock/real seam,
router, providers, i18n and locale files, design tokens, layouts, any feature endpoint, the
database schema, auth middleware, Zod validation, rate limiting, pino, and all test tooling.
On the client only `react` and `react-dom` are installed — react-router, TanStack Query,
i18next, supabase-js and react-markdown are not.

[CONTEXT.md §28](CONTEXT.md#28-repository-layout-and-setup-state) is the full inventory and
the tiebreaker: **where another section describes something as built and §28 does not list
it, §28 is right.** Read a file before writing code that depends on it.

Two things to get right rather than discover late:

- **`express.json()` is global in `app.js`.** A Stripe webhook route needs `express.raw()`
  mounted *above* it in the same PR, or signature verification fails on a valid signature
  ([§17](CONTEXT.md#17-integration-setup-notes)).
- **The response envelope is the resource itself, unwrapped** — no `data` key. Collections are
  `{ items, meta }`; errors are `{ error, message, code }`. Throw `ApiError` from
  `server/src/lib/api-error.js` rather than formatting a response per route. **`code` is the
  only field a client may branch on** — `message` is absent in production
  ([§29](CONTEXT.md#29-api-contract)).

Adding a dependency is a shared-file change for six people — say so in the PR body.

## Demo-first — read before scoping or building anything

This is a 4-day hackathon build for a 5–10 minute demo on **3 August 2026**. Nothing here reaches a real
user during the event. Full rule: [CONTEXT.md §26](CONTEXT.md#26-demo-first-priority-and-the-demo-only-flag).

**Priority order when time is short:** (1) it runs on demo day → (2) it meets the §24 design bar on every
surface a judge sees → (3) it is complete. **Demo viability and speed outrank completeness.** Prefer the
shortest path that demos convincingly; propose the cut rather than building the thorough version silently.

**Cut breadth, never the bar.** Drop features, back-half CRUD, pagination, retries, unreached edge cases.
Never drop §24 design quality, accessibility, bilingual coverage on demoed surfaces, truthful copy
(§15/§17/§18.6), secrets discipline, or the mock/real seams (`apiClient`, `HANDSON_MODE`).

### The `DEMO-ONLY` flag — mandatory, every time

A feature is `DEMO-ONLY` when it is built to survive the demo path and would need real work before real
use: mock/seeded data standing in for a real source, test-mode or throwaway credentials, happy path only,
a force-state admin control, a deliberately absent auth/approval/consent gate, or anything that only works
on our machines (localhost, local Ollama, our verified email addresses).

Whenever you write one, do all three in the same turn — never after the fact, never only in a comment:

1. **Code marker** — `// DEMO-ONLY: <what is faked> — real version needs <what> (§ref)` at the top of the
   file or function.
2. **Say it in the response** delivering the code, and in the PR body: one line,
   `DEMO-ONLY: <what is faked> — real needs <what>`.
3. **Add a line to the §19 pre-production checklist** in CONTEXT.md.

Never present a fake as real — not to the team, and least of all in demo framing, since Love 21 staff sit
on the judging panel (§7, §17 demo-integrity rule). The §26 register lists what is already flagged.

## ECC rule packs

Vendored from [affaan-m/ECC](https://github.com/affaan-m/ECC) under `.claude/rules/ecc/`.
ECC ships no `javascript` pack. `common` + `react` + `web` apply to this stack, plus `typescript` —
despite the name, every file in it is scoped to `**/*.js` / `**/*.jsx` and it carries the JSDoc
guidance for untyped JS.

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
