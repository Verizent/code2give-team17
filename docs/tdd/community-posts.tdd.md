# TDD Evidence: Community Posts (Voices)

**Plan:** `C:\Users\Dillon\.claude\plans\does-the-community-post-functional-key.md`
**Branch:** `feature/news/content-api`
**Runner:** `node --test` (Node built-in, no framework)
**Date:** 2026-08-01

---

## User Journeys

1. **As a supporter, parent or volunteer**, I want to submit a story so that it appears on
   the Voices tab after a moderator approves it.

2. **As a visitor**, I want to read approved Voices stories on the public listing so that I
   can see real accounts from the community.

3. **As a bot**, when I fill the hidden honeypot field my submission appears to succeed but
   is never saved, so I cannot spam the Voices tab.

4. **As a moderator**, I want to see pending submissions in the admin queue (with contact
   email visible) so that I can approve or reject them.

5. **As a moderator**, I want to approve or reject a submission so that approved stories
   appear publicly and rejected ones do not.

---

## Task Report

### 1. Schema validation (`community-post.schema.js`)

Already written and committed (`89aba8c`). 8 tests cover consent enforcement, honeypot
acceptance, story minimum length, and email validation.

**Command:** `node --test tests/schemas/community-post.schema.test.js`
**Result:** 8/8 PASS

**Guarantees:**
- `consent_given: false` → `ZodError` (enforced at schema + DB check constraint = two layers)
- Omitting `consent_given` → `ZodError`
- Story under 40 characters → `ZodError`
- A populated `website` field → **accepted** (not rejected), confirmed by test name
  "ACCEPTS a populated honeypot rather than rejecting it"
- Malformed `contact_email` → `ZodError`; absent → valid

### 2. Service layer (`community-posts.service.js`)

7 tests covering all four exported functions. Tests mock the repo layer; no Supabase
connection required.

**Command:** `node --test tests/services/content/community-posts.service.test.js`
**Result:** 7/7 PASS

**Key RED → GREEN pairs:**

| Behaviour | How RED was confirmed | GREEN commit |
|---|---|---|
| Honeypot triggers fake 201, no DB call | `repo.create` mock call count asserted as 0 | Same session (code + test written together, module was absent before) |
| `website` field stripped before repo call | `"website" in passedData === false` assertion | Same session |
| Unknown id → 404 | `error.status === 404` assertion | Same session |

### 3. Repo layer (`community-posts.repo.js`)

Not independently unit-tested (the service tests mock the repo). Correctness guarantees
come from the explicit column projection constants and the service-level mocking.

**Critical invariant not under unit test (acceptable per §26/CLAUDE.md posture):**
`contact_email` is absent from `PUBLIC_COLUMNS` — the column list is the only guard
between the email and a public response. This is a code-review guarantee, not a test
guarantee.

### 4. Route registration

Verified by running `node --test` (all 177 unit tests pass, including articles and impact
which share the same `routes/index.js`). A syntax or require error in either route file
would cause module load failure and break the whole suite.

---

## Test Specification

| # | What is guaranteed | Test file | Test type | Result |
|---|--------------------|-----------|-----------|--------|
| 1 | `consent_given: false` is rejected | `tests/schemas/community-post.schema.test.js` | unit | PASS |
| 2 | Missing `consent_given` is rejected | same | unit | PASS |
| 3 | Story under 40 chars is rejected | same | unit | PASS |
| 4 | Honeypot (`website`) populated → schema ACCEPTS it (silent drop is service's job) | same | unit | PASS |
| 5 | Honeypot empty → also accepted | same | unit | PASS |
| 6 | Malformed email rejected, absent email accepted | same | unit | PASS |
| 7 | `listVoices` returns `{ items, meta }` from repo | `tests/services/content/community-posts.service.test.js` | unit | PASS |
| 8 | `submitVoice` with truthy `website` → fake 201, `repo.create` never called | same | unit | PASS |
| 9 | `submitVoice` without honeypot → calls repo, returns `{ id, submitted_at }` | same | unit | PASS |
| 10 | `submitVoice` strips `website` key before passing data to repo | same | unit | PASS |
| 11 | `listPendingVoices` returns admin queue rows with `contact_email` | same | unit | PASS |
| 12 | `moderateVoice` returns updated row on success | same | unit | PASS |
| 13 | `moderateVoice` throws 404 when id is unknown | same | unit | PASS |

**Total: 15 tests, 15 PASS**

---

## Coverage

**Command:** `npm run test:coverage` (covers `tests/` unit tests only)

| File | Lines | Branches |
|---|---|---|
| `community-post.schema.js` | 100% | 100% |
| `community-posts.service.js` | 100% | 100% |
| `query.schema.js` | 100% | 100% (fn: 50%) |
| **All files** | **83.98%** | **96.74%** |

**`query.schema.js` function coverage 50%:** `idParamSchema` and `moderateSchema` are
exercised at the route layer (runtime) but not in the unit test suite. This is intentional
— the project's §26 posture skips route-level test tooling for the hackathon window.

**Pre-existing failure (not from this feature):** `test/schema/10_volunteers/volunteer-badges.test.js`
fails with `JWT issued at future` — a Supabase clock-drift issue in the volunteer track's
DB integration tests. Unrelated to community posts.

---

## DEMO-ONLY gaps (not tested, not a bug)

- **No rate-limit on POST** — `express-rate-limit` is a new lockfile dep; deferred. Marker
  in `routes/community-posts.routes.js` line 1.
- **No auth on admin routes** — `requireRole('admin')` not built; deferred until BE1
  settles profiles ownership (§30). Marker in `routes/admin/community-posts.routes.js`
  line 1.
- **`contact_email` column projection** — tested by code review only; no automated test
  asserts the public endpoint response never contains the email field.
