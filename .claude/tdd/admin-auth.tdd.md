# TDD evidence — `feature/admin/auth`

Server-side authentication and role authorization. This report covers the completion pass
that closed the feature and test gaps found auditing the first eleven commits.

- **Runner:** `node --test "tests/**/*.test.js"` from `server/`
- **Not used:** bare `npm test`. It is bare `node --test`, which also discovers
  `server/test/schema/` and **writes rows to the shared Supabase project**. It is not a safe
  RED/GREEN gate.
- **Suite:** 140 passing at the start of this pass → **173 passing**, 0 failing
- **Coverage:** 85.03% lines · 94.36% branches · 71.43% functions

---

## User journeys

1. As an admin, I sign in and reach the moderation queue, and nobody who is not an admin can.
2. As a signed-in user, my browser can discover whether I am an admin, so it knows whether to
   offer an admin surface at all.
3. As a returning volunteer, creating an account attaches my existing hours and badges —
   and only ever mine.
4. As a visitor, an auth outage does not take down the public pages I could read anyway.
5. As a client developer, an error tells me what went wrong in the project's own vocabulary,
   not the auth provider's.

---

## What was found, and why it needed closing

The first eleven commits built working identity machinery. The audit found three gaps.

**`GET /api/me` did not exist — journey 2 was unreachable.** `role` is deliberately read from
the `profiles` row and never from the JWT; that is the decision that closes the
privilege-escalation hole. The unintended consequence was that a signed-in browser held a
valid token and had no way to learn its own role. The auth layer was unusable from the client.

**`verify-token.js` had no test at all** — the file holding the cache, the timeout, and the
401-vs-503 split. It was untestable, not merely untested: it destructured `getServiceClient`
at require time, so the binding was captured at load and no stub could reach it.

**The response envelope leaked provider vocabulary.** Found by the security review, not by me.

---

## Cycles

### 1 — `GET /api/me`

| | |
|---|---|
| RED | `d8c7b38` · `node --test tests/services/auth/me.test.js` → `MODULE_NOT_FOUND: me.service` |
| GREEN | `1849ac3` · 148 pass / 0 fail |

Compile-time RED: the module genuinely did not exist. Implemented `me.service.js`,
`me.routes.js`, and the mount.

### 2 — `verify-token.js`

| | |
|---|---|
| RED | `74a1cb8` · **8 of 10 failing** |
| GREEN | `ab4237d` · 10 of 10, full tree 158 pass / 0 fail |

The two that passed at RED passed **for the wrong reason**: they expected 503, and the
unstubbed client throws 503 for missing env. After the refactor they pass for the right one.

GREEN was a testability refactor with no behaviour change — require the module, call the
property. `verify-token.js` went from **0% to 97.83%** line coverage.

### 3 — `requireAuth` / `optionalAuth`

| | |
|---|---|
| Commit | `43778c5` · 8 tests, all passing on first run |

**No RED phase, and none is claimed.** The implementation was already correct, so these are
characterisation tests locking in existing behaviour. There was no production change to gate.

### 4 — `/api/admin` mount guard

| | |
|---|---|
| Commit | `da46f7b` (guard) · `7911de5` (hardening) |

Asserts on source text and on Express's router stack, because what it defends against is a
merge rather than a code path. **Verified it can fail**, rather than assuming: adding the
donations track's second mount produced `Expected a single /api/admin mount in
routes/index.js, found 2`, and reverting restored green.

The code review then found the second assertion would pass on an *empty* stack — optional
chaining comparing `undefined` to `undefined` — so removing the guard entirely would have
left the test green. Fixed in `7911de5`.

### 5 — Error-envelope leak (from the security review)

| | |
|---|---|
| RED | `67d2519` · 2 of 5 failing — `bad_jwt` and `ENOTFOUND` both reached the envelope |
| GREEN | `c771f2c` · full tree 173 pass / 0 fail |

One of the five failed initially because **my test was wrong, not the code**: I asserted
`INTERNAL_SERVER_ERROR` where the project's code for 500 is `INTERNAL`. Corrected the test to
match the real contract before treating the RED as valid.

---

## Guarantees

| # | What is guaranteed | Test | Type |
|---|---|---|---|
| 1 | A token claiming `user_metadata.role = 'admin'` still resolves to `volunteer` | `tests/services/auth/authenticate.test.js` | unit |
| 2 | `requireRole` refuses when mounted without `requireAuth`, rather than reading `undefined.role` | `tests/middleware/require-role.test.js` | unit |
| 3 | An unauthenticated caller gets 401 from `requireRole`, not 403 | `tests/middleware/require-role.test.js` | unit |
| 4 | A revoked token — which resolves `{ user: null, error: null }` — is refused | `tests/services/auth/verify-token.test.js` | unit |
| 5 | A token with no `sub` is refused (the service-role key is a valid JWT with none) | `tests/services/auth/verify-token.test.js` | unit |
| 6 | Supabase being unreachable answers 503, never 401 | `verify-token.test.js`, `require-auth.test.js` | unit |
| 7 | A rejection is never cached, so a user is not locked out for the TTL | `tests/services/auth/verify-token.test.js` | unit |
| 8 | `/api/me` reports the role on the profile row, never one implied by the caller | `tests/services/auth/me.test.js` | unit |
| 9 | `/api/me` never discloses a volunteer row belonging to another profile | `tests/services/auth/me.test.js` | unit |
| 10 | `volunteers.access_token` is never serialised into a response | `tests/services/auth/me.test.js` | unit |
| 11 | A volunteer row already claimed by someone else is refused with 409, not stolen | `tests/services/auth/volunteer-link.test.js` | unit |
| 12 | Emails are normalised before lookup, so a miss is never mistaken for "no such volunteer" | `tests/lib/email.test.js`, `me.test.js` | unit |
| 13 | `optionalAuth` serves anonymous visitors, expired tokens, and auth outages alike | `tests/middleware/require-auth.test.js` | unit |
| 14 | No provider error code (`bad_jwt`, `ENOTFOUND`) reaches the response envelope | `tests/middleware/error-handler.test.js` | unit |
| 15 | `code` survives production message suppression; no `data` key sits beside an error | `tests/middleware/error-handler.test.js` | unit |
| 16 | Exactly one router is mounted under `/api/admin`, guard first in the stack | `tests/routes/admin-mount.test.js` | structural |

---

## Review outcomes

Both passes were run because `code-review.md` makes them mandatory for authentication code.

| Severity | Finding | Status |
|---|---|---|
| HIGH | Raw provider `error.code` emitted verbatim into the envelope | **Fixed** — `c771f2c`, with a RED test first |
| MEDIUM | `insertIfAbsent` could return `null`; caller reads `.role` → TypeError → bare 500 | **Fixed** — `7911de5`, now a 503 that names the cause |
| LOW | `admin-mount` guard passed on an empty router stack | **Fixed** — `7911de5` |
| MEDIUM | `error-handler.js` logs the whole error object | **Not fixed, deliberate.** No logger exists yet, and narrowing the log during a hackathon removes debugging signal for a risk that is not reachable today. §19 item. |
| LOW | 60s cache TTL keeps a revoked token valid server-side for up to a minute | **Not fixed, deliberate.** Documented and tested; §19 item. |
| LOW | `optionalAuth` swallows a 503 with no log | **Not fixed.** Post-logger task. |
| HIGH | No rate limiting | **Out of scope.** Pre-existing; there is no `POST /api/auth/*` in this design. |

The security review confirmed the four properties it was asked to attack — no client-controlled
input reaches `role`, the volunteer claim requires Supabase's `email_confirmed_at`, `/api/me`
discloses nothing belonging to another profile, and the cache is keyed on a sha256 digest
rather than a raw token.

---

## Known gaps

**Nothing here has been exercised against a real database.** `05_identity/00_profiles.sql`
is in the repo and **not applied** to the live project, and no row has `role = 'admin'`. Every
guarantee above is a unit-level guarantee. The end-to-end path is unverified.

| Gap | Why |
|---|---|
| `profiles.repo.js` 44.83%, `volunteer-links.repo.js` 58.62% | Both destructure `getSupabase`, so the query-builder chain cannot be stubbed. Repos are the layer `server/test/schema/` is meant to cover, and that tree needs the shared live database. |
| `verify-token.js:47-49` — cache eviction at 500 entries | Needs 501 distinct tokens to reach. Untested; a bug there means unbounded memory growth. |
| `error-handler.js:19-21` — `headersSent` branch | Untested. |
| The 5s verify timeout | No test. Mock timers plus the `.unref()` call on the timeout handle made this unreliable to assert; left rather than written badly. |
| No `test/schema/05_identity/` | The only thing that would catch "the SQL was never applied". |

**Blocked on shared infrastructure, none of it touched by this branch:** applying the profiles
SQL, creating the first admin, and confirming Supabase's *Confirm email* setting is ON —
without which the volunteer-claim guard at `authenticate.js:89` silently protects nothing,
because Supabase auto-populates `email_confirmed_at` at signup when it is off and the code
looks identical either way.
