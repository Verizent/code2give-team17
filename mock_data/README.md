# mock_data/

Standalone illustrative datasets, separate from the real `server/db/seed/`
pipeline (`articles.seed.js`, `community-posts.seed.js`, `impact.seed.js`,
run via `npm run seed`). Nothing here is wired into that pipeline or into any
route — this is scratch data for frontend/demo use, not what actually lands
in Supabase. Validation scripts referenced below were run from a scratchpad,
not checked in here.

- `articles.json` — 10 `articles` rows
- `impact-periods.json` — 4 `impact_periods` rows (a trend set)
- `community-posts.json` — 8 `community_posts` (Voices) rows

## These are DB rows, not API responses

Every file here is a raw array of **database rows**. The API does not return
rows, so serving these unchanged behind `apiClient`'s mock mode would give the
frontend a shape the real server never produces — and the whole point of that
seam is that cutover is a config change, not a refactor (CONTEXT.md §12).

Two transforms stand between a row and a response (§29):

1. **The envelope.** Collections are `{ data: [...], meta: { total, page, limit } }`;
   a single resource is `{ data: {...} }`. `meta` sits *beside* `data`, not inside.
   `/api/health` and `/api/` are the only unwrapped endpoints.
2. **Locale resolution.** The server returns `title`, `excerpt`, `cover_alt`,
   `body` — already resolved for `?locale=`, with an empty `zh-Hant` field falling
   back to English *per field*. It never returns the `_en` / `_zh` pair. These
   files carry the pairs, because they are rows.

So a mock handler for `GET /api/articles?locale=zh-Hant&limit=12` owes the caller
a page of locale-resolved objects wrapped in `{ data, meta }` — not
`articles.json`. Errors are `{ error, message, code }`, and `message` is absent
outside `NODE_ENV=development`.

`community-posts.json` needs no locale pass: `story` is single-language by
design, as the Coverage section below notes.

## Provenance

Content is grounded in real, publicly published material from
[love21foundation.com](https://love21foundation.com) — its programme pages
(Sport, Nutrition, Family, CSR) and its Media/news listing (8 real post
titles and dates, e.g. the Beyond Limits Banquet, the 2025 Charity Raffle,
the dragon-boating partnership, the free nutrition-guidance story) — plus
CONTEXT.md's already-sourced facts (the 2024–25 annual report figures:
6,859 sessions / 490 families / 30% YoY growth / 86% programme spend; the
trisomy-21 origin of the "Love 21" name).

Article bodies, headings and zh-Hant translations are newly written for this
mock set, not copied verbatim from the site. The one direct quotation —
"It was an incredible experience and one that will stay with us for a long
time." (Chaim, Argyll Scott) — is reused verbatim because Love 21 already
publishes it themselves on their live CSR page; no other quotes are
attributed to real named individuals, since this repo has no consent to
speak for them (CONTEXT.md's own consent flag on the §4 stories was the
reason not to reuse *those* names here either).

## `articles` breakdown

| category | count | notes |
|---|---|---|
| `report` | 1 | the 2024–25 annual impact figures, `is_featured: true` |
| `news` | 6 | banquet, raffle, dragon boating, employment, CSR day, nutrition |
| `education` | 3 | wellness habits, trisomy 21 explainer, first-time volunteer guide |

9 `published`, 1 `draft` (the volunteer guide, `published_at: null`) — enough
to exercise a visitor endpoint's default published-only filter once one
exists. All 10 are fully bilingual (`_en` + `_zh` on every field, including
matching block-for-block `body_zh`) rather than the partial EN-only fallback
CONTEXT.md §19 describes for the eventual full 14-article seed.

## DEMO-ONLY: placeholders that don't resolve

<!-- DEMO-ONLY: cover/body images are placehold.co placeholders and the one
     Instagram embed's postId is fabricated — real version needs actual
     uploaded media (server/db/migrations/20260801_1000_common.sql's `media`
     bucket) and a real published Instagram post ID (CLAUDE.md DEMO-ONLY
     contract). -->

- Every `cover_image_url`, `og_image_url` and body `image.url` points at
  `placehold.co` — no real photos exist for these stories yet, and Love 21's
  own site images aren't ours to hotlink.
- `attachment_url` on the report article is a made-up local path
  (`/media/reports/...`), not a real uploaded PDF.
- The `embed` block's `postId` (`Cy1Raffle25Q`) is a fabricated,
  non-resolving placeholder in the right shape — it will not load a real
  Instagram post.

None of this is wired into `db/seed/` or the app's actual routes — it's
separate from the real seed pipeline (see above), so there's nothing to flag
in CONTEXT.md §19 at this point. Flag it there only if this specific data
ever gets plugged into `npm run seed` or client fixtures.

## `articles.json` shape

Each object is a full DB *row* (including server-derived fields: `id`,
`slug`, `status`, `reading_time_minutes`, `published_at`, `created_at`,
`updated_at`) — not a `createArticleSchema` POST body, which rejects those
same fields by design (CLAUDE.md's validation-asymmetry note). Consume it as
seed input or as `GET /api/articles` / `GET /api/articles/:slug` fixture
data once those exist.

---

# `impact_periods`

4 rows shaped to match `server/supabase/migrations/20260801_1040_impact_periods.sql`,
a trend set built around the one real published figure set.

## Provenance — one real row, three back-calculated

`server/db/seed/impact.seed.js` already seeds the single real period Love 21
has published: **2024–25**, 490 families, 6,859 sessions, 30% YoY growth,
86% programme spend (CONTEXT.md §20). That row is reproduced here
byte-identical on every figure (`is_current: true`), *not* re-derived.

The three earlier periods (2021–22 through 2023–24) are **fabricated for
demo purposes** — Love 21 has not published multi-year figures, and
CONTEXT.md's own open question #1 flags that even the current stat set isn't
fully confirmed. They're constructed by working backward from the real 30%
YoY growth figure geometrically (÷1.3 per year: 6,859 → 5,280 → 4,060 →
3,120), so the trend line is internally consistent rather than arbitrary,
and `families_served` is derived the same way (490 → 377 → 290 → 223).

Two grounded constraints carried through every synthetic row:

- `sessions_family_support` is `0` for all three pre-2024–25 periods — the
  Family Support programme launched in December 2024 (CONTEXT.md §2), so it
  cannot have session counts in any earlier fiscal year.
- Fiscal years follow the real row's Jul 1 – Jun 30 boundary.

Unlike `articles.json` (which reuses one real public quote), no part of
`impact-periods.json` beyond the 2024–25 row is drawn from anything Love 21
has actually published — treat the earlier three rows as placeholder trend
data only, not figures to present as real.

## DEMO-ONLY: fabricated historical figures

<!-- DEMO-ONLY: three of the four impact_periods rows (2021-22, 2022-23,
     2023-24) are back-calculated placeholder figures, not real Love 21
     data — real version needs actual historical reporting from Love 21, or
     these rows should be dropped rather than presented as history. -->

`programme_spend_pct` and `activity_types` for the same three rows are
likewise invented (smoothed toward the real 86%/84 endpoint), not sourced
from anything published.

## Shape

Full DB rows, including `id`, `created_at`, `updated_at` and `is_current`.
Exactly one row has `is_current: true`, matching the partial unique index
`impact_current_idx`. `yoy_growth_pct` is `null` on the earliest row (2021–22)
since there's no prior-year baseline in this set to compute it from.

---

# `community_posts` (Voices)

8 rows shaped to match
`server/supabase/migrations/20260801_1030_community_posts.sql` and
`server/src/schemas/community-post.schema.js`, validated structurally
(consent, status/moderation consistency, 40-char story minimum — see
`node validate-mock-community-posts.js` output; scratchpad only).

## Provenance — entirely fictional, by necessity

Unlike `articles.json`, none of this is grounded in anything Love 21 has
published: Voices are supporter/parent/volunteer submissions, which by
definition don't exist anywhere public until someone submits one. Every
name, relationship and story here is invented — following the same
convention the *real* seed (`server/db/seed/community-posts.seed.js`)
already uses (its "Rachel L.", "Daniel W.", "Mrs Chan" and "Priya S." are
equally fictional placeholder submitters). Names, companies and details in
both files are deliberately generic rather than referencing real,
identifiable people, in keeping with CONTEXT.md's consent flag on the real
§4 stories.

## Coverage

| status | count | notes |
|---|---|---|
| `approved` | 5 | what the Voices tab and Home strip actually render |
| `pending` | 2 | moderation queue, including one zh-Hant submission |
| `rejected` | 1 | see below — a deliberately instructive rejection |

Relationships cover `volunteer`, `parent`, `supporter` and `sibling` (a type
absent from the real seed). Two stories are in Traditional Chinese
(zh-Hant/Cantonese written register), matching the real seed's pattern of
single-language `story` text rather than an `_en`/`_zh` pair — this table
has no locale-split columns, unlike `articles`. `contact_email` is set on
5 of 8 rows and `photo_url` (a `placehold.co` placeholder, same DEMO-ONLY
caveat as `articles.json`'s images) on 3 of 8, so both optional-field paths
have coverage.

## The rejected row is the interesting one

`c3d4e5f6-0008-...` isn't rejected for being spam — it's rejected because
the *story itself* discloses a specific child's full name, school and a
medical detail, none of which the submitter had consent to publish. That's
deliberate: `consent_given: true` only covers the submitter's own consent to
share *their* story, not a third party's, and the `moderation_note` records
exactly that distinction. This is meant to exercise moderation logic against
a realistic PDPO-shaped judgment call, not a keyword-filter case.

## Shape

Full DB rows: `id`, `author_name`, `relationship`, `story`, `photo_url`,
`contact_email`, `consent_given`, `status`, `submitted_at`, `moderated_at`,
`moderated_by`, `moderation_note`. No `created_at`/`updated_at` — this table
has neither column. `moderated_by` uses one consistent placeholder admin
uuid (`c3d4e5f6-a001-...`) across every moderated row, standing in for the
`profiles` table that CLAUDE.md notes is deliberately deferred (BE1 owns
identity, §30) — `community_posts.moderated_by` has no real FK yet either.
Pending rows correctly have `moderated_at`/`moderated_by` both `null`; every
approved/rejected row has both set. The honeypot `website` field from
`createCommunityPostSchema` is POST-input-only and never appears here, since
it isn't a database column.
