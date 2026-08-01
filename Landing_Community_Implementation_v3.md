# Landing + Community — Implementation Brief (v3)
**Team 17 · Love 21 · Karen's pages**
Reviewed against: the live repo, CONTEXT.md, the member-webapp screenshots, the Q&A, the mentor's winning tips, and love21foundation.com.

---

## The official Challenge Statement (verbatim — re-read before every work session)

**Love 21: Hong Kong Challenge Statement**

**Context:** Love 21 Foundation empowers the Down syndrome, autistic, and neurodiverse community through sports, nutrition, and holistic support programs, offering nearly 1,000 healthy activities to support 600+ members and families each month. While their programs are deep and impactful, the current website does not convey the breadth of their work or guide supporters toward meaningful involvement. Love 21 believes that seeing ability in action, participating as a volunteer, and understanding the impact of giving are the strongest ways to build community, reduce stigma, and grow long-term support.

**Problem Statement:** How might Love 21 redesign their website to transform passive visitors into an engaged community — by celebrating ability, motivating volunteering, and making donating more meaningful?

**Your Mission:** Build a unified website that brings together the following three pillars:

- **Showcase Impact & Celebrate Ability**
  - Clearly communicate the depth of Love 21's programs and holistic model.
  - Highlight real accomplishments, milestones, and moments that celebrate what constituents can do — not just what services are provided.
- **Educate and Drive Volunteering**
  - Educate visitors about the neurodiverse community through shared experiences and connections.
  - Create a clear, welcoming path from curiosity to volunteer sign-up that feels rewarding, human, and easy.
- **Make Donating Engaging and Meaningful**
  - Redesign the donation experience so supporters can clearly see what their contribution supports.
  - Help donors feel acknowledged, connected, and motivated to stay involved after giving.

---

## Mentor's winning tips (what the judges reward)

From the mentor briefing — the bar for a winning team:
- **Practicality is paramount** — the app must actually fit Love 21's real use case and be usable in practice.
- **The system must work** — a real, working pitch beats slides. "The actual thing is important."
- **Know the customer very well** — depth of understanding shows.
- **Innovation** — what makes you excel; have a clear "selling points" moment.
- **Frontend–backend integration is the hard part** — plan for it.
- **Pitch: 6 minutes including demo**, tight time control, **don't repeat the statement (waste of time)**, prepare for follow-up questions, keep an appendix (architecture diagram, financial estimates), and **prepare fallback demo videos**. Don't over-explain technicals.
- **Submit to the BeMyApp page by the deadline.**

What this means for my two pages: they carry the "selling points" moment (Ability Wall + quiz + live engagement), so they must **work in the live demo**, look practical-not-flashy, and be backed by real Love 21 content that proves we know the customer.

---

## 0. What these two pages are responsible for (read this first)

The three pillars are spread across the whole site. **My two pages own all of Pillar 1, plus the education-and-entry half of Pillar 2.** Everything I build is judged against one job:

> **The strategic pain point I solve:** the current site shouts `#somuchability` but shows no ability — four numbers, a paragraph, and news frozen in 2022. A visitor feels a tired organisation, not a living, capable community. **My job: in 60 seconds make a stranger feel and believe these members' ability, then pull them into engaging with it.** Solve that and Pillar 1 is won.

That sentence is the only yardstick. Anything that doesn't serve it is a distraction, however clever.

| Pillar | Who owns it | My two pages' role |
|---|---|---|
| **1 — Showcase Impact & Celebrate Ability** | **Almost entirely me** | Landing = macro proof (numbers + scale). Community = micro proof (individual ability, community-driven). |
| **2 — Educate & Drive Volunteering** | I own *educate* + *entry hook*; Volunteer page owns sign-up | Community's Myth quiz (educate) + employment showcase (hook) → hand off to /volunteer. |
| **3 — Meaningful Donating** | Give page | I only plant donation hooks; I build no donation flow. |

---

## 1. Challenge-statement traceability (the sentences I must hit)

This table is what I show a judge who asks "how does this address the challenge?" — without repeating the statement back to them (per the mentor's tip).

| Official clause (verbatim) | Where I answer it |
|---|---|
| "Clearly communicate the **depth** of Love 21's programs and holistic model." | Landing live-stats band + Achievements Wall |
| "Highlight real **accomplishments, milestones, and moments** that celebrate what constituents **can do — not just services**." | Ability feed (moments) + Achievements Wall (accomplishments/milestones); ability-first reveal = "can do, not services" as a mechanic |
| "**Educate** … through **shared experiences and connections**." | Myth vs Reality quiz + community posts people can submit and like |
| "path from **curiosity to volunteer sign-up** … rewarding, human, and easy." | Quiz ending hook + Employment block → /volunteer |
| "**transform passive visitors into an engaged community**." | The Community page is a real engaged community: submit, AI-polish, publish, like, Latest/Top feeds — engagement is the mechanic, not a metaphor |

> The last row is the big one. Most teams will build a pretty one-way story wall (passive). Ours is a two-way community with likes and live feeds (engaged) — the literal words of the problem statement.

---

## 2. The "post" feature — text + AI polish, not AI generation

Split it clearly (this decides feasibility):
- ❌ **AI generates a post from scratch (photo → article):** the cut feature (CONTEXT §27), depends on a local model a judge's laptop won't run. Don't build it.
- ✅ **User writes text, AI polishes it:** the user writes a rough draft; an "Polish with AI" button rewrites it into a warm, ability-celebrating post, keeping their meaning and inventing nothing. The user can edit, accept, or regenerate. One tiny LLM call; can be mocked client-side for the demo. The user stays in control — which is both good UX and a safety valve.

So the post feature is **assisted submission**, not generation. All posts are **reviewed before publishing** (staff approve — the existing Voices review flow).

---

## 3. Community page — an engaged ability community (RedNote-style, likes only)

The big change from v2: Community is no longer five static blocks. It is a **living community feed** — people submit, AI helps polish, staff approve, everyone likes, and the feed sorts by Latest and Top. This is the literal implementation of "engaged community" and "shared experiences and connections."

```
TOP        Share a moment  → write text → "Polish with AI" → consent → submit (review)
            |
TABS       [ Latest ]  [ Top this week ]        Latest = newest first · Top = most liked
            |
FEED       ability posts (RedNote/Xiaohongshu style, LIKES ONLY, no comments)
            each card: achievement-first line · activity tag · ❤ like + count
            ability-first reveal (context on hover/tap) · like animates, drives Top
            |
INTERLEAVE  Myth vs Reality quiz  (educate → volunteer hook)
            |
INTERLEAVE  Achievements Wall  (collective milestones, real)
            |
BOTTOM      Employment / Opportunities  (member ability → "Offer an opportunity")
```

### Block 1 · The community feed — *engage*
- One live feed of ability posts, RedNote/Xiaohongshu style, **likes only — NO comments** (comments need moderation we can't build safely in 3 days, and public comments on neurodiverse members carry risk).
- Each card: achievement line first and large ("Paddled the full 500 m"), activity-type tag, and a **❤ like button with a count**. Photo de-emphasised; person + context revealed on hover/tap. Ability first, context second.
- **Like:** clicking animates and increments; remembered in localStorage to prevent double-counting; no backend needed for the demo. Likes drive the "Top" ordering.
- **Two tabs: Latest** (newest first — proves the community is alive, the direct answer to "frozen since 2022") and **Top this week** (most liked — social proof of engagement).
- Seed 8–10 pre-approved posts (mix of real public stories + fictional personas), each with a like count and timestamp, so both tabs are full on load. (Mentor tip: pre-supplement the demo.)

### Block 2 · Share a moment — *submit + AI polish*
- Fields: name, relationship (Member / Family / Volunteer / Supporter), their story (textarea), optional photo, **required consent checkbox**, optional notify-only email.
- **"Polish with AI"** button under the textarea rewrites the draft into a warm, ability-celebrating post — keeps meaning, invents nothing; user edits / accepts / regenerates. Mock client-side for the demo; wire a real call later.
- On submit: "Thank you — a staff member will review your post before it appears in the community." Never imply instant publishing.

### Block 3 · Myth vs Reality quiz — *educate* (the innovation)
- 5 experiential questions; each states a myth → user picks Myth/Reality → reveal truth + a real statistic + one framing line. Score, shareable result, and "Want to change these numbers? → Volunteer" at the end.
- **Inspiration:** playspent.org (SPENT) — award-winning poverty game, 4M+ plays, built to engage donors and volunteers. Borrow the **mechanic** (empathy through choice, ends in action), **not the frame**.
- **Red line:** SPENT simulates the hardship of poverty. We must NEVER simulate the hardship of disability — it violates "celebrate what they can do, not focus on limitations," and Love 21 staff on the panel will catch it. Every reveal lands on **"they can — the gap is opportunity, not capability."**

### Block 4 · Achievements Wall — *scale* (collective, quantified)
- Distinct from the personal feed: collective milestones. All real, from CONTEXT §4: Asian Para-Karate medals (Bali), Special Olympics prep, 26 members trained for employment, 6,000+ employment hours created, a member's move to an external internship, plank record 6→8 min, 490 families across 6,859 sessions/year.
- Consent (CONTEXT §18.5/§19): adults full name; minors (e.g. Erica, 9) first initial only.

### Block 5 · Employment / Opportunities — *take part* (Jeff's priority)
- Members' real employment ability ("not necessarily a specially-designed job"); corporate CTA **"Offer an opportunity / Partner with us"** → contact form. Serves Pillar 1 (employment) + Pillar 2 (entry). This is **showcase ability + invite companies**, not visitors applying for jobs.

---

## 4. Landing page — macro proof + distribution

- **Landing = macro proof + fork.** Hero + live numbers + a 3–4 story *preview* (trailer) + three entry cards. 60 seconds to "wow," then fork to Community / Volunteer / Give. The Ability feed is the film; Landing's spotlight is the trailer — don't pile stories onto Landing.
- **Live-stats band = signature element** — big numbers, count-up on first view, honest label "from our 2024–25 annual report" (not "live 30s ago" — it gets debunked on demo day). Honour prefers-reduced-motion.
- **Hero uses a real photo** (`public/brand/hero-group.jpg`) + ability-language headline; keep `#somuchability`.
- **"Coming up" activities section:** does NOT need photos. Use a line ICON per activity type (lucide-react), add a capacity/urgency line ("2 volunteer spots left" / "Class full · join waitlist" — mirrors real waitlist states in the member app), and link "Join as a volunteer" → /volunteer. This turns the weakest-looking block into a real funnel entry. Real activity types + real HK locations.
- Reference charity: water (number-as-hero) and Giving Kitchen (warm density) — but no full-bleed photo walls; assets are limited.
- Bar (CONTEXT §24): professional-and-sleek AND warm — never childlike (members are 6–45 and include competitive athletes). Test at 320px and 1440px, in all languages.

---

## 5. "Ask for Help" button — resolved

Verified (Q&A + CONTEXT §1 + Love 21's own "Join Us" text: *"please get in touch with us to make an appointment to visit our centre"*):
- **CauseBea is the member portal** for already-members; accounts are issued after screening + interview — that's why it shows only a login. Not a help form.
- **No online "request help" flow exists today** — the real path is phone/email to book a centre visit.
- **Serves requirement X15, not a pillar** — pillars target supporters, not help-seeking families. So it's a quiet supplementary link, not a loud button.

Build: turn the existing `/support` placeholder into a real page — warm explanation, honest process line, a simple enquiry form (→ `mailto:info@love21foundation.com`), and a small "Already a member? Sign in" → CauseBea. **Never** point it straight at the CauseBea login. In the pitch, frame it as "an accessibility gap we found and closed."

---

## 6. Assets — human grades, Cursor fills (don't auto-scrape)

Auto-scraping pulls template junk and can't grade consent. **Human selects and grades; Cursor only fills chosen text into `mock.ts`.**

| Asset | Source | Risk |
|---|---|---|
| Brand visuals | Prism branding page + site; some in `public/brand/` | low |
| Statistics | Annual-report figures, already in `mock.ts` | low |
| Story text — employment (2021), dragon boat (2021) | Copy by hand from love21foundation.com/media | low (public) |
| Adult testimonials (Marissa, Crystal) | Quote by hand, full name | med — CONTEXT §18.5 |
| Erica (age 9) | First initial only | CONTEXT §19 |
| Member photos | Only ones already public (`public/brand/` set) | med — add no unpublished faces |

Current `mock.ts` stories are fictional personas — safe under X16. Optionally swap 1–2 for real public stories (employment, dragon boat); keep the rest fictional. Don't replace all with real members.

---

## 7. Repo status + priority (33-hour reality)

Already built (don't rebuild): 13 routes, design system, tri-lingual (en/zh-Hant/zh-Hans), Easy-Read mode, mock layer with annual-report figures, real assets in `public/brand/`, Community (story feed + knowledge cards + share-moment + follow-program), Home (hero/stats/activity-row/ability-spotlight/three-paths).

> Repo is **TypeScript (.tsx)**, contradicting CONTEXT §31 ("plain JSX"). Confirm the whole team moved to TS.

| Priority | Feature | Serves |
|---|---|---|
| **P0** | Landing hero + live numbers + "Coming up" fix | Pillar 1 / the pain point |
| **P0** | Community feed + likes + Latest/Top tabs | "engaged community" — the core word |
| **P0** | Myth vs Reality quiz | the innovation / educate |
| **P1** | Share-a-moment + AI polish | engagement + content freshness |
| **P1** | Achievements Wall | Pillar 1 scale |
| **P2** | Employment / Opportunities | Pillar 1 employment + Pillar 2 |
| **P2** | Ask-for-Help `/support` page | X15 accessibility gap |
| **cut** | AI post generation from scratch | back-office, already cut |

---

## 8. Do-today checklist
- [ ] Confirm team is on TypeScript (repo) vs CONTEXT §31 (JSX).
- [ ] Lock the one-sentence job (§0) with the team so scope stays honest.
- [ ] Community: build the like-driven feed with Latest/Top tabs; add AI-polish to share-moment; build the 5-question Myth quiz.
- [ ] Seed 8–10 pre-approved posts so both tabs are full on load (fallback-ready for the demo).
- [ ] Add Achievements Wall from real CONTEXT §4 milestones.
- [ ] Landing: real hero photo, stats count-up, and fix the "Coming up" cards (icons + capacity + volunteer links).
- [ ] Build `/support` into a real Ask-for-Help page; add a quiet header link.
- [ ] Prepare a fallback demo recording of these two pages (mentor tip).
