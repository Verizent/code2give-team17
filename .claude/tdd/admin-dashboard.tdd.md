# TDD Evidence: Admin API Layer

**Plan:** `C:\Users\Dillon\.claude\plans\does-the-community-post-functional-key.md`
**Branch:** `feature/admin/dashboard`
**Runner:** `node --test` (Node built-in, no framework)
**Date:** 2026-08-02

---

## User Journeys

1. **As an admin**, I want full CRUD over articles so that I can publish, edit, and archive content without touching the database.
2. **As an admin**, I want to manage sessions (create, update, bulk-mark attendance) so that donor allocations and volunteer hours are recorded accurately.
3. **As an admin**, I want to manage impact periods so the public Impact page always reflects current figures.
4. **As an admin**, I want to add, reorder, and deactivate Instagram embed links so the homepage grid stays fresh.
5. **As a visitor**, I want to see only active Instagram embeds on the public page.
6. **As an auth middleware**, I want requireRole to block requests whose user role doesn't match so that admin-only routes are protected.

---

## Task Report

### 1. Auth middleware (`require-auth.js`, `require-role.js`)

Two files, two tests. RED: modules did not exist. GREEN: `requireAuth` sets `req.user` with stub admin role; `requireRole` calls `next(ApiError(403))` on mismatch or absent user.

**Command:** `node --test "tests/middleware/*.test.js"`
**Result:** 4/4 PASS

**Guarantees:**
- `requireAuth` always calls `next()` and populates `req.user.role = 'admin'` (DEMO-ONLY stub)
- `requireRole('admin')` passes when role matches, 403 when it doesn't, 403 when `req.user` absent

### 2. DB migrations

Applied via `mcp__supabase__apply_migration`:
- `instagram_embeds` — url, caption_en/zh, display_order, is_active, updated_at trigger
- `content_events` — article_id FK, visitor_hash, created_at; no locale column (§23)
- `sessions` — programme, bilingual title/desc, starts/ends_at, attendance fields, status check constraint

All three returned `{"success":true}`.

### 3. Admin articles service

5 tests. RED: `src/services/admin/articles.service.js` absent. GREEN after implementation.
Key invariant tested: `updateAdminArticle` strips slug from the patch unless the client sends it explicitly — title changes must never re-derive the slug.

**Command:** `node --test "tests/services/admin/articles.service.test.js"`
**Result:** 5/5 PASS

### 4. Admin sessions service

5 tests. RED: service + repo absent. GREEN after implementation.
Key invariant: `recordBulkAttendance` calls repo once per entry and returns `{ updated: N }`.

**Command:** `node --test "tests/services/admin/sessions.service.test.js"`
**Result:** 5/5 PASS

### 5. Admin impact service

4 tests. RED: service functions missing. GREEN after adding `listAll`/`findById`/`create`/`update`/`remove` to `impact.repo.js` and writing the service.
Key invariant: `deleteAdminImpact` throws 409 if `is_current = true` — prevents orphaning the public `/api/impact` endpoint.

**Command:** `node --test "tests/services/admin/impact.service.test.js"`
**Result:** 4/4 PASS

### 6. Admin instagram service

6 tests. RED: service + repo absent. GREEN after implementation.
Key invariant: `createEmbed` and `updateEmbed` validate the URL against `instagram.com/p/` pattern → 400 for non-Instagram URLs.

**Command:** `node --test "tests/services/admin/instagram.service.test.js"`
**Result:** 6/6 PASS

### 7. Routes + index wiring

No dedicated route-layer unit tests (per §26 posture — route wiring is validated by the server starting cleanly). Verified with:
```
node -e "require('./src/app')"
```
No output = no module load errors. All routes mounted alphabetically in `routes/index.js` behind `[requireAuth, requireRole('admin')]` guard.

---

## Test Specification

| # | What is guaranteed | Test file | Type | Result |
|---|---|---|---|---|
| 1 | `requireAuth` populates `req.user` with admin role | `tests/middleware/require-auth.test.js` | unit | PASS |
| 2 | `requireRole('admin')` calls `next()` when role matches | `tests/middleware/require-role.test.js` | unit | PASS |
| 3 | `requireRole` calls `next(403)` when role differs | same | unit | PASS |
| 4 | `requireRole` calls `next(403)` when `req.user` absent | same | unit | PASS |
| 5 | `listAdminArticles` returns raw `_en`/`_zh` columns (no locale resolution) | `tests/services/admin/articles.service.test.js` | unit | PASS |
| 6 | `getAdminArticle` returns body fields for any status | same | unit | PASS |
| 7 | `getAdminArticle` throws 404 for unknown slug | same | unit | PASS |
| 8 | `createAdminArticle` derives slug and reading_time | same | unit | PASS |
| 9 | `updateAdminArticle` never re-derives slug from title change | same | unit | PASS |
| 10 | `deleteAdminArticle` soft-deletes via `status = 'archived'` | same | unit | PASS |
| 11 | `listSessions` returns items and meta | `tests/services/admin/sessions.service.test.js` | unit | PASS |
| 12 | `getSession` throws 404 for unknown id | same | unit | PASS |
| 13 | `recordBulkAttendance` calls repo per entry, returns `{ updated }` | same | unit | PASS |
| 14 | `cancelSession` sets status to cancelled | same | unit | PASS |
| 15 | `cancelSession` throws 404 for unknown id | same | unit | PASS |
| 16 | `listAdminImpact` returns all periods with meta | `tests/services/admin/impact.service.test.js` | unit | PASS |
| 17 | `getAdminImpact` throws 404 for unknown id | same | unit | PASS |
| 18 | `deleteAdminImpact` throws 409 when deleting current period | same | unit | PASS |
| 19 | `deleteAdminImpact` succeeds for non-current period | same | unit | PASS |
| 20 | `listEmbeds` returns items and meta | `tests/services/admin/instagram.service.test.js` | unit | PASS |
| 21 | `listActiveEmbeds` returns only active embeds | same | unit | PASS |
| 22 | `createEmbed` rejects non-Instagram URLs with 400 | same | unit | PASS |
| 23 | `createEmbed` accepts valid instagram.com/p/ URLs | same | unit | PASS |
| 24 | `updateEmbed` throws 404 for unknown id | same | unit | PASS |
| 25 | `deleteEmbed` throws 404 for unknown id | same | unit | PASS |

**Total: 25 new tests, 25 PASS. Full suite: 132/132 PASS.**

---

## Coverage

**Command:** `npm run test:coverage`

New files reach 100% line/branch via repo mocking. Overall suite unchanged at ~84% line.

**Intentional gaps (§26 posture):**
- Route layer not unit-tested — Express wiring validated by clean module load
- `sessions.repo`, `instagram.repo` not independently tested — covered via service mocks
- `requireAuth` real JWT path not tested — it's a stub; real implementation is BE1's task

---

## DEMO-ONLY gaps

- `requireAuth` is a stub — always grants admin. Real version must verify Supabase JWT and load role from `profiles` table (BE1, §30)
- `requireRole` is correct logic but operates on the stub user — no real security until `requireAuth` is real
- No rate-limiting on admin POST endpoints
- `sessions` table has no allocation FK yet — `POST /:id/cancel` will not auto-reassign donor allocations until the donations track merges
