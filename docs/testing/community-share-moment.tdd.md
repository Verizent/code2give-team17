# TDD evidence — Share a moment form and community photo upload

**Source plan:** `C:\Users\Dillon\.claude\plans\fizzy-booping-planet.md`
**Branch:** `feature/news/community-integration`
**Runner:** `node --test` (node:test). The client workspace has no test tooling, so client
changes are covered by lint, build and live browser/API checks rather than unit tests.

## User journeys

1. As a supporter, I want to submit a story without an account, so that sharing is not gated
   behind signing up.
2. As a supporter, I want to attach a photo, so that my moment is shown as I experienced it.
3. As a moderator, I want to see the submitted photo before approving, so that approval is an
   informed decision.
4. As the operator, I want a submitted image to be a real image, so that a public bucket shared
   with article covers cannot be used to host arbitrary content.

## Task report

### Media upload validation (RED → GREEN)

- **RED** — `54ade64` added `tests/services/content/media.service.test.js`; the suite failed to
  load because `src/services/content/media.service.js` did not exist.
  `node --test tests/services/content/media.service.test.js` → `pass 0 / fail 1`.
- **GREEN** — `6d7997d` added the service and repo. First run was `pass 9 / fail 2`: a blanket
  12-byte minimum in `detectImageType` rejected short JPEG/PNG prefixes. Fixed the
  implementation (per-signature length checks), not the tests → `pass 11 / fail 0`.

### photo_url bypass (RED → GREEN)

Found by review, not by the original tests.

- **RED** — the create-post body accepted `photo_url` as any string. Verified exploitable
  against the live API: `POST /api/community-posts` with
  `photo_url: "https://evil.example.com/tracker.gif"` returned `201` and stored the row.
  Added `isOwnMediaUrl` test → `pass 11 / fail 1`.
- **GREEN** — `6dd262d` added `isOwnMediaUrl` (origin comparison via `new URL`, not a prefix
  test) and enforced it in `submitVoice` → full tree `pass 400 / fail 0`. Live recheck: the
  external URL now `400`s, a genuine upload-then-submit still `201`s.

### Pre-existing defect found while verifying

`POST /api/community-posts` returned `500` on **every** submission:
`Could not find the 'submitted_by' column of 'community_posts' in the schema cache`. The
migration `20260802_1035_community_posts_submitted_by.sql` existed but its own header said
`NOT APPLIED`. Applied it. The form could never have worked before this.

## Test specification

| # | What is guaranteed | Test | Type | Result |
|---|---|---|---|---|
| 1 | JPEG, PNG and WebP are recognised from magic bytes | `media.service.test.js:detectImageType recognises…` | unit | PASS |
| 2 | SVG is rejected even though it is an image | `media.service.test.js:…rejects SVG…` | unit | PASS |
| 3 | A text file renamed `.png` is rejected | `media.service.test.js:…text file renamed to .png` | unit | PASS |
| 4 | A RIFF container that is not WebP (e.g. `.wav`) is rejected | `media.service.test.js:…not mistake a RIFF container` | unit | PASS |
| 5 | The object key derives only from the sniffed type, never caller input | `media.service.test.js:buildObjectKey derives…` | unit | PASS |
| 6 | Keys are unique, so an upload cannot overwrite another object | `media.service.test.js:…distinct key per call` | unit | PASS |
| 7 | Oversize and non-image payloads are refused *before* storage is touched | `media.service.test.js:…before touching storage` (×2) | unit | PASS |
| 8 | A `photo_url` our upload endpoint did not produce is refused | `media.service.test.js:isOwnMediaUrl…` | unit | PASS |
| 9 | Whole server tree still green | `node --test "tests/**/*.test.js"` | unit | PASS 400/400 |

## Live end-to-end checks

| Check | Result |
|---|---|
| Valid PNG upload | `201` with a public `photo_url` |
| `.txt` renamed `.png`, `Content-Type: image/png` | `400` |
| SVG claiming `image/png` | `400` |
| Upload → submit with photo | `201`, row `status=pending`, `submitted_by=null`, photo present |
| Honeypot (`website` filled) | `201`, **0 rows written** |
| External `photo_url` without uploading | `400` after fix (was `201`) |
| Community page renders after the rewrite | no provider error, feed and button present |

Client: `npm run lint` clean (only pre-existing warnings), `npm run build` clean.

## Known gaps

- **No rate limit or auth on `POST /api/uploads/community-photo`.** Accepted DEMO-ONLY scope
  and marked in the route. This is the one pre-production blocker.
- **A polyglot** (valid JPEG header carrying trailing HTML/JS) passes the byte sniff. Practical
  XSS risk is low because Storage serves the sniffed `Content-Type`, so browsers will not
  execute it. A `sharp` re-encode would remove the payload entirely; deferred as it is a new
  shared dependency.
- **An uploaded photo is public before moderation.** Approval gates the wall, not the URL. Real
  version needs a private quarantine bucket and signed URLs.
- **No client-side tests.** The dialog's focus trap, object-URL cleanup and mobile layout were
  verified by review and by rendering the page, not by automated tests — the client workspace
  has no test runner and adding one is a shared-dependency change.
