# Love 21 Foundation — Website Rebuild

**Event:** Morgan Stanley Code to Give | Asia — 30 July to 3 August 2026
**Deliverable:** A unified public-facing website
**Client:** Love 21 Foundation, Hong Kong (registered charity)

**Sections 1–8** are background only: the challenge as issued, and factual information about the organisation. No design or implementation decisions.

**Sections 9 onward** record the team's build decisions, architecture and open questions. Added 31 July 2026.

> ### Read §24 before writing any UI
>
> The owner's single most emphatic requirement is **how the site looks and feels**: *professional and sleek, and at the same time friendly and welcoming.* Not one at the expense of the other. This is a stated client requirement, not a team preference — it outranks feature count. A surface that ships functionally complete but looks like an unstyled template, or looks slick but cold, has failed the brief. **[§24](#24-design-direction--the-owners-brief) is the standard every screen is measured against.**
>
> ### Read §25 before pushing
>
> **Nothing lands on `main` without a PR.** Branch as `feature/<page_name>/<feature_name>`. See [§25](#25-git-branching-and-pr-workflow).
>
> ### Read §26 before scoping anything
>
> **Demo viability and speed outrank completeness.** The bar is that it works convincingly on 3 August, not that it is finished. Where the two collide, cut breadth — never the §24 design bar and never truthfulness. And **every feature built only for the demo carries the `DEMO-ONLY` flag, said out loud, every time.** See [§26](#26-demo-first-priority-and-the-demo-only-flag).
>
> ### Read §28 before assuming anything exists
>
> **Most of Part II is the target, not the codebase.** Setup is done and both workspaces run, but what is on disk is a Vite starter and a four-route Express server. [§28](#28-repository-layout-and-setup-state) is the inventory, and it is the tiebreaker: where any other section describes something as built and §28 does not list it, §28 is right.

---

## 1. The challenge statement (verbatim source of truth)

> **Context:** Love 21 Foundation empowers the Down syndrome, autistic, and neurodiverse community through sports, nutrition, and holistic support programs, offering nearly 1,000 healthy activities to support 600+ members and families each month.
>
> While their programs are deep and impactful, the current website does not convey the breadth of their work or guide supporters toward meaningful involvement. Love 21 believes that seeing ability in action, participating as a volunteer, and understanding the impact of giving are the strongest ways to build community, reduce stigma, and grow long-term support.
>
> **Problem Statement:** How might Love 21 redesign their website to transform passive visitors into an engaged community — by celebrating ability, motivating volunteering, and making donating more meaningful?
>
> **Your Mission:** Build a unified website that brings together the following three pillars:
>
> **1. Showcase Impact & Celebrate Ability**
> - Clearly communicate the depth of Love 21's programs and holistic model.
> - Highlight real accomplishments, milestones, and moments that celebrate what constituents *can do* — not just what services are provided.
>
> **2. Educate and Drive Volunteering**
> - Educate visitors about the neurodiverse community through shared experiences and connections.
> - Create a clear, welcoming path from curiosity to volunteer sign-up that feels rewarding, human, and easy.
>
> **3. Make Donating Engaging and Meaningful**
> - Redesign the donation experience so supporters can clearly see what their contribution supports.
> - Help donors feel acknowledged, connected, and motivated to stay involved after giving.

### Scope boundary

This is a **public-facing website**. Internal tooling — coach dashboards, ops scheduling, attendance systems — is out of scope.

**Anything member- or family-facing is also out of scope.** Love 21 already runs a separate webapp serving service recipients: accounts, schedules, progress, points, bookings.

**Audience test:** a *visitor, volunteer, donor, or corporate partner* falls inside this brief. A *member or parent* does not.

---

## 2. About the organisation

Love 21 is a Hong Kong registered charity empowering the Down syndrome, autistic, and neurodiverse community through sports, nutrition, and holistic support programmes. Strengths-based model. Hashtag: `#somuchability`.

**All services are free to members and families.** This is core to their identity.

**Four integrated programme teams:**

| Team | Description |
|---|---|
| Sports | Ball games, floor curling, gymnastics, boxing, fencing, bocce, trampoline, Latin dance. Competitive teams now formed. |
| Fitness | In-house personal trainers qualified in supporting Down syndrome and autism. Personalised curricula. |
| Nutrition | Two-phase: intensive (monthly dietitian consults + weekly personal training), then follow-up. Body composition analysis, pre/post blood tests, family cooking workshops, graduation ceremony. |
| Family Support | Launched December 2024. Workshops (art, music, magic, therapy), family outings, one-on-one counselling for parents and siblings. |

Plus **Community & Education**: school outreach, corporate CSR partnerships, volunteer programme — aimed at reducing stigma.

**Contact / identity:**
- Website: love21foundation.com
- Address: 1102, Trium Lab (a.k.a. Artisan Lab), 21 Luk Hop Street, San Po Kong, Kowloon

> **Note:** the floor does not reconcile across sources. This doc and the Love 21 site say "1102, Trium Lab"; the HandsOn Hong Kong partner profile says "2/F, Artisan Lab"; a HandsOn opportunity listing says "2/F, Trium Lab". Same street and building, contradictory floor. Not confirmed with Love 21 — matters if the address is printed on a volunteer confirmation.
- Phone: +852 2322 2121 (also listed as 2322 2921 on Community Chest)
- Email: info@love21foundation.com
- Founder & CEO: Jeff Rotmeyer
- Board Chairman: Matthew Hosford
- The "21" refers to trisomy 21 (the 21st chromosome), the cause of Down syndrome

---

## 3. Key figures

### From the challenge statement
- **600+** members and families supported each month
- **Nearly 1,000** healthy activities per month

### Volunteering
- **1,000+ volunteer hours per month** (stated on the love21foundation.com homepage)

> **Note:** unconfirmed, and hard to square with the HandsOn listings in §5, which advertise roughly one volunteer spot per session. Either a large volume of volunteering happens outside HandsOn (corporate groups, weekly-class volunteers), or the figure covers something broader than class assistance.

### From the 2024–2025 annual report
- 490 total families supported
- 84 types of activities
- 6,859 total sessions offered, broken down as:
  - 2,792 sports sessions
  - 1,504 fitness sessions
  - 1,489 nutrition sessions
  - 930 family support sessions
- ~30% year-over-year growth in both sessions and families

> **Note:** the two sources above do not reconcile. The challenge statement gives 600+ families and ~1,000 activities per month; the annual report gives 490 families and 6,859 sessions per year (~570 per month). Which set is current has not been confirmed with Love 21.

### Financials (2024–2025)

**Income: HKD 13,495,000**

| Source | % | Amount |
|---|---|---|
| Unrestricted funds (individuals, recurring, gala) | 49% | 6,700,000 |
| Restricted funds (corporate/foundation grants) | 49% | 6,630,000 |
| Other income | 2% | 165,000 |

**Expenditure: HKD 11,490,000**

| Category | % | Amount |
|---|---|---|
| Programme | 86% | 9,939,000 |
| Fundraising | 8% | 903,000 |
| Administrative | 6% | 651,000 |

### Prior year (2023–2024)
- 380 families, 5,400 classes (a 92% increase in classes that year)
- Income HKD 8,250,600; expenditure HKD 6,537,600
- Employment programme: 26 members trained, 120+ hours training, 6,000+ hours employment opportunities. *Prominent in 2023–24 but absent from the 2024–25 report.*

### Fundraising
- First-ever gala dinner, 2024, Hong Kong Football Club: 300+ guests, raised **over HKD 3.8M**, funding holistic support for **100+ new families**
- Income is heavily one-off and event-driven.

---

## 4. Stories and achievements

These are real and sourced. **Photo and name consent has not been confirmed with Love 21** — none of the names or images below are cleared for publication.

- **The plank story.** The CEO has long told the story of a member holding a 6-minute plank. Another member has since beaten it with an **8-minute** plank. The CEO frames this as members breaking down walls and inspiring peers to do the same.
- **Marissa** (testimonial from her mother). Mid-2024 her walking deteriorated rapidly — pace halved, unsteady gait, falling on flat ground. MRI, X-ray, and blood tests found no cause. After joining the sports development programme (specialised fitness training + bocce), her posture and speed improved day by day. After three months her speed and stability returned and **she could run again**.
- **Crystal** (testimonial from her mother). Fitness and nutrition programmes — planks, push-ups, wall sits, completing every task set. Integrated sports sessions improved balance, coordination, and thinking skills. Went on to train in bocce and **compete**. Her father became more involved too, creating more shared conversation at home.
- **Erica**, age 9, autism and CHARGE Syndrome (testimonial from her mother). Mealtimes were the family's greatest challenge due to extreme pickiness and chronic digestive issues. A gentle dietary adjustment plan introduced new textures and colours to support gut motility. Within months her diet diversified to include vegetable purées and fruits; physical health stabilised and mood and quality of life improved markedly.
- **Competitive sport is real, not aspirational.** Members have won medals at the **Asian Para-Karate Championships** in Bali. Teams are being prepared for the **Special Olympics**.
- **Employment programme** (2023–24). Members trained and employed as receptionists, assistant coaches, activity assistants, and administrative assistants. Two named testimonials: **Chan Siu Kei (陳紹岐)** and **Brian Ngan (顏建希)**, the latter progressing to an external social-enterprise internship.
- **Resilience story.** A fire destroyed their first centre in January 2023. With donated design, construction, and supplier support (Blue Stone Management, TCG, S+Techs, CBRE, Slaughter and May) they opened a larger two-floor centre in San Po Kong in October 2023. The board called it their "phoenix year."

---

## 5. Corporate partners and volunteering

**Morgan Stanley** (the hackathon host — and a real Love 21 partner). Their testimonial: **80+ employees** have volunteered across arts and crafts workshops, African drumming, healthy cooking classes, and Zumba fitness sessions. They also provide financial support.

**Ashurst.** Testimonial from **Ben Hammond**, Hong Kong office managing partner. Colleagues joined African drumming and Zumba alongside members and hosted Christmas workshops making ornaments and decorating trees. Engagement spans partners, associates, and business services staff, and has been extended to their clients.

**Volunteer recruitment currently runs through external platforms:** HandsOn Hong Kong and Time Auction.

### What a volunteer actually does

From two live HandsOn listings — *K-pop Dance Class Assistant* and *Mix Media Art Class Assistant*. The role is **class assistant, and the volunteer is an active participant rather than an observer**:

- "Assist the Sports Instructor in teaching a group of 8-12 children or people aged 6-45" with Down syndrome
- "lead a subgroup independently"
- "motivate and energize participants throughout the class"
- help the class "run smoothly and safely, while also ensuring that everyone is actively engaged"
- "Wear appropriate sports clothing and footwear as you will be actively participating"

Structural facts: group size **8–12**, participant ages **6–45**, typically **1 volunteer spot per session**.

### Eligibility

- Minimum age **16+**
- "Fluent in Cantonese (**preferred but not required**)" — English-only speakers are eligible
- A HandsOn Hong Kong account is mandatory

### How signup works today

Entirely off-site: create or log into HandsOn HK → select a session date → complete signup questions → "Full opportunity address and directions will be sent to you by e-mail after you sign up." **The venue address is withheld until after the volunteer commits.**

### Three separate ways in, with different owners

1. **Assist a class** — via HandsOn Hong Kong, booked per session
2. **Teach or support a weekly class** — the CSR page says "If you'd like to commit to teaching your own weekly class for our beneficiaries or supporting an already existing class, please contact our Programme Manager Kenneth at maggie@love21foundation.com"
3. **Internships** — what `/join-us/` actually offers: devising a sports programme, managing Love 21 Space operations, proposal writing, the nutrition programme, marketing and design. Requires "Fluent English and Chinese, written and spoken" and "Currently enrolled in university." Applications to jeff@ and maggie@, accepted year round and "tailored to suit your schedule."

> **Note:** the named Programme Manager ("Kenneth") and the published address (`maggie@`) do not match. Recorded as evidence that the current volunteer funnel is unmaintained, not as guidance on who to contact — that needs confirming with Love 21.

**Time Auction mechanic:** volunteers accrue hours that can be redeemed or bid for experiences.

> **Note:** unverified for Love 21 specifically — their Time Auction organisation page returned HTTP 403 and could not be read. The mechanic is described from Time Auction's own general material.

**Other named supporters (2024–25 acknowledgements):** American Club Foundation, American Women's Association, BlackRock, Bloomberg L.P., Clifford Chance, HSBC / The Hongkong and Shanghai Banking Corporation, HSBC Trustee, ICAP Securities, Morgan Stanley, Overlook Investments, PAG China Investment, Rusy and Purviz Shroff Charitable, Sau Ching Charity Foundation, St James' Place, The Community Chest of Hong Kong, The Hong Kong Jockey Club Charities Trust, The Royal Hong Kong Yacht Club Charity Foundation, UK Online Giving Foundation, Zonta Club of Hong Kong, and named individuals.

**Earlier CSR partners (2023–24):** Bloomberg, 10x10 HK, abrdn, BlackRock, Credit Suisse, Hang Seng Bank, Lululemon, Standard Chartered, EY, Segantii, HSBC, Clifford Chance, Allegis, Yale Club, Slaughter and May.

---

## 6. Existing digital presence

Researched across their website, socials, app stores, partner platforms, and public code repositories. The member-facing digital layer is essentially empty.

| Thing | Status |
|---|---|
| Website | WordPress. Donated by Five Software Pty Ltd (five.co, a low-code platform). Bilingual EN / 繁. |
| Member login | **Exists but appears dormant.** `/login/` has username/password, a register page, and password reset — but no visible member functionality behind it. |
| Events calendar | `/events` runs The Events Calendar plugin but the archive is **empty**; it just tells visitors to email the Programme Manager to arrange a class. |
| Volunteer signup | No on-site flow at all. **Three separate off-site paths with different owners** — class assistant via HandsOn Hong Kong, weekly-class volunteering by email, internships by email. See §5. The homepage advertises 1,000+ volunteer hours a month while offering no route to become one. |
| Donations | `/donate/` page, plus Give.Asia for peer-to-peer campaigns. |
| Points/rewards system | Members and parents earn points for participating in classes, redeemable for organic vegetables and health food products. **No evidence anywhere that this is digital.** Described only as a perk (mainly on their LinkedIn page); not in either annual report. Almost certainly manual. |
| Progress tracking | None found. Member progress lives in anecdotes and staff memory. |
| Custom app / CRM | None found. |
| Prior hackathon build | None found. |

**Existing site navigation:** Our Story, Our Reports, Our Volunteers, Media, Join Us, Board of Directors, Staff, Our Programmes (Sport / Nutrition / Family / CSR), Our Calendar, Contact Us, Login / Sign up, Donate.

> **Note:** "Join Us" is **internships only** — university students, fluent English and Chinese required. It is not volunteer signup, despite reading like it.

The organisation, both annual reports, and the existing site are **bilingual English / 繁體中文** throughout.

Members have Down syndrome, autism, and CHARGE Syndrome, with a wide range of literacy and communication needs.

---

## 7. How the hackathon is judged

Judges are Morgan Stanley technologists **plus Love 21's own staff**. Based on how Code to Give and Code for Good are run and scored, they reward:

1. **A real problem the NGO actually has** — not a clever idea nobody asked for.
2. **A working, responsive, low-bug prototype** — not a mockup.
3. **Demo and storytelling** — collaboration and impact are weighted, not just tech stack.
4. Gamification and engagement mechanics have recurred in past winning entries.
5. Winning prototypes are sometimes carried forward into real use, so sustainability is a genuine scoring signal.

---

## 8. Source notes

- **Primary:** Love 21 Foundation Annual Report 2024–2025 (uploaded PDF), and the Morgan Stanley Code to Give technical challenge slide.
- **Secondary:** Love 21 Annual Report 2023–2024 (`love21foundation.com/wp-content/uploads/2025/10/Love21-ANNUAL-REPORT_2324.pdf`); earlier reports from 2020–21 and 2022; love21foundation.com (including `/login/` and `/events`); their LinkedIn, Facebook, and YouTube; Give.Asia charity page; HandsOn Hong Kong partner profile; The Community Chest of Hong Kong member agency listing.
- **Volunteer research (31 July 2026)**, the source for the §5 volunteer detail:
  - HandsOn opportunity — *Be a K-pop Dance Class Assistant for People with Special Needs*: `volunteer.handsonhongkong.org/opportunity/a0CQ90000DFXgKwMQL`
  - HandsOn opportunity — *Be a Mix Meida Art Class Assistant for People with Special Needs*: `volunteer.handsonhongkong.org/opportunity/a0CQ90000FjeH0wMQE`
  - HandsOn partner profile: `volunteer.handsonhongkong.org/HOC__Organization_Profile_Page?oid=0012y000006Ag04AAC`
  - `love21foundation.com/join-us/` — internships
  - `love21foundation.com/csr/` — the weekly-class contact line
  - `timeauction.org/en/organization/love-21/178` — **returned HTTP 403, not read**; the Time Auction mechanic is from their general material only

---
---

# Part II — Build decisions

*Everything below was decided by the team on 31 July 2026. Unlike Part I, this is our design, not sourced fact.*

---

## 9. Stack and team split

| Layer | Choice | State |
|---|---|---|
| Frontend | React 19 + Vite 8 (rolldown), React Compiler on, oxlint | **installed** |
| ↳ routing, i18n, server state | react-router · react-i18next · TanStack Query | not installed yet |
| Backend | Node.js + Express 5, **CommonJS** | **installed** |
| Database / Auth / Storage | Supabase (Postgres) | client present, anon key |
| Payments | Stripe, **test mode only** | not installed |
| Email | Resend | not installed |
| PDFs | PDFKit + Noto Sans TC | not installed |
| Social | Instagram Graph API (Instagram Login) | not installed |

**The server is CommonJS and the client is ESM.** Not an oversight and not worth changing
mid-hackathon — just remember which half you are in: `require`/`module.exports` under
`server/`, `import`/`export` under `client/`. §28 has the full inventory of what is on disk.

**Access rule — important for everyone.** The frontend **never queries Supabase directly**. Every read and write goes through our REST API. One contract, one place to debug, and nobody has to reason about RLS policies. RLS is still applied to every table as defence in depth; the server holds the service-role key.

The browser *does* use `supabase-js` — but **for Auth only**, since that is how it obtains the JWT. "Don't talk to Supabase directly" and "don't import supabase-js" are different things.

**Auth.** Supabase Auth issues the JWT → client sends it as a `Bearer` token → we verify server-side. Roles are `volunteer` and `admin`, stored in `profiles`. **`role` must never be settable through signup**, or admin becomes self-serve.

**Posture: this is a demo.** Concerns that only bite a live deployment (real tax receipting, PDPO formalities, PCI scope, live payments) are recorded in §17 rather than built. The bar is that it works convincingly on 3 August.

> This posture is not passive. **§26 turns it into a working rule** — what gets cut when time runs short, what never gets cut, and the `DEMO-ONLY` flag that has to be stated every time something is built for the demo rather than for real use.

---

## 10. Site structure

A navbar and four destinations:

1. **Landing** — vision, mission, impact, ability-first storytelling
2. **News / Education** — three tabs: *updates* (NGO news + annual reports), *learn* (neurodiversity education), *voices* (moderated supporter and family stories). Detailed in §19.
3. **How to Help** — hub leading to Volunteer and Donate
4. **Admin** — private, for Love 21 staff

---

## 11. Backend architecture

### System overview

```
┌──────────────────────── Browser ────────────────────────┐
│  React SPA                    supabase-js               │
│  ─────────                    ──────────                │
│  TanStack Query cache         AUTH ONLY:                │
│         │                     login / session / refresh │
│         │ fetch + Bearer JWT          │                 │
└─────────┼─────────────────────────────┼─────────────────┘
          │                             │
          ▼                             ▼
┌─────────────────────────┐   ┌──────────────────┐
│  Node · Express 5 API   │   │  Supabase Auth   │
│  (holds ALL secrets)    │   └────────┬─────────┘
│                         │            │ issues JWT
│  routes → services      │            │
│         → data access ──┼────────────┼──┐
│                         │ service-   │  │
│  integrations           │ role key   ▼  ▼
│  stripe · resend        │   ┌──────────────────┐
│  instagram · handson    │   │ Supabase Postgres│
│                         │   │  Storage · RLS   │
│  cron jobs              │   └──────────────────┘
└──────┬──────────────────┘
       │ outbound          ▲ inbound
       ▼                   │
  Stripe · Resend     POST /api/webhooks/stripe
  Instagram Graph     (Stripe → us)
```

### Request pipeline

What `app.js` does today, in order:

```
request
  │
  ├─ express.json()                         ← global, no raw() carve-out yet
  ├─ CORS headers        hand-written, CLIENT_ORIGIN, OPTIONS → 204
  │
  ├─ GET /              banner
  └─ /api               routes/index.js  →  /api/health
        ▼
   not-found      ──►  404  { error, message }
   error-handler  ──►  status || 500  { error, message }
```

The target, as each piece lands:

```
request
  │
  ├─ pino-http          structured logging                    ── not built
  ├─ cors               CLIENT_ORIGIN allowlist               ── hand-rolled today
  ├─ rate limit         public POST routes only               ── not built
  │
  ├─ /api/webhooks/* ─► express.raw()    ← MUST precede json()   ── not built
  └─ everything else ─► express.json()
        │
        ├─ requireAuth       verify Supabase JWT → req.user    ── not built
        ├─ requireRole(...)  'volunteer' | 'admin'             ── not built
        ├─ validate(schema)  Zod on body / query / params      ── not built
        ▼
   ROUTE handler        thin — no business logic
        ▼
   SERVICE              all rules live here
        │               donations · volunteering
        │               content · engagement
        ├──► data access    (supabase service-role client)
        └──► integrations   (stripe / resend / instagram)
        ▼
   the resource   or   throw an error carrying .status
        ▼
   error middleware ──► { error, message }  (§29)
```

> **The `express.raw()` line is the one to get right the first time.** `express.json()` is
> currently global, so the moment a Stripe webhook route is added it will receive a parsed
> body and signature verification will fail — on a signature that is genuinely valid. The
> carve-out has to go in *above* `express.json()` in `app.js`, in the same PR as the route.
> §17 explains the mechanism; §27 lists it among the constraints that survive every cut.

Routes stay thin deliberately. Business logic in services means cron jobs and the admin "run now" endpoints call the same code path as a normal request — no duplicated logic between scheduled and manual triggers.

The existing `not-found` and `error-handler` implement the §29 error envelope, so new code
should **throw an error carrying a `.status` property** and let the handler format it, rather
than calling `response.status(...).json(...)` per route. Two places formatting errors is how
the envelope drifts. `config/supabase.js` already does exactly this — it sets `error.status =
503` and throws, and `health.routes.js` passes it to `next(error)`.

### Donation flow

```
Visitor      React         Express          Stripe      Supabase
  │            │              │                │            │
  │ amount     │              │                │            │
  ├───────────►│ POST /donations/checkout      │            │
  │            ├─────────────►│                │            │
  │            │              │ create Session │            │
  │            │              ├───────────────►│            │
  │            │              │ insert donation (pending)   │
  │            │              ├────────────────────────────►│
  │            │ {checkoutUrl}│                │            │
  │            │◄─────────────┤                │            │
  │  redirect to Stripe ──────┴───────────────►│            │
  │             pays with test card            │            │
  │◄──────── redirect /help/donate/thanks ─────┤            │
  │            │              │                │            │
  │            │   checkout.session.completed  │            │
  │            │              │◄───────────────┤            │
  │            │              │ verify sig                  │
  │            │              │ idempotency check           │
  │            │              │ mark succeeded + token      │
  │            │              ├────────────────────────────►│
  │            │              │ confirmation via Resend     │
  │
  │  each month: invoice.paid → new row + impact email
```

The donation row is inserted **before** payment, so abandoned checkouts stay visible rather than vanishing. The `access_token` written on success is what lets a guest donor reach their tracking page later without ever creating an account.

---

## 12. Frontend architecture

### Route tree

```
App
 ├── LocaleProvider   i18next · en / zh-Hant
 ├── AuthProvider     supabase-js session → JWT
 ├── QueryProvider    TanStack Query
 │
 └── Routes
      ├── PublicLayout   navbar · footer · language toggle
      │    │
      │    ├── /                  Landing (vision, mission, impact)
      │    │
      │    ├── /news              News hub
      │    │    ├── updates       NGO news + annual reports
      │    │    ├── learn         Down syndrome / autism education
      │    │    ├── voices        supporter + family stories (moderated)
      │    │    └── a/:slug       article detail
      │    │
      │    ├── /help              How to Help hub
      │    │    ├── volunteer         listings
      │    │    │    ├── :id          detail + signup
      │    │    │    └── me           profile · badges · certs [auth]
      │    │    ├── donate           amount → impact framing
      │    │    │    ├── thanks      ack + "now come see it"
      │    │    │    └── track/:t    where your money went
      │    │    └── wishlist         non-financial needs
      │    │
      │    └── /c/:slug          peer-to-peer campaign page
      │
      └── AdminLayout   requireRole('admin')
           ├── /admin             dashboard
           ├── /admin/articles    CRUD + SEO panel + Instagram publish
           ├── /admin/postings    CRUD opportunities
           │    └── :id/attendance  mark attended, log hours
           ├── /admin/impact      monthly impact figures
           ├── /admin/insights    article views + how people found us
           ├── /admin/wishlist    CRUD
           └── /admin/moderation  voices post queue
```

**None of the tree above exists yet.** `client/src/` currently holds the Vite starter plus
four empty or placeholder files under `components/` and `pages/` (§28). The route tree is the
target; whoever builds the shell creates it.

### Layering

```
pages/            route components — layout and composition only
features/         donations · volunteering · content · admin
   ├── api.js        calls into lib/apiClient
   ├── hooks.js      useQuery / useMutation wrappers
   └── components/   feature-specific UI
components/ui/    shared primitives: Button, Card, Field, Badge
lib/apiClient     fetch wrapper — base URL, Bearer injection,
                  error handling
lib/supabase      auth client ONLY
locales/          en/*.json · zh-Hant/*.json
```

Of this, only `pages/` and `components/` exist as directories, and both hold placeholders.
`pages/HomePage.jsx`, `components/Navbar.jsx`, `pages/PageNotFound.jsx` and
`pages/news/Articles.jsx` are name-claims, not code — `main.jsx` does not route to any of
them. Renaming or restructuring them costs nothing today and will cost merge pain tomorrow,
so settle the shape in the shell PR.

### The seam that unblocks the team

```
   React feature hooks
          │
          ▼
    lib/apiClient          ◄── single integration point
          │
    ┌─────┴─────┐
    ▼           ▼
 MOCK MODE   REAL API
 (fixtures)  (our Express)
```

`apiClient` is meant to be the only place the frontend knows a server exists: fixture
responses matching the agreed contract behind one env flag, so frontend work proceeds at full
speed while the backend is still being written, and cutover is a config change rather than a
refactor.

**It does not exist yet, and that makes it the highest-leverage thing on the board.** Until it
does, every frontend track is either blocked on real endpoints or writing `fetch` calls that
will have to be unpicked. §30 puts it on FE1's Day 1 ahead of anything visual, and §26 lists
the mock/real seam among the things that never get cut.

Two notes for whoever builds the admin UI. Every admin route must carry `requireRole('admin')` **server-side** — an `AdminLayout` guard is UX only and is not security. And `pages/` doing composition only isn't stylistic fussiness: it is what keeps several people building pages in parallel without merge conflicts in shared files.

---

## 13. Data model

**Identity** — `profiles` extends `auth.users`: role, full_name, email, phone, locale

**Donations**
- `donors` — keyed on **normalised email** (lowercased, trimmed, unique), so every gift from one address collates into one view. name, locale, nullable `profile_id`, `tracking_opt_in`, `access_token`, `last_completion_email_at`
- `donations` — `donor_id`, nullable `profile_id`, amount_hkd, type (`one_time` | `recurring`), designation, campaign_id, Stripe payment_intent / subscription / customer ids, status, is_anonymous, `message`, `referral_source` + `referral_source_other`. The last three are **optional, collected after payment** on the thanks page — never on the donate form, which stays as §15 specifies (§23).
- `sessions` — programme, bilingual title/description, starts_at, ends_at, location, capacity, `estimated_cost_hkd`, status (`scheduled` | `completed` | `cancelled`), `attendance_count`, `photo_url`, bilingual note, `attendance_source` (`manual` | `member_app` | `auto`), completed_at. **Also serves as the public events calendar** their current site advertises but leaves empty (§6).
- `donation_allocations` — donation_id, session_id, `donor_period_id`, `cost_at_allocation` (snapshot, never recomputed), status
- `donor_periods` — donor_id, period_start, period_end, status (`open` | `closed`), emailed_at, snapshotted totals. One open period per donor; each closed one is a permanent edition.
- `programme_costs` — programme, cost_hkd, effective_from. Admin-editable.
- `impact_periods` — month, total_sessions, families_served, per-programme breakdown, narrative. Feeds the aggregate impact page.
- `campaigns` — owner_profile_id, slug, title, story, goal_amount_hkd, cover_image, status, dates
- `wishlist_items` / `wishlist_pledges`

**Volunteering**
- `volunteer_opportunities` — bilingual fields, programme, location, dates, capacity, spots_filled, skills, status, `source` (`internal` | `handson`), handson_url
- `volunteer_signups` — status `applied` → `confirmed` → `attended`, hours_logged; unique on (opportunity_id, profile_id). Plus feedback columns (§23): `discovery_source` + `discovery_source_other` and optional `signup_motivation` captured after signup; `experience_rating`, `would_return`, optional `improvement_note`, `feedback_submitted_at` captured after attendance.
- `badges` / `volunteer_badges` — criteria_type (`signup_count` | `hours` | `programme_variety` | `streak`) + threshold
- `certificates` — issued record + PDF in Supabase Storage

**Content**
- `articles` — slug, category (`news` | `education` | `report` | `voice`), bilingual title/excerpt/body, cover image + bilingual alt, author, status, published_at, tags, instagram_post_id, `consent_status`. **Body is a JSONB block array**, not prose — see §21. Plus SEO fields: bilingual `meta_title` / `meta_description`, `og_image_url`, `canonical_url`, `reading_time_minutes` (§23).
- `community_posts` — supporter- and family-authored, `pending` → `approved` | `rejected`. Surfaced publicly as **Voices** (§21).
- `instagram_posts` — article_id, caption, media, alt_text, crop params, status, ig_media_id, error

**Engagement**
- `content_events` — article_id, `visitor_hash`, occurred_at. One event type, `view`. **No `locale` column** — per-language readership is deliberately not measured (§23). First-party analytics; no cookies, no third-party tracker.
- `audit_log`

> **No `subscribers`, `email_campaigns` or `email_sends` tables.** A newsletter with segment
> fields was previously specified and has been removed along with everything that fed it
> (§23). Transactional email still exists — the §15 donor-tracking messages — but there is no
> marketing list, so there is nothing to store. The optional donor and volunteer form fields
> live on `donations` and `volunteer_signups` above, next to the record they describe, rather
> than in a table of their own.

---

## 14. API surface

> **Built so far: `GET /`, `GET /api`, `GET /api/health`, `GET /api/health/supabase`.**
> Everything below is the target surface. §28 lists what exists; §29 fixes the shape each of
> these has to arrive in.

**Public** — `GET /api/articles`, `/api/articles/:slug`, `/api/community-posts` (approved only), `POST /api/community-posts`, `GET /api/opportunities`, `/api/wishlist`, `POST /api/wishlist/:id/pledge`, `GET /api/impact`, `GET /api/campaigns/:slug`, `POST /api/events` (batched article views — §23)

**Donations** — `POST /api/donations/checkout` → Stripe Checkout URL; `POST /api/webhooks/stripe`; `GET /api/donations/me`; `GET /api/donors/track/:token` (current edition) and `?period=<id>` (archived edition) — donor-scoped, no auth, bearer token; `POST /api/donors/recover-link`

**Sessions (public)** — `GET /api/sessions`, `GET /api/sessions/:id` — the events calendar

**Volunteer (authed)** — `POST /api/volunteer/signups`, `DELETE /api/volunteer/signups/:id`, `GET /api/volunteer/me`, `GET /api/volunteer/certificates/:id`

**Campaigns (authed)** — `POST` / `PATCH /api/campaigns`, `GET /api/campaigns/me`

**Admin** — CRUD `/api/admin/{articles,opportunities,wishlist,sessions,programme-costs}`; `POST /api/admin/sessions/:id/attendance`; `POST /api/admin/sessions/attendance/bulk`; `POST /api/admin/sessions/:id/cancel`; `GET /api/admin/allocations` + `PATCH /api/admin/allocations/:id`; `POST /api/admin/community-posts/:id/moderate`; `GET /api/admin/dashboard`; `POST /api/admin/instagram/{draft-caption,prepare-media,publish}` + `GET /api/admin/instagram/status` (§22); `GET /api/admin/insights` (§23); `POST /api/admin/volunteer-signups/:id/attendance` (triggers badge evaluation); `POST /api/admin/handson/sync` (**stub** — reads seeded data in the HandsOn contract shape; `HANDSON_MODE=live` is unimplemented, see §17); `POST /api/admin/demo/advance-donation/:id`

---

## 15. Donor tracking — the full flow

The flagship donation feature. Donors opt in at checkout, get emailed a tokenised page, and watch their gift move **pending → planned → completed**, with a second email when the session they supported actually happens.

```
DAY 0                          DAY 0–14                    DAY 14
─────────────────────────────────────────────────────────────────────
donate  →  allocate  →  email 1  ⟶  sessions happen  ⟶  period closes
   │          │            │           │                     │
 no account  instant    tracking    admin records         email 2
 no email    2 sessions   link      headcount+photo      the edition
 field       assigned                                         │
                                                              ▼
                                                     fresh edition opens
                                                     strip carries over
```

### No accounts, ever

**Donating never requires an account** — no signup, no password, no login, at any point. The tokenised link *is* the identity. Treat this as a hard constraint, not a default to be traded away later.

It also means the donate form collects **nothing Stripe already collects**. Checkout captures email and name natively and we read them off the webhook, so our form is just amount, one-time or monthly, and optionally a programme. The donor never types an email address into anything we built, yet the donor record still keys on it.

**One consent, and it covers one thing:**

| Consent | Default | Why |
|---|---|---|
| Updates about your own gift | **ticked** | Information about a transaction they just made |

A second, unticked **newsletter / campaigns** consent used to sit beside it. It went when the
newsletter did (§23). That removal makes the remaining default *more* defensible, not less —
ticked-by-default is only reasonable for information about a transaction the person just made,
and there is now no marketing consent riding along in the same box.

**Do not add a marketing tick back to this form.** If a mailing list is ever wanted, it is a
separate decision with its own PDPO statement, its own unsubscribe path, and its own row in
§23 — not a checkbox added to a donate flow whose entire premise is that it collects nothing
Stripe already has.

### Allocation — shared, but distributed

Many donors can support the same session (exclusivity is never claimed), **but donors are spread across the many sessions available** rather than clustered on one. Love 21 runs ~6,859 sessions a year — ~260 per fortnight — so supply is ample.

On `checkout.session.completed`, if gift-updates consent is on:

1. Normalise email, upsert the `donors` record — a returning supporter resolves to their existing record and token
2. `sessions_to_credit = clamp(amount_hkd ÷ cost_for_programme, 1, 10)` — a larger gift lights up more sessions; the cap stops a major gift rendering an unreadable list
3. Eligible sessions: `status='scheduled'`, starting between **now + 2 days** and **now + 14 days**, matching `designation` if chosen
4. Order by **fewest existing allocations**, then soonest start, random tiebreak — this is what spreads donors evenly
5. Snapshot `cost_at_allocation` so later metric revisions never rewrite what a donor was told
6. Open a `donor_period` if none is open; attach the allocations

If fewer eligible sessions exist than needed, allocate what's available and leave the rest `pending`; a nightly job retries.

### Collation by email

**One donor, one page, one email thread.** Everything keys on the `donors` record, not on individual gifts. A supporter who gave once in March, started monthly in May, and gave again at the gala sees one continuous story — not four disconnected links. The token is stable, so old email links keep working.

Allocation still runs **per donation**; only display and notification aggregate.

> **Normalise emails on write** — lowercase and trim. Otherwise `Bob@x.com` and `bob@x.com` become two donors and collation silently fails.

### Fortnightly editions

The page **starts fresh every two weeks** rather than growing without limit. Each fortnight is its own edition, like an issue of a periodical.

- A donor's first opted-in gift **opens a period**; allocations completing inside it attach to that period
- After 14 days a job **closes** it, snapshots totals, sends the edition email, opens the next
- `GET /api/donors/track/:token` defaults to the current edition; closed ones stay reachable via `?period=<id>`

Periods are **per-donor rolling windows**, not a global calendar — a shared fortnight would email someone who gave yesterday an almost-empty edition.

**Empty periods never close or email.** Nothing completed means the period rolls forward. Nobody gets a "nothing happened" update.

**Closing a period *is* the email send** — the batching rule and the fresh-page rule are the same mechanism. One-time donors get exactly two emails; monthly donors settle into one per fortnight regardless of volume.

### The persistent lifetime strip

Above every edition sits a strip that never resets. It preserves the cumulative-portfolio effect (charity: water's growing pin map — the strongest retention mechanic in the research) while the edition below stays short.

```
┌──────────────────────────────────────────────┐
│ 0 sessions supported · 2 on the way          │
│ HKD 3,000 given · supporter since 31 Jul     │
├──────────────────────────────────────────────┤
│ THIS FORTNIGHT · 31 Jul – 14 Aug             │
│                                              │
│ ▸ Floor curling      · 4 Aug  · San Po Kong  │
│ ▸ Nutrition workshop · 11 Aug · San Po Kong  │
│                                              │
│                       ← previous editions    │
└──────────────────────────────────────────────┘
```

Computed on read, not stored as counters:

- **Sessions supported** — `COUNT(DISTINCT session_id)` over **completed** allocations. Distinct, because two of a donor's gifts can land on the same session and counting rows would inflate it.
- **Total given** — `SUM(amount_hkd)` over `status = 'succeeded'` only, so failed and refunded charges never inflate a lifetime total
- **Supporter since** — earliest succeeded donation

**New-donor case:** a first-timer would otherwise see "0 sessions supported" while their sessions are two weeks out — deflating at peak engagement. Show both: *"0 supported · 2 on the way"*.

**Archived editions keep the strip live**, with the edition clearly labelled as past.

### How donors reach the page

1. **Thank-you page** — links straight through; the token exists as soon as the webhook fires, so they arrive before any email does
2. **Donation email** — tokenised link on payment success
3. **Edition emails** — **deep-linked to their own edition** (`?period=<id>`), not the current one. An email describing specific sessions must land on the edition describing them.
4. **Bookmark** — the token is stable, so the URL works indefinitely
5. **"Find my page"** — recovery form for guests who lost the email

**Recovery flow.** Without it a guest with no account has no route back. A form takes an email and sends the link to it — safe without authentication, since only the mailbox owner receives anything. Two requirements:

- **Identical response for known and unknown addresses** — *"If that address has supported us, we've sent a link."* A differing response turns the form into an oracle for testing whether a named person donated to a disability charity.
- **Rate limited**, or it becomes an email-bombing tool.

### Copy rule — non-negotiable

> ✗ "Your donation paid for this session"
> ✓ "Your gift helped make this session possible"

The session runs regardless, so exclusive attribution is the Kiva donor-illusion pattern. Identical mechanic, truthful claim.

### Page content by state

- **Pending** — what happens next, programme context, volunteer CTA. Peak engagement; never a generic placeholder.
- **Planned** — named session, date, location, programme
- **Completed** — headcount, photo, note

**The page shows amounts.** Accepted tradeoff: bearer-access means anyone the email is forwarded to sees it — and after collation that means *cumulative* giving history, not one gift. Mitigations: long cryptographically random token (not a sequential id), `noindex`, no enumeration endpoint.

### Edge cases

| Case | Behaviour |
|---|---|
| Lost the email | Recovery form, uniform response |
| No eligible sessions | Stays `pending`, nightly retry |
| Session cancelled | Allocations reassign, page updates silently — a swap isn't news |
| Payment failed / refunded | Never counts toward the lifetime strip |
| Same session twice | `DISTINCT session_id` prevents inflation |
| Demo day | **[DEMO-ONLY]** `POST /api/admin/demo/advance-donation/:id` forces every state |

---

## 16. Admin flow

Not really a flow — a **recurring rhythm plus a lot of automation**.

### The scale problem, and how it's handled

Love 21 runs **~6,859 sessions a year**: ~260 per fortnight, **~20 a day**. Because allocations spread across sessions, a large share carry donor interest.

One form per session would be 20 data-entry tasks a day for a small NGO — and when staff fall behind, donors freeze in `planned` and the completion email never fires. **The donor experience breaks silently, from the outside, where nobody at Love 21 would see it.**

Three mitigations:

- **Bulk attendance screen** — one page listing the week's sessions, headcount typed inline, photo optional. Twenty entries, one screen.
- **Filtered to sessions holding allocations** — sessions nobody is tracking need no completion data
- **Auto-complete fallback** — a session past its date by N days with no attendance completes anyway (`attendance_source = 'auto'`), and the donor page shows it without headcount or photo

> **Staff falling behind must degrade the page, never freeze it.** This also matters for handover: a prototype quietly requiring 20 admin actions a day is one Love 21 cannot actually run.

### Setup — once

- Create admin accounts (role assigned server-side; **never settable through signup**)
- Set `programme_costs` — placeholder ~HKD 1,450 until real metrics arrive
- Populate the session calendar, which doubles as the public events calendar

### The recurring loop

```
   ┌──────────────────────────────────────────────┐
   │                                              │
   ▼                                              │
schedule sessions ──► sessions run ──► record     │
(weekly)                              headcount   │
                                      + photo     │
                                          │       │
                                          ▼       │
                                    everything    │
                                    else is       │
                                    automatic ────┘
```

**Attendance entry is the only real obligation.** Everything downstream runs itself.

### What runs itself

| Automatic | Trigger |
|---|---|
| Donor record creation | Stripe webhook |
| Session allocation | Payment success |
| Period open / close | Fortnightly job |
| Tracking + edition emails | Period close |
| Retry of `pending` donations | Nightly job |
| Auto-complete overdue sessions | Nightly job |
| Reallocation after cancellation | Cancel action |
| Badge awards | Volunteer attendance |

Staff never assign a donation to a session, never decide who gets an email, never compute a total.

### Exception handling — occasional

- **Cancel a session** — allocations free up and reassign automatically; no email
- **Manually reassign an allocation** — for when the automatic choice is wrong
- **Adjust programme costs** — affects future allocations only; past ones snapshot `cost_at_allocation`, so nothing a donor was already told gets rewritten

### The rest of the admin surface

- **Articles** — CRUD with a block editor, an SEO panel, and the Instagram compose/preview/publish panel (§21–23). **Import-from-Instagram is deferred** — outbound publishing only, for now.
- **Volunteer postings** — CRUD; marking attendance triggers badge evaluation
- **Wishlist** — CRUD on non-financial needs
- **Voices** — moderation queue, `pending` → approve/reject before anything is public
- **Impact** — monthly figures behind the aggregate impact page (§13 `impact_periods`), which nothing else edits
- **Insights** — per-article views and daily visitors, plus donor and volunteer discoverability (§23). There is no email-campaign composer: the newsletter and its segment fields were cut, so there is no list to compose to
- **Dashboard** — metrics first, work queue below (§23)
- **HandsOn sync — a STUB (§17)**, not an integration. It pulls opportunities (with `capacity` / `spots_filled`) and hours matched on email from a seeded local response, so the screen renders and the shape is right; nothing reaches HandsOn. **External hours therefore only appear to count toward badges.** `HANDSON_MODE` is the seam; `live` is unimplemented. HandsOn bookings and local interest registrations are shown as **separate figures, never summed**.

### Demo controls — **[DEMO-ONLY]**

`POST /api/admin/demo/advance-donation/:id` forces a donation through pending → planned → completed. Every cron job also gets a **"run now"** button — "we scheduled it for 3am" is not a demo.

> Flagged per §26. The advance endpoint has no real-world use and must be removed or admin-gated before any live deployment; the "run now" buttons are legitimate operational controls and stay.

---

## 17. Integration setup notes

### Stripe — test mode — **[DEMO-ONLY]**

Checkout Sessions for one-time and monthly recurring. Webhook handles `checkout.session.completed`, `invoice.paid`, `payment_intent.payment_failed`, `customer.subscription.deleted`, with a processed-event table for idempotency.

> **Trap:** `express.raw()` must be mounted on the webhook route *before* `express.json()`, or signature verification fails.

**Use hosted Checkout, never a custom card form.** Hosted Checkout keeps card data entirely off our servers. Reaching for Stripe Elements to make it prettier changes our PCI position for real — team rule.

Local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe` — the server
listens on **3000** (§28), and the Vite proxy points there too.

### Resend — email

> **Constraint to plan around now, not on day 4.** Sending from `love21foundation.com` requires DNS verification we do not have. The sandbox domain only delivers to our own verified addresses, so "personalised emails to users" can only be demoed to ourselves.

The confirmation email is deliberately **not** shaped like a Hong Kong s.88 tax receipt. Love 21 is a registered charity and donors expect valid tax receipting; ours must clearly not resemble one.

### Instagram — real publishing, no app review needed

Use **Instagram API with Instagram Login** (launched July 2024). It talks to an Instagram Professional account directly — **no Facebook Page, no Business Manager**.

Meta's App Review only gates acting on *other people's* accounts. In **Development Mode**, an app can already publish to any account holding a role on it (admin / developer / tester), and that path is fully functional, not a sandbox. So a throwaway account we control posts for real, today.

Setup:
1. Create an Instagram account, switch it to **Professional** (free, in-app)
2. Create a Meta app, add the Instagram product
3. Assign that account a role on the app; leave the app in Development Mode
4. Exchange the short-lived token for a long-lived one (60 days — outlasts the event)
5. Permission needed: `instagram_business_content_publish`

Publishing is two steps: `POST /{ig-user-id}/media` → container id → `POST /{ig-user-id}/media_publish`. Reverse direction: `GET /{ig-user-id}/media` imports recent posts as draft articles — **deferred, outbound publishing only for now.** The editor experience built on top of this is §22.

> **Hard constraint:** Meta cURLs the image from a public URL — direct byte upload is not supported, so `localhost` fails. Admin uploads to a **public Supabase Storage bucket** and we pass Meta the resulting public object URL. No ngrok needed.

Also: **JPEG only** (not PNG). Cap is 100 posts per rolling 24h. Container status polling only matters for video.

### HandsOn Hong Kong

**Investigated 31 July — the day-one check is done, do not repeat it.**

HandsOn Hong Kong runs **HandsOn Connect on Salesforce**. The `HOC__` URL namespace follows Salesforce's managed-package convention, and the record IDs are Salesforce key prefixes (`001` = Account, `a0C` = a custom object).

**No publicly documented API could be found.** Stated at that strength deliberately, because it is an absence claim. Verified directly: `robots.txt` 404s; `sitemap.xml` covers only their marketing pages; `handsonconnect.com` documents no API, feed, RSS, or iCal; targeted searches surfaced only Salesforce's unrelated "Connect REST API". Not verified: HandsOn Connect's developer documentation portal was never located and neither vendor was contacted, so login-gated docs cannot be ruled out.

What the product *does* document — Salesforce reports, and the LlamaSite WordPress plugin — needs credentials **inside HandsOn HK's Salesforce org**. So the blocker is **ownership, not technology**: that org belongs to HandsOn HK, not Love 21 and not us. Real access means them provisioning a Connected App or integration user, which is a relationship conversation, not a three-day task.

**Do not scrape.** It would work — the opportunity pages return structured content to a plain fetch — but it is keyed to rotating Salesforce record IDs, no ToS has been reviewed, and it targets a partner NGO whose relationship Love 21 depends on for recruitment, in front of judges who include Love 21 staff.

#### Two directions, not one integration

| Direction | Purpose | Mechanism |
|---|---|---|
| Opportunities **in** | show sessions on our site, with capacity | `GET /handson/opportunities` |
| Hours **out** | HandsOn hours count toward badges and certificates | `GET /handson/signups` |

#### Decision: **stub it, for now** — **[DEMO-ONLY]** under `HANDSON_MODE=mock`

> **The sync is a STUB.** Build the smallest thing that lets the volunteer surfaces render
> and the provenance stay honest — a fixed local response behind the contract shape below.
> **Do not build a full mock HandsOn service.** No scheduler, no incremental sync, no
> conflict resolution, no `live` implementation. The stub returns seeded data and that is
> all it does.

Define the contract HandsOn would plausibly expose, and have the stub answer in that shape, so the consumer is written once and going live later becomes credentials, a base URL and a real implementation behind the same call:

```
GET  /handson/opportunities   → id, title, programme, datetime, location,
                                capacity, spots_filled, url
GET  /handson/signups         → { email, opportunity_id, hours, status }
```

`HANDSON_MODE=mock|live` stays as the seam, but understand what is behind each side today: **`mock` is a stub, `live` is unimplemented and will throw.** Keep the flag anyway — §26 lists it among the seams that never get cut, and a stub behind a seam is still cheap to replace, whereas a hardcoded fetch scattered through the volunteering feature is not.

Stub data is seeded from the two real listings in §5 so the field shapes stay honest. `volunteer_opportunities.source` and `handson_url` (§13) already carry provenance.

**What the stub does not do**, and what the real version must:

- No scheduled or incremental sync — it answers when called, nothing polls
- No reconciliation. A second call overwrites; nothing merges, diffs or detects deletions
- No `capacity` / `spots_filled` freshness. The numbers are seeded constants, so the
  "last synced" timestamp is decorative until a real call exists
- No hours ingestion in any meaningful sense — `GET /handson/signups` returns seeded rows,
  so **external hours do not really count toward badges**; they appear to
- No auth, no retries, no rate-limit handling, no error taxonomy

Every one of those is a real-version requirement, and none of them is worth building against a contract nobody has confirmed (§20.12).

> **Demo-integrity rule.** Describe this as *"a stub built against the shape HandsOn's API would take; a real sync needs their credentials and an implementation."* Never as a live integration, and never as a working sync — it does not sync, it answers. In particular, do not say HandsOn hours count toward badges: on the stub they do not. Love 21 staff are on the judging panel and know how their own recruitment works — an unqualified claim that collapses under one question costs far more than the qualifier does.

#### UX for `source: handson` listings — mirror, capture interest first

- The full listing renders on our site, same as an internal one
- **Primary** action registers interest with Love 21 directly, so we keep the lead
- **Secondary** link completes the booking on HandsOn, labelled plainly so the account requirement is not a surprise

The volunteer page exists to remove friction, and HandsOn's account wall is exactly the friction §5–6 diagnose — §5 records that an account is mandatory and the venue address is withheld until after commitment; §6 records that there is no on-site route at all. Capturing interest first means Love 21 learns who wanted to come even when someone bounces off it.

#### Capacity on the admin side

The contract carries `capacity` and `spots_filled`, so admin sees fullness for HandsOn-sourced sessions as well as internal ones, with no manual tracking. **Against the stub these are seeded constants** — they render, they do not update.

> **Never sum the two numbers.** For a `source: handson` opportunity, `spots_filled` is authoritative bookings *in HandsOn's system*; our interest registrations are leads that may never convert there. Render them as distinct figures — *"HandsOn: 1/1 booked · 3 interested here"* — or staff will read four people where there is one. Show the last-synced timestamp too: the number is only as fresh as the last sync.

Under `HANDSON_MODE=live`, `GET /handson/signups` is the one call needing real partner access, and **nobody has verified Love 21 hold it** — see §20.12. That is exactly why it is a stub rather than a mock of something we might soon replace: there is no confirmed API to converge on, so effort spent making the fake faithful is effort spent on a guess. The stub makes the feature demo regardless.

### Certificates — CJK

PDFKit with a **static Noto Sans TC TTF** registered via `doc.registerFont()`. PDFKit subsets automatically, embedding only the glyphs actually used, so a bilingual certificate lands at ~100–300KB instead of the 15–20MB a full CJK font would cost.

Use the **static TTF** — not a variable font, not `.ttc`. Without an embedded CJK font, Chinese renders as tofu boxes (□□□). No extra library or headless browser required.

Badges and certificates are framed as **recognition and hours logged** — CV-usable, corporate CSR trackable — rather than points to collect. Gamifying volunteering with disabled people reads as trivialising if framed as "collect all ten", and Love 21 staff are on the judging panel.

---

## 18. Known risks — carried deliberately

These were raised, discussed, and **kept as-is**. They are not oversights.

1. ~~**The community tab sits against the stated scope boundary.**~~ **Resolved by reframing.** The tab ships as **Voices** — supporter- and family-submitted stories celebrating ability — which reads as showcase (§1 pillar 1) rather than a member service. Same feature, same moderation gate; the scope objection goes away. Kept in this list so the reasoning survives.
2. **Anyone can create a fundraising campaign** in a registered charity's name, with no approval gate. In any real deployment this is an abuse vector: fraud, offensive content, brand damage. Accepted for the demo; the fix is a `pending_approval` state plus one admin screen.
3. **Donation tracking is attribution, not fund accounting.** Money is fungible, 49% of Love 21's income is restricted funds already committed, and every session runs regardless of any individual gift. The shared-and-distributed allocation model plus the §15 copy rule keeps this truthful — but the claim must never harden into "your money paid for this."
4. **Four identity paths** — volunteer, admin, guest donor, campaign owner — are the single largest source of demo-day bugs.
5. **Story consent is unconfirmed** for every name in §4. Seeding full names, except **first-initial for minors** (Erica, 9, whose medical details are described). The adult employment testimonials are already public in the annual report.
6. **A public demo can look like it takes real donations.** Donation surfaces carry a persistent "DEMO — no real payments" banner, and live Stripe keys are never used.
7. **Scope versus demo slot.** The demo is likely 5–10 minutes. A meaningful fraction of this feature list will never be seen by a judge. **This is the risk §26 exists to manage** — it is the reason demo viability outranks completeness, and the reason the cut list in §26 is written down in advance rather than improvised at 2am on 2 August.
8. **Interest registered with us is not a booking on HandsOn.** For `source: handson` sessions we capture the lead first and link out second (§17), so a volunteer can register interest here and never complete the booking there — leaving them absent from the roster HandsOn actually operates from. Love 21 must treat our interest records as leads to follow up, never as confirmed attendance. Mitigation is wording on the confirmation, not code.
9. **The HandsOn integration is a stub built against a contract, not a live API.** No publicly documented API could be found, and access would need HandsOn HK to provision it (§17). It answers from seeded data with no scheduling and no reconciliation, so **hours volunteered through HandsOn do not really count toward badges — they only appear to.** Describing it to judges as a live sync would not survive one question from a Love 21 staff member.
10. **`POST /api/events` is unauthenticated with no human in the loop.** It is the only write of that kind, so article view counts are inflatable by anyone who finds it. Rate limiting per IP, an `article_id` existence check and a batch cap blunt it; none of that eliminates it. Accepted for a demo — recorded so an odd number later is a known cause, not a mystery. Since §23 narrowed the payload to a single `view` event with no `locale`, the endpoint's whole accepted shape is an article id — which at least keeps the abuse surface to one number.
11. **No consent gate on Instagram publishing.** Raised and deliberately set aside: an NGO publishing its own material is assumed to hold consent for it, and a gate would add friction to the flow we most want to demo. `articles.consent_status` still exists and still displays in the editor, but blocks nothing. Photo and name clearance stays a §19 pre-production item.
12. **Social scrapers will see blank cards.** The site is a client-rendered SPA, so Facebook, LinkedIn and WhatsApp — none of which execute JavaScript — cannot read OG tags injected at runtime. Shared article links render without preview images. Sensible static defaults ship in `index.html`; the real fix is prerendering, and it is a §19 item rather than a demo-day one.

---

## 19. Pre-production checklist

Out of scope for the hackathon; required before any real use.

> **This list is where the `DEMO-ONLY` flag comes to rest.** Anything built for the demo (§26) adds a line here at the time it is built, not at handover. `grep -rn "DEMO-ONLY" .` is the codebase-side index; the §26 register is the document-side one.

- [ ] Remove or admin-gate `POST /api/admin/demo/advance-donation/:id` and any other force-state control (§16)
- [ ] Clear every `DEMO-ONLY` marker in the codebase, or convert it to a tracked issue
- [ ] Live Stripe keys on Love 21's own account and legal entity
- [ ] Valid Hong Kong s.88 tax-deductible receipting
- [ ] PDPO collection statement and consent for all personal data
- [ ] Campaign approval workflow before fundraisers go public
- [ ] Meta app review, or tester role for Love 21's real Instagram account
- [ ] DNS verification on `love21foundation.com` for email
- [ ] Photo and name clearance for every story in §4
- [ ] Accessibility audit (WCAG 2.2 AA) — an inaccessible site for a neurodiversity charity is the one flaw this panel cannot miss
- [ ] Volunteer safeguarding screening, if Love 21 requires it — classes include participants from age 6 (see §20.5)
- [ ] Replace the HandsOn **stub** (§17) with a real integration, or remove the surfaces that imply one. Needs partner credentials (§20.12), plus everything the stub skips: scheduling, reconciliation, real `capacity` / `spots_filled`, genuine hours ingestion, auth, retries and error handling. Until then, **HandsOn hours must not be presented as counting toward badges or certificates**
- [ ] PDPO collection statement at the point of collection — the donor thanks-page fields, the volunteer signup and post-attendance forms, and Voices. Hong Kong law requires stating what is collected and why *where it is collected*. §23 narrows this to two things, which makes the statement short and honest rather than boilerplate
- [ ] Disclose the article view counting (§23) — no cookie banner is required, since nothing is stored client-side, but a privacy note should still say that views and a daily-rotating visitor hash are recorded
- [ ] Prerendering or SSR so social scrapers read OG tags (§18.12)
- [ ] `audit_log` viewer — the table exists in §13 and nothing reads it
- [ ] Native-speaker pass over all zh-Hant copy, especially Instagram captions, which publish under the charity's name and cannot be quietly corrected
- [ ] Replace the seeded content in `server/db/seed/` with staff-authored records through the admin path. The 14 articles, 4 Voices and the 2024–25 impact row stand in for a real CMS and real reporting: **name and photo consent is unconfirmed for every story** (§18.5), and which stat set is current is unconfirmed (§20.1). Six of the fourteen articles have no zh-Hant translation and fall back to English

---

## 20. Open questions

1. **Which stat set is current?** §3 flags that the challenge statement (600+ families, ~1,000 activities/month) and the annual report (490 families, 6,859 sessions/year) do not reconcile. Seed data needs one. Recommending the annual-report set — internally consistent, and it has a per-programme breakdown that charts well. *Needs confirming with Love 21.*
2. **Name and photo clearance** for the §4 stories.
3. **Does anyone on the team write Traditional Chinese?** Machine-translated zh-Hant shown to native-speaker Hong Kong judges reads worse than honest partial coverage. **Now more urgent, not less:** a full bilingual seed was chosen (§21), and Instagram captions ship zh-Hant publicly under the charity's name (§22) where a bad translation cannot be quietly corrected the way a web page can.
4. **What demographic data does Love 21 actually want?** `age_band` and `district` were dropped, and §23 has since narrowed collection to two things — the optional donor and volunteer form fields, and article view counts. Collecting demographic data about people orbiting a disability charity carries real privacy weight, so if Love 21 wants any of it, we build what they ask for rather than what we guessed. **The current answer is: nothing beyond those two.**
5. **Is there a safeguarding or police-check requirement before a first session?** Nothing public states one, but §5 records that classes include participants **from age 6**, and organisations working with minors and adults with disabilities normally screen volunteers. If a check exists, our signup flow currently skips a mandatory step — HandsOn may be performing it today. *Needs confirming with Love 21; this one can invalidate the volunteer flow rather than just decorate it.*
6. **Is induction or training required before a first session?** The HandsOn listings imply a volunteer can turn up and assist immediately. If Love 21 in fact runs a briefing, the flow needs a step between signup and attendance.
7. **Who actually owns volunteer intake?** §5 records that the CSR page names "Kenneth" at `maggie@`. Whoever we route on-site signups to needs to be the person who reads that inbox.
8. **Do corporate groups route through HandsOn, or direct?** `/csr/` gives no detail, and it determines whether corporate volunteering is a separate flow or the same one.
9. **What does a session actually cost, per programme?** `programme_costs` currently holds a placeholder ~HKD 1,450, derived by dividing 86% programme spend (HKD 9,939,000) by 6,859 sessions. It drives how many sessions a gift is credited with, so a real figure — and the spread between a bocce session and a dietitian consult — would make allocation meaningful rather than indicative. *Needs Love 21.*
10. **How many days after a session before auto-complete fires?** Too short and we lose photos staff would have uploaded; too long and donors wait. Suggesting 5 days — a working week of grace — but Love 21 knows their own rhythm.
11. **Should cumulative giving history be visible on a bearer-token link?** Collation means a forwarded tracking link exposes everything an address has ever given, not one gift. Standard donor-portal behaviour, and currently accepted — flagged so it stays a decision rather than a side effect.
12. **Do Love 21 staff have HandsOn partner-portal access with export or API rights?** Under `HANDSON_MODE=live` this is the single dependency the integration cannot fake: without it there is no source data, and hours volunteered through HandsOn cannot count toward badges or certificates (§17). HandsOn Connect does provide partner organisations with reporting and export — whether Love 21's own account has it is unverified.

> **Resolved this session:** Meta App Review is *not* required — Development Mode plus a demo Professional account publishes for real (§17). Donation opt-in default resolved via the two-consent split (§15). The community-tab scope objection is resolved by the Voices reframe (§18.1, §21).

---

*§§21–23 detail three surfaces the sections above reference but do not specify.*

---

## 21. News page

Three tabs at `/news`, plus an article detail route at `/news/a/:slug` — the `a/` segment keeps slugs from colliding with tab names.

### The tabs

| Tab | Carries |
|---|---|
| **Updates** | NGO news and annual reports |
| **Learn** | neurodiversity education — the tab doing the most work for §1 pillar 2 |
| **Voices** | supporter- and family-submitted stories, moderated before publication |

**Updates** holds two kinds of content that must not look alike. News posts are articles. Annual reports are not — nobody reads a 40-page PDF in a browser, so a report renders as a download plus the §3 figures pulled out: 6,859 sessions, 490 families, 30% YoY growth, and the 86% programme-spend share, which is the number donors actually look for.

**Learn** is evergreen and undated: what trisomy 21 is and why the charity is called Love 21, autism and neurodiversity basics, CHARGE Syndrome (Erica's diagnosis, §4), person-first vs identity-first language, and what to expect as a first-time volunteer. Every Learn article ends pointing at the volunteer flow — that is the curiosity-to-signup path §1 asks for, and the reason this tab earns depth over the others.

**Voices** is the reframed community tab (§18.1). Approved posts only, with a submission form capturing name, relationship, story, optional photo, an explicit consent checkbox, and an optional email used solely to notify the author on publication and never displayed. The submitted state says plainly that a staff member reviews it first — do not imply it published.

### Article bodies are blocks, not prose

`articles.body_en` / `body_zh` are **JSONB arrays of typed blocks**, not markdown or HTML strings.

```js
[
  { type: 'paragraph', text: 'Inline **markdown** and [links](https://…) only.' },
  { type: 'heading',   level: 2, text: '…' },
  { type: 'image',     url: '…', alt: '…', caption: '…' },   // alt required
  { type: 'quote',     text: '…', attribution: '…', consentRef: '…' },
  { type: 'stat',      value: '6,859', label: 'sessions offered', sublabel: '2024–25' },
  { type: 'mythFact',  myth: '…', fact: '…' },
  { type: 'embed',     provider: 'instagram', postId: '…' }
]
```

Three reasons this beats a rich-text field. Love 21 staff are not developers, so a form-driven editor ("add paragraph / image / quote / stat") beats both a markdown textarea and a WYSIWYG. Nothing ever renders raw HTML, so `dangerouslySetInnerHTML` never appears — `paragraph` text goes through `react-markdown` with raw HTML disabled. And `mythFact` and `stat` become first-class editorial elements, which is what lets Learn avoid the uniform card wall the design rules ban.

`image.alt` is required by the block schema. An inaccessible site for a neurodiversity charity is the one flaw §19 says this panel cannot miss.

### Shared behaviour

One featured story breaking the grid rather than a uniform card wall; tag filtering; real skeleton, empty and error states on every list. **No newsletter capture** — it was specified here and has been cut (§23), so the hub has no email field. Tab and filter state lives in the URL (`?tag=`, `?q=`, `?page=`) so links are shareable and the back button works.

**Full bilingual seed** — EN and 繁體中文 for every UI string and every seeded article, with EN fallback where zh is genuinely absent. See §20.3, which this decision makes more pressing.

---

## 22. Instagram authoring — the admin panel

§17 covers the API mechanics. This is the editor experience built on top, inside `/admin/articles/:id`: **compose → crop → preview → edit → publish**, manual trigger only, nothing automatic.

**This is the one feature that cannot run on mock fixtures.** Meta will not accept a browser-origin call and the long-lived token cannot ship to the client, so it brings up the first real Express routes.

### Caption composition — two modes

**Manual.** A textarea prefilled from the article: title, excerpt, tags converted to hashtags plus fixed ones (`#somuchability`, `#Love21`). Always available.

**AI draft — locally hosted model.** A button calls our server, which calls a local Ollama instance with the article's title, excerpt and flattened body. Returns JSON — `caption_en`, `caption_zh`, `hashtags[]`, `alt_text` — requested with Ollama's `format: json`, then **Zod-validated before it reaches the UI**. A local model is still untrusted input.

> **Use `qwen2.5:7b-instruct`, not Llama 3.1.** Captions are bilingual and Qwen is materially stronger at Traditional Chinese. See §20.3 — a bad zh-Hant caption is public under the charity's name and cannot be quietly corrected.

> **Degradation is a build requirement, not a nicety.** Ollama will not be running on a judge's machine. The server probes the local endpoint and exposes availability; when it is down the AI button renders disabled with "local model unavailable — compose manually", and every other part of the panel keeps working. The demo must never depend on a background process nobody started.

### Bilingual caption

One post carrying both languages, the common Hong Kong NGO pattern — English block, Chinese block, hashtags last. Per-language character counts against the 2,200 cap and 30-hashtag limit. Instagram folds the caption at roughly 125 characters, so whichever language goes second sits below the "… more" line; a lead-language toggle flips the order.

### Preview and edit, side by side

Live-updating on every keystroke, crop change and language toggle.

- **Feed preview** — avatar and handle row, cropped image, action icons, caption truncated at the fold, hashtags styled
- **Grid preview** — a 3-tile profile strip. Instagram crops the grid differently from the feed, so a post can read fine in one and be wrong in the other, and staff only discover that after posting.
- **Crop tool** — 1:1 / 4:5 with a safe-area guide. Article covers are 16:9; unattended posting would cut faces off. This step is mandatory, not decorative.
- **Alt text field** — Instagram supports it, and this charity of all charities should use it.

Everything stays editable up to the moment of publish. Nothing generates and sends in one step.

### Publishing and recovery

The confirm dialog states plainly that this posts to a **live public account**. §18.6 puts a "DEMO — no real payments" banner on donation surfaces; the logic inverts here — be loud that this one *is* real. It is the only surface where a mis-click has effects outside the app.

`instagram_posts` tracks `draft` → `publishing` → `published` | `failed`, surfacing Meta's actual error text with a retry and linking to the live post on success. Failures are routine in practice — aspect ratio, unreachable URL, expired token — so swallowing them would make the feature feel broken. Error strings are scrubbed so a token never lands in a message.

---

## 23. SEO, analytics and feedback

### What the page emits

Per article: `<title>` and meta description from the bilingual SEO fields (falling back to title and excerpt), canonical URL, `hreflang` alternates for `en` / `zh-Hant` / `x-default`, full OpenGraph and a `summary_large_image` Twitter card, and JSON-LD `Article`. Site-wide: JSON-LD **`NGO` schema** carrying name, URL, logo, the San Po Kong address, phone, email and `sameAs` socials (§2) — one write, and it is what earns a registered charity a proper knowledge panel. Plus `robots.txt` and a `sitemap.xml` covering both locale variants.

Admin-side, the article editor shows a **live SERP and social-card preview** with character counters, and an **SEO gaps list** — published articles missing a meta description, OG image or image alt text. Non-technical staff will not hand-tune meta tags they cannot see, and the gaps list is what actually gets fields filled in.

> See §18.12: social scrapers do not execute JavaScript, so runtime-injected OG tags are invisible to them until prerendering exists.

### What we collect, and how

> **Two things. That is the whole list.**
>
> 1. **Optional form fields from volunteers and donors** — always after the action, never as a gate.
> 2. **Views and daily visitors on a specific article** — the article, not the language
>    version of it.
>
> Everything else is out of scope by decision, not by omission. A newsletter with segment
> fields, UTM and referrer capture, share and CTA-click tracking, read-through measurement,
> and an EN vs 繁體中文 readership split were all specified here previously and have been
> **removed**. If a surface
> seems to want one of them, that is a scope change to raise with the team — do not add a
> field, an event type or a column on the way past.

**1 · Optional forms — donors.** Two fields on the thanks page, **after payment, never on the donate form**, which stays exactly as §15 specifies. `referral_source` (friend · social · employer · event · search · other) and a private `message` — "why I gave", staff-only, never published. Both skippable; the page works if neither is filled.

**1 · Optional forms — volunteers.** Deliberately the same shape, at two moments. After signup: `discovery_source` (handson · time_auction · love21_site · social · friend_colleague · employer_csr · school · search · other) plus an optional staff-only `signup_motivation`. After attendance: `experience_rating`, `would_return`, and an optional `improvement_note`. All optional, all after the fact.

`referral_source` and `discovery_source` are load-bearing precisely because the passive half is so narrow: **they are the only thing that answers how someone found Love 21.** Article view counts cannot, and nothing else we collect tries to.

**Voices submissions** are content, not data collection — a supporter writing a story for publication, covered in §21 and moderated per §16. They are not part of this section's two-item list.

> **Do not conflate `discovery_source` with `volunteer_opportunities.source`.** The latter records where the *listing* came from (`internal` | `handson`); the former records how the *volunteer* found it. Someone can discover a HandsOn-sourced listing through a colleague.

> **Delivery constraint.** §17 records that Resend only delivers to our own verified addresses until DNS is verified, so an emailed feedback request cannot reach a real volunteer. The **in-app prompt is primary** — attended sessions surface a feedback card on the volunteer's profile, beside the badge and certificate moment. Email is a production nice-to-have, not a demo dependency.

Discoverability is the highest-value question here. §5 records that volunteer recruitment runs through HandsOn, Time Auction and corporate CSR, and Love 21 has no way of knowing which actually delivers people.

### Passive collection — `content_events`

**One event: `view`, fired on article mount.** No `read_complete`, no `share`, no `cta_click`, no scroll or engagement measurement — the question is *how many people came to this article*, and one event answers it. Batched and sent with `navigator.sendBeacon` so nothing blocks navigation.

Each row carries `article_id`, `visitor_hash` and `occurred_at`. That is the whole row.

**No `locale` either.** An EN vs 繁體中文 readership split was specified here and has been **removed**: an article is one article, and we count views of it, not of a language version of it. The bilingual seed still exists and both languages still render — we simply do not record which one was read. **No `utm_*`, no `referrer_host`** either; all three were specified before and are gone. Do not reintroduce any of them as "just one more column", because each is a separate thing to disclose under PDPO and to defend if asked.

**Visitor counting — daily-rotating derived hash.** Both views and visitors are wanted, and visitors need an identifier:

```
salt         = hmac(SERVER_SECRET, utc_date)     // derived, never stored
visitor_hash = sha256(ip + user_agent + salt)
```

Deriving the salt from the date means **no rotation job and no salt table** — deterministic within a day, unrecoverable across days by construction. The raw IP is hashed and discarded inside the same request; never stored, never logged. Express needs `trust proxy` set correctly to see the real client IP.

No cookies, no `localStorage`, no `sessionStorage`, no fingerprinting — therefore **no consent banner**. That is the entire reason for choosing this over a persistent client-side ID.

> **Aggregation trap.** Daily visitor counts **cannot be summed across days** — adding 30 days of daily uniques overcounts anyone who came twice. Visitors render as a per-day series or a daily average, never one total over a range. Views sum correctly; visitors do not. The range filter makes this live, not theoretical.

Label the UI to match the method: **"views" and "daily visitors"**, never a bare "visitors".

**Retention: keep everything.** No deletion job; at Love 21's volume the table stays small and old data stays queryable. The article stats carry a range filter — month · 3 months · 6 months · year · all time — with `occurred_at` indexed and filtering done in the query.

**Never collected:** Google Analytics, Meta pixel or any third-party tracker; analytics cookies or client storage; raw IPs in storage or logs; any identifier surviving the day; cross-site identifiers or fingerprinting; demographic inference; **the reader's language** — no `locale` on a view, so no EN vs 繁體中文 split; referrer URLs or hosts; UTM or campaign parameters; newsletter or marketing subscriptions; engagement signals beyond the single `view`; card data (§17 hosted-Checkout rule); member or family data (§1).

**Stored but never displayed:** `visitor_hash`; Stripe ids and tokens; donor `message` and volunteer notes are staff-only; pending and rejected Voices posts appear in moderation only.

### `/admin` dashboard and `/admin/insights`

The dashboard opens **metrics first, work queue below** — money and volunteer tiles, two six-month charts, then what needs attention today: stories pending, signups to confirm, impact month missing. The queue is derived, not a table. **Generated seed data is fine for the demo** — **[DEMO-ONLY]** per §26 — seeded into the tables and queried normally, so the screen goes live without a rewrite when real data arrives. Six months of charted history is fabricated; say so if a judge asks where the numbers came from.

There is deliberately **no donations screen**. Staff use Stripe for anything donor-specific; admin shows aggregates plus the supporter notes.

`/admin/insights` shows what the two collected things support, and nothing beyond it: **per-article views and daily visitors** with the range filter, plus the two paired panels — **how donors found us** beside **how volunteers found us**, and the free-text notes beside each other. One screen: which articles were read, and how people found Love 21.

> **What this cannot show.** Set expectations before someone opens it: **no EN vs 繁體中文 readership split** — `locale` is not recorded, so nothing here answers which language is being read; no read-through or time-on-page; no CTA or share tracking, so nothing links an article to a donation or a signup; no tag or campaign performance; no referrer or UTM breakdown; no search queries or ranking positions (that is Google Search Console, needing a verified property); no bounce rate, session duration or pages-per-session; no new-vs-returning; no cross-session funnel.
>
> Some of that needs visitor linking we deliberately do not do. The rest was simply **cut from what we collect** — see the two-item list above. The `referral_source` and `discovery_source` questions are what stand in for all of it, which is why they are worth asking well.

---
---

# Part III — Execution

*Added 31 July 2026. Like Part II this is our decision, not sourced fact. Where Part II
describes what we want to build, Part III records **how we actually build it** in the time
available: the standard every screen is held to, how work reaches `main`, what is in scope,
and who does what.*

*§§1–23 describe roughly four weeks of work. We have three days. §27 is therefore largely a
record of things being **cut** — deliberately, with reasons — so a reader later can tell the
difference between a feature nobody thought of and a feature we chose to drop.*

| Section | Read it before |
|---|---|
| **§24** Design direction | writing any UI |
| **§25** Git branching and PR workflow | pushing anything |
| **§26** Demo-first priority | scoping anything |
| **§27** Build scope | assuming a feature in Part II is being built |
| **§28** Repository layout | adding a file |
| **§29** API contract | writing a route or a fetch |
| **§30** Team split | picking up work |
| **§31** Toolchain and rule packs | writing any code |

---

## 24. Design direction — the owner's brief

**This is the requirement the owner has pressed hardest on, and it is the one this project is most likely to be judged on in the room.** Every other section describes what the site *does*. This one describes what it has to *be*, and it is not negotiable against schedule pressure.

### The brief, in the owner's terms

> **Professional and sleek — and still friendly and welcoming.**

Both halves, on every screen, at the same time. They are not a spectrum to pick a point on and they are not traded off page by page. A screen that satisfies one and not the other is not done.

| What it must read as | What it must never read as |
|---|---|
| Considered, credible, current | Amateur, dated, thrown together, unstyled |
| Sleek, composed, confident | Cold, corporate, clinical, austere |
| Warm, human, inviting | Cutesy, childish, patronising, saccharine |
| Calm and legible | Cluttered, shouty, busy |

### Why both halves are load-bearing here

**The professional half is a fundraising requirement.** §3 records where the money comes from: 49% restricted funds from corporate and foundation grants, and a gala that raised HKD 3.8M in one night. §5 lists the partners — Morgan Stanley, BlackRock, HSBC, Bloomberg, Clifford Chance, Ashurst. Those readers are deciding whether an organisation is safe to hand six figures to, and they form that judgement from the site before they ever read the 86% programme-spend figure. A charity that looks under-resourced online is read as under-run. §6 records the current site is a donated WordPress build with a dormant login and an empty events calendar — the credibility gap this rebuild exists to close is as much visual as functional.

**The welcoming half is the mission.** §1 asks for a path from curiosity to volunteer signup that "feels rewarding, human, and easy", and for storytelling that celebrates what members *can do*. The organisation's own hashtag is `#somuchability`. A site that is immaculate and unwelcoming turns first-time volunteers away at the door — and a stigma-reducing charity whose website feels institutional has argued against itself in its own layout.

### The failure mode specific to this client

**Do not resolve "friendly" into "childlike".** Rounded-everything, primary-colour blocks, cartoon mascots, bouncy motion, exclamation marks — the visual register normally reached for to signal warmth is the exact register that infantilises adults with Down syndrome and autism. §5 records participant ages **6 to 45**. §4 records members winning medals at the Asian Para-Karate Championships and training for the Special Olympics. Design for the 45-year-old competitive athlete and the 8-minute plank, and the site reads as respectful to everyone; design for the 6-year-old and it reads as condescending to most of the audience.

Warmth here comes from **photography of real people, generous whitespace, human copy, and typography with character** — not from decoration.

> Love 21 staff sit on the judging panel (§7). Patronising design is the failure they are most equipped to spot instantly, and the one they cannot un-see.

### Non-negotiables

1. **Nothing ships looking like a default template.** The anti-template policy in `.claude/rules/ecc/web/design-quality.md` is binding, not advisory. No stock centred-hero-plus-gradient-blob, no uniform card grid standing in for hierarchy, no unmodified library defaults.
2. **One design system, applied everywhere.** Tokens for colour, type scale, spacing, radius, shadow and motion — defined once in `styles/tokens.css`, used by every component. Two surfaces that disagree about spacing read as unfinished, which is precisely the "professional" half failing.
3. **Every interactive element has designed hover, focus and active states.** Focus states are visible and deliberate — this is a design requirement and an accessibility one at the same time.
4. **Accessibility is part of "professional", not a separate checklist.** WCAG 2.2 AA contrast, real semantic HTML, keyboard reachability, `prefers-reduced-motion` honoured, `image.alt` required by the block schema (§21). §19 states it plainly: an inaccessible site for a neurodiversity charity is the one flaw this panel cannot miss.
5. **Photography carries the warmth; the layout carries the polish.** Real members and real volunteers, not stock imagery. Subject to the §4 / §19 consent constraint — where clearance is unconfirmed, the layout must degrade to something that still looks intentional rather than leaving a hole.
6. **Motion clarifies, never performs.** Compositor-friendly properties only (§`web/performance.md`). Nothing that moves for its own sake, nothing that delays a reader, nothing that fires without a reduced-motion escape.
7. **Bilingual by construction.** Every layout must hold up in 繁體中文 as well as English (§21). Chinese runs shorter and taller; a hero tuned to one English headline breaks. Test both, not one.
8. **The admin surface is held to the same standard.** Love 21 staff use it weekly after we leave (§16). A polished public site over a raw admin panel is the same credibility failure, moved somewhere the client actually lives.

### The bar, stated as a test

Before any screen is called done, all four must be true:

- [ ] Would this be believable as a screenshot from a well-funded product?
- [ ] Would a first-time visitor feel invited in, not processed?
- [ ] Would a 45-year-old member see themselves treated as an adult?
- [ ] Does it hold up in both languages, at 320px and at 1440px?

**Where scope and polish collide, cut scope.** §18.7 already records that a demo is 5–10 minutes and much of the feature list will never be seen. Fewer surfaces, finished to this bar, beat more surfaces that miss it.

> **§26 is the other half of this sentence.** Speed and demo viability outrank completeness *everywhere except here*: this section is on §26's never-cut list. Cutting a feature is the intended move; cutting the design bar on a feature that ships is not, because a surface that misses §24 fails the demo it was rushed for.

---

## 25. Git branching and PR workflow

**Rule zero: nothing goes onto `main` directly. Every change reaches `main` through a pull request.**

### Branch naming

```
feature/<page_name>/<feature_name>      ← where work happens
page/<page_name>                        ← optional, temporary integration branch
main                                    ← protected; PR-only
```

| Branch | Purpose | Lifetime |
|---|---|---|
| `feature/<page_name>/<feature_name>` | One feature on one page. The default and the normal case. | Deleted on merge |
| `page/<page_name>` | Temporary. Only when several features on the same page must land together, or a page is being built by more than one person. | Deleted once merged to `main` |
| `main` | Always demoable. | Permanent |

`<page_name>` follows the site structure in §10 and the route tree in §12 — `landing`, `news`, `help`, `volunteer`, `donate`, `admin`. `<feature_name>` is the specific piece of work, kebab-case.

```
feature/news/voices-moderation
feature/donate/stripe-checkout
feature/donate/tracking-page
feature/admin/bulk-attendance
feature/landing/impact-section
page/news
```

### Merge paths

```
              ┌──────────────────────────────────────┐
              │  normal case — most work             │
              │                                      │
  feature/donate/stripe-checkout ──── PR ──────►  main
                                                    ▲
              │  multi-feature page                 │
              │                                     │
  feature/news/voices-moderation ─┐                 │
  feature/news/learn-tab ─────────┼─► page/news ─ PR┘
  feature/news/article-blocks ────┘
```

Both paths end in a PR into `main`. The page branch is a convenience for keeping related work together, not a way around review — a `page/*` branch still opens a PR like anything else.

### Rules

1. **Branch off the latest `main`.** Pull before you branch.
2. **One feature per branch.** A branch touching the donate flow and the admin dashboard is two branches.
3. **Rebase or merge `main` into your branch before opening the PR**, not after review starts. Conflicts are the author's to resolve.
4. **Conventional commits**, per `.claude/rules/ecc/common/git-workflow.md`: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `ci:`.
5. **Delete the branch on merge.** Four days of branches otherwise becomes unreadable.
6. **Never force-push a branch someone else is working on** — relevant to `page/*` branches specifically.

### PR expectations

Short, but not empty:

- What changed, and which page or feature it belongs to
- Anything a reviewer would not guess — a contract change, a new env var, a shared file touched
- A screenshot for anything visual. §24 is a stated requirement, so UI PRs are reviewed against it, and that cannot be done from a diff.
- Flag it explicitly if the PR touches a shared file (`apiClient`, tokens, locales, shared UI primitives) — those are where parallel work collides.

At hackathon pace, review is a fast second pair of eyes, not a gate. The point is that no one is surprised by what is on `main` — because `main` is what gets demoed on 3 August.

---

## 26. Demo-first priority, and the DEMO-ONLY flag

**Deadline 3 August 2026. The demo is 5–10 minutes (§18.7). Nothing in this document ships to a real user during the event.** Every scoping decision follows from those three facts.

### The priority order

When time is short — and it will be — resolve in this order:

| | Priority | Source |
|---|---|---|
| 1 | **It runs, on demo day, without breaking** | §7.2 — judges reward a working low-bug prototype, not a mockup |
| 2 | **It meets the §24 design bar on every surface a judge sees** | §24 — the owner's hardest-pressed requirement |
| 3 | **It is complete** | last, always |

**Speed and demo viability outrank completeness.** A half-built feature that demos cleanly beats a whole feature that is still being wired at midnight. §18.7 already records that a meaningful fraction of this feature list will never be seen by a judge — building all of it to production depth is spending the only scarce resource on the least-observed axis.

### What "cut" means, and does not

**Cut breadth. Never cut the bar.** §24 says it directly: *"Where scope and polish collide, cut scope."* Dropping a feature is the intended move. Shipping a feature that looks unfinished is not — it fails the demo it was rushed for, in front of the panel best equipped to notice.

**Cut first, without asking:**

- The back half of a CRUD — create and list demo the point; edit and delete usually do not
- Pagination, search and sort on lists that will hold a dozen seeded rows
- Edge cases no click path in the demo story reaches
- Retry, backoff and scheduling — a **"run now"** button *is* the demo (§16)
- Anything real-time
- Admin screens the demo narrative never opens
- Empty and error states on surfaces the demo never puts into those states (they stay required on surfaces it does — §21)

**Never cut, regardless of clock:**

- The §24 design bar on any surface that gets shown, and the accessibility that §24.4 and §19 fold into it
- Bilingual coverage on demoed surfaces (§21)
- Truthful framing: the §15 copy rule, the §17 demo-integrity rule, the §18.6 "DEMO — no real payments" banner
- Secrets discipline — no live Stripe keys, no token in a client bundle or an error string (§22)
- **The seams.** `apiClient`'s mock/real switch (§12) and `HANDSON_MODE` (§17) are what make the shortcuts reversible. Hardcoding past a seam saves an hour now and costs a refactor later.

### The DEMO-ONLY flag

> **A feature is `DEMO-ONLY` when it is built to survive the demo path and would need real work before real use.**

**Whenever you build one, say so — every time, unprompted.** Three places, no exceptions:

1. **In the code**, at the top of the file or function it applies to:
   ```js
   // DEMO-ONLY: seeded fixtures, no HandsOn call. Real version needs
   // partner credentials + a base URL (§17, §20.12).
   ```
2. **In the message or PR body** that delivers it — one line, `DEMO-ONLY: <what is faked> — real needs <what>`. §25 already asks PRs to flag anything a reviewer would not guess; this is that, made mandatory.
3. **In §19**, the pre-production checklist — one line so it survives the people who wrote it.

**This applies to assistants and agents working in this repo as much as to people.** State the flag in the same message as the code, not afterwards and not only in a comment nobody opens. Never present a fake as real — internally to the team, and least of all to judges who include Love 21 staff (§17 demo-integrity rule).

### Say the flag when any of these are true

- Mock, fixture, stub, hardcoded or seeded data stands in for a real source
- Test-mode or throwaway credentials (Stripe test keys, a demo Instagram account)
- Only the happy path is implemented, with the error path stubbed or absent
- An admin control exists to *force* state — "advance", "reset", "run now"
- An approval, consent, auth or safeguarding gate is deliberately absent
- It only works on our machines — `localhost`, a local Ollama, our own verified email addresses

### Register — what is already DEMO-ONLY

Everything below is a deliberate decision recorded elsewhere in this document. Collected here so the demo-only surface area is countable in one place.

> **Nothing in this register is built yet** (§28). It is a list of what *will* be demo-only
> when each feature lands, not an inventory of what is faked today — today nothing is. Each
> row becomes real, and gets its `DEMO-ONLY` code marker and its §19 line, in the PR that
> builds it.

> **Read against §27.** This register covers everything specified as demo-only. §27 then cuts several of these from the 3 August build entirely — Instagram authoring, campaigns, certificates, insights and wishlist. Where the two disagree, **§27 is what is being built**; the rows below stay because a cut feature still has to be honest about what it was when someone picks it up later.

| Feature | What is real | What is demo-only | § |
|---|---|---|---|
| Donations | Full Stripe Checkout, webhooks, idempotency | **Test mode only.** No live keys, no s.88 receipting, persistent DEMO banner | §17, §18.6, §19 |
| Demo state controls | — | `POST /api/admin/demo/advance-donation/:id`; cron "run now" buttons | §16 |
| HandsOn sync | The contract, the consumer, the UX | **A stub**, not a mock service — seeded from the two real §5 listings, no scheduling, no reconciliation, `live` unimplemented. External hours only appear to count toward badges | §17, §20.12 |
| Email | Resend integration, templates | Sandbox domain — delivers **only to our own verified addresses**. In-app prompts are primary, email is not a demo dependency | §17, §23 |
| Instagram publishing | **Genuinely live** — real posts to a real account | The account is a throwaway we control, app in Development Mode; Love 21's real account needs review or a tester role | §17, §19 |
| AI caption drafting | Server route, Zod validation, disabled-state degradation | Depends on a local Ollama that will not be running on a judge's machine | §22 |
| Admin dashboard + insights | Queries, charts, range filter | Generated seed data, including six months of fabricated history | §23 |
| Campaign creation | Create, page, share | **No approval gate** — anyone can fundraise in the charity's name | §18.2 |
| `POST /api/events` | Batching, beacon, hashing | Unauthenticated; view counts are inflatable | §18.10 |
| Instagram consent gate | `consent_status` displays in the editor | Blocks nothing | §18.11 |
| Stories and photography | Sourced from public material | **Name and photo consent unconfirmed** for every §4 story; minors first-initial only | §18.5, §19 |
| Social sharing | Static OG defaults in `index.html` | Runtime OG tags invisible to scrapers until prerendering exists | §18.12 |

### The test, before calling a task done

- [ ] Does this survive the demo click path?
- [ ] Does it meet §24 on every screen it shows?
- [ ] If anything in it is faked, is the `DEMO-ONLY` flag in the code, in the PR, and in §19?
- [ ] Would the claim I'd make about it to a judge survive one follow-up question from Love 21 staff?

---

## 27. Build scope — what ships and what was cut

**Target: all three pillars, thin.** Every pillar demos end to end; none is exhaustive. The
alternative — one deep pillar — was rejected because the brief is explicitly three-part and
§7.1 rewards solving the problem the NGO actually stated.

### Shipping

| Pillar | Shipping |
|---|---|
| **1 · Showcase** | Landing page with live impact figures · the §4 stories, ability-first · News/Updates with annual reports as download cards, not articles · Voices (submit + moderate) · the public events calendar §6 says their current site leaves empty |
| **2 · Volunteering** | The Learn tab, which carries most of pillar 2 · opportunity listings and detail · **on-site signup, which does not exist today at all** · HandsOn listings mirrored with interest captured first, backed by a **stub sync** (§17) · volunteer profile with hours and badges |
| **3 · Donating** | Donate form (amount, frequency, optional programme — nothing Stripe already collects) · hosted Stripe Checkout in test mode · the §15 allocation engine · **the donor tracking page** · thanks page · recovery form |

Cross-cutting: bilingual EN / 繁體中文, the admin bulk-attendance screen, article and Voices
admin, the demo controls from §16, and the persistent "DEMO — no real payments" banner.

### Cut, and why

| Cut | Reason |
|---|---|
| **Instagram authoring (§22)** | The single largest feature in Part II and roughly a person-day: Meta app setup, a public bucket, a crop tool, bilingual captions. Genuinely impressive; still one feature against three pillars. **Stretch only.** |
| **Peer-to-peer campaigns** | Cost, plus §18.2 — an unapproved fundraiser in a registered charity's name is an abuse vector we would rather not demo. |
| **Certificates (PDF/CJK)** | Real work, invisible in a five-minute demo. |
| **`/admin/insights` (§23)** | `POST /api/events` still fires and still collects, so the data exists. The screen is stretch. |
| **Wishlist** | Not load-bearing. |
| **Real fortnightly cron** | Replaced by the demo-advance control. Judges see the state machine either way, and §16 already says "we scheduled it for 3am" is not a demo. |

> Everything cut here stays specified in §§15–23. Cut means *not built by 3 August*, not
> *rejected*. A team picking this up later should read Part II as the target and this section
> as the triage.

### Constraints that survive the cut

These are the Part II rules that the shipped subset still depends on. Getting any of them
wrong is a silent failure rather than a visible one:

- `express.raw()` before `express.json()` on the webhook route (§17). **Not applied yet** —
  `express.json()` is global in `app.js` today, so this has to be done in the same PR as the
  webhook route or it fails on a valid signature (§11)
- Emails lowercased and trimmed on write, or donor collation breaks (§15)
- `COUNT(DISTINCT session_id)` on the lifetime strip (§15)
- `cost_at_allocation` snapshotted, never recomputed (§15)
- `role` never settable through signup; `requireRole` enforced server-side (§9, §12)
- Recovery returns an identical response for known and unknown addresses (§15)
- No `dangerouslySetInnerHTML`; `image.alt` required on every block (§21)
- The §15 copy rule: *"your gift helped make this session possible"*

---

## 28. Repository layout and setup state

**Setup is done.** Both workspaces install and run, and the two halves talk to each other.
`cd server && npm run dev` boots on **port 3000**; `cd client && npm run dev` serves on 5173
and proxies `/api` to the server. That is the whole of what exists — the shell, the routing
and the data layer are still to be built, and §30 assigns them.

> An earlier, much larger bootstrap — app shell, router, `apiClient`, i18n, mock API,
> design tokens — **was scrapped.** Where any part of this document still describes it as
> built, this section is what is true. Nothing below is aspirational; every file listed is
> in the repository right now.

### What is actually here

```
client/                              server/
├── index.html                       ├── index.js        entry: dotenv, listen, shutdown
├── vite.config.js   proxy /api      ├── .env.example
├── .oxlintrc.json                   └── src/
└── src/                                 ├── app.js      express app + CORS + mounts
    ├── main.jsx     renders <App/>      ├── config/
    ├── App.jsx      Vite starter        │   └── supabase.js   anon client + health probe
    ├── App.css                          ├── middleware/
    ├── index.css                        │   ├── not-found.js
    ├── assets/      react/vite/hero     │   └── error-handler.js
    ├── components/                      └── routes/
    │   └── Navbar.jsx      empty            ├── index.js       GET /api + mounts
    └── pages/                               └── health.routes.js
        ├── HomePage.jsx    placeholder
        ├── PageNotFound.jsx    empty
        └── news/Articles.jsx   empty
```

**Four of those client files are empty or near-empty.** `Navbar.jsx`, `PageNotFound.jsx` and
`news/Articles.jsx` are zero bytes; `HomePage.jsx` returns `<div>HomePage</div>`. They are
name-claims — a signal of who intends to build what — not implementations. `main.jsx` still
renders the stock Vite starter `App.jsx`, so **nothing in `pages/` is reachable in a browser.**

### The server

CommonJS, not ESM. `require`/`module.exports` throughout, `"type": "commonjs"`, Node ≥ 18.
The entry point is `server/index.js` at the workspace root, not `src/index.js`.

| Route | Response |
|---|---|
| `GET /` | `{ message, status }` — banner |
| `GET /api` | `{ message, status }` — banner |
| `GET /api/health` | `{ status: "ok", timestamp }` |
| `GET /api/health/supabase` | `{ status: "ok", service: "supabase" }`, or 503 through the error handler |

`app.js` in order: `x-powered-by` disabled → `express.json()` → a hand-written CORS
middleware (`CLIENT_ORIGIN`, default `http://localhost:5173`, answering `OPTIONS` with 204)
→ routes → `not-found` → `error-handler`. **CORS is hand-rolled, not the `cors` package.**

`config/supabase.js` builds a lazy singleton on the **anon** key with `persistSession` and
`autoRefreshToken` off, and exposes `checkSupabaseConnection()`, which fetches
`/auth/v1/health` on a 5-second timeout and throws with `status = 503`. §9 calls for the
**service-role** key server-side; moving to it is a one-line change in this file plus a new
variable in `.env.example`, and it should happen before anything queries a table.

### The client

ESM, React 19 on Vite 8 (rolldown). `vite.config.js` runs `@vitejs/plugin-react` plus
`@rolldown/plugin-babel` with `reactCompilerPreset()` — **the React Compiler is on**, so do
not hand-add `useMemo` or `useCallback`. The dev proxy sends `/api` to `localhost:3000`.
Linting is `oxlint` with `react/rules-of-hooks` at error.

**Installed: `react` and `react-dom`, and nothing else.** The architecture in §§11–12 assumes
react-router, TanStack Query, i18next + react-i18next, `@supabase/supabase-js` and
react-markdown. None of them are in `client/package.json` yet — whoever starts the shell
installs them in that PR and says so, because it is a shared-file change under §25.

There is **no `client/.env.example`**, so `VITE_`-prefixed variables have no declared home
yet. Whoever adds the first one creates the file, and puts the warning in it: every
`VITE_`-prefixed variable is compiled into the public bundle. The Supabase service-role key
and every Stripe secret belong in `server/.env`, never there.

### Environment

`server/.env.example` declares `HOST`, `PORT` (3000), `CLIENT_ORIGIN`, `SUPABASE_URL` and
`SUPABASE_ANON_KEY`. Everything else §§17 and 23 need — `SUPABASE_SERVICE_ROLE_KEY`,
`SERVER_SECRET`, the Stripe pair, `RESEND_API_KEY`, `HANDSON_MODE` — is undeclared. Add each
to `.env.example` in the PR that first reads it, with a comment saying what it is for, so
nobody discovers a missing variable at demo time.

> **`server/.gitignore` ignores `*.env` but has no `!.env.example` negation**, unlike the
> root `.gitignore`. The example file is already tracked so it survives, but a new
> `server/.env.local` or similar would be silently ignored. Worth knowing before assuming a
> file is committed.

### What is not built

No database schema or migrations. No feature endpoints. No auth middleware, no `requireRole`,
no Zod validation, no rate limiting, no `pino`. No router, providers, layouts, design tokens
or locale files on the client. No `apiClient`, and so **no mock/real seam** — §12 describes it
as the thing that unblocks parallel work, and until it exists the frontend has nothing to
build against but the four routes above. No test tooling of any kind.

Nothing in the repository currently carries a `DEMO-ONLY` marker, because nothing demo-shaped
has been built yet. `grep -rn "DEMO-ONLY" .` returning nothing is accurate today and will stop
being accurate with the first fixture that lands.

---

## 29. API contract

Conventions, decided once because they touch every endpoint. **The envelope below is taken
from the server as it is written, not from an earlier draft of this section** — the running
code is the contract.

| | |
|---|---|
| **Envelope** | `{ data: … }`. The resource is always under `data`, single or collection |
| **Lists** | `{ data: [...], meta: { total, page, limit } }` — `meta` sits **beside** `data`, not inside it |
| **Errors** | `{ error, message, code }` — `error` is the HTTP status label, `message` the human detail (**absent outside development**), `code` the machine-readable field |
| **Naming** | `snake_case`, matching Postgres, so there is no mapping layer |
| **Dates** | ISO 8601 UTC. The client formats; the server never sends display strings |
| **Money** | `amount_hkd` is **integer dollars**. Stripe wants cents; that ×100 lives server-side and never crosses this API |
| **Language** | Public endpoints take `?locale=` and return resolved fields (`title`). Admin returns both (`title_en`, `title_zh`) because it edits both |
| **Auth** | `Authorization: Bearer <supabase-jwt>` |

```
GET /api/health       →  200  { "status": "ok", "timestamp": "2026-07-31T…" }
GET /api/impact       →  200  { "data": { "families_supported": 490, … } }
GET /api/articles     →  200  { "data": [ … ], "meta": { "total": 12, … } }
GET /api/articles/:s  →  200  { "data": { "slug": "…", "title": "…", … } }
GET /api/nope         →  404  { "error": "Not Found", "code": "NOT_FOUND",
                                "message": "No route exists for GET /api/nope" }
                              ↑ `message` only in development; `error` + `code` always
```

**Success and failure are distinguished by which key is present, not by a flag.** A 2xx
carries `data` and never `error`; an error carries `error` and never `data`. Neither side
nulls out the other's key to make the two shapes match, and there is deliberately **no
`success` boolean** — it would be a third encoding of something the status line and the key
already say twice.

That means `"data" in body` is **not** the check. The check is the HTTP status, exactly as
it was before the wrapper existed. The wrapper buys one thing: room to add response-level
keys — `meta` today, a `warnings` or `cursor` later — without any of them colliding with a
field name on the resource itself. An article with its own `meta_title` was already one
rename away from ambiguity.

**`/api/health` and `/api/` are deliberately unwrapped.** They are operational probes, not
resources — uptime monitors and container health checks read `status` at the top level, and
burying it under `data` breaks that for no gain. Wrap resources; leave probes bare.

`lib/envelope.js` has the only definition, and it is applied in the **route layer**.
Services return domain results (`{ items, meta }` from `listArticles`), so service tests
assert on the resource and stay unaffected when transport changes — which is why this change
moved 3 route files and 0 service tests.

**Three fields.** `error` is the HTTP status label — `"Not Found"`, `"Conflict"` — derived
from `node:http`'s `STATUS_CODES`, so it tracks the status automatically. `message` is
human-facing detail. `code` is the machine-readable field, derived from the status by
`codeForStatus()` unless a caller passes one explicitly.

**Clients branch on the HTTP status or on `code` — never on `message` or `error`.**

- Never branch on `message`. It is prose, it will be reworded, and it is **absent whenever
  `NODE_ENV` is not `development`** (below), which is the case that matters.
- Never branch on `error`. It is derived from the status, so it carries nothing the status
  does not already give you.
- `code` earns its place because `message` does not survive production. Its closed set lives
  in `CODE_BY_STATUS`; unmapped statuses fall back by class (4xx → `VALIDATION_FAILED`,
  otherwise `INTERNAL`) so no error ever ships without one. **Adding a code is a contract
  change: add it here first, then to the map.**
- Where two failures share a status and a client must tell them apart, prefer **different
  statuses** — a conflict is 409, a validation failure is 400. Reach for an explicit `code`
  argument only when they genuinely cannot be separated that way.

> **Reversed 1 Aug 2026.** An earlier revision of this section removed `code` and deleted
> `lib/api-error.js`, on the reasoning that the status line was signal enough. That held only
> while `message` survived on 4xx. The volunteer track's handler — now the one in the tree —
> suppresses `message` on **every** status outside development, which leaves `code` as the
> only machine-readable field on a production 400. Both are restored. `lib/http-error.js` and
> its `httpError()` helper were the alternative and have been **deleted**; if a reader finds a
> reference to `httpError`, it is stale and `ApiError` is what is current.

> The money rule is worth the emphasis. Converting in both directions cancels out in testing
> and only surfaces as a 100× error in front of an audience.

`error-handler.js` omits `message` on **every** status unless `NODE_ENV === "development"`,
sending `{ error, code }` alone. That reliably keeps stack details and driver strings out of
responses, and it is why `code` exists at all.

> **Open decision — settle before deploy, harmless until then.** It also means a production
> 400 carries no readable detail, so `validate.js`'s field-level messages ("locale: Invalid
> option…") vanish exactly where a form needs them. Two ways out: the **client** maps `code`
> plus the field to its own copy, which is better i18n practice anyway since server strings
> are English-only; or `error-handler.js` keeps `message` on 4xx and suppresses 5xx only. The
> first fits the bilingual requirement (§20) better. Nothing breaks locally, because
> `NODE_ENV` is `development` — the failure appears only once something is deployed, which is
> the reason to write it down now rather than discover it on demo day.

Endpoints, against the §14 surface reduced to the §27 scope:

- **Content** — `GET /api/articles` · `/api/articles/:slug` · `GET`/`POST /api/community-posts` · `GET /api/impact` · `GET /api/sessions`
- **Volunteering** — `GET /api/opportunities` · `/:id` · `POST /api/opportunities/:id/interest` · `POST`/`DELETE /api/volunteer/signups` · `GET /api/volunteer/me` · `POST /api/volunteer/signups/:id/feedback`
- **Donations** — `POST /api/donations/checkout` · `POST /api/webhooks/stripe` · `GET /api/donors/track/:token` · `POST /api/donors/recover-link` · `POST /api/donations/:id/feedback`
- **Admin** (all `requireRole('admin')`, server-side) — articles CRUD · `POST /api/admin/community-posts/:id/moderate` · `GET /api/admin/sessions` · `POST /api/admin/sessions/attendance/bulk` · impact · `GET /api/admin/dashboard` · `POST /api/admin/demo/advance-donation/:id`
- **Analytics** — `POST /api/events`, unauthenticated by design (§18.10), batched and rate limited

### Error statuses

A closed set. **Adding one is a contract change — add it here first.** Throw an error with
`.status` set to one of these; the handler turns it into the label and the body.

| Status | `error` label | Meaning |
|---|---|---|
| 400 | `Bad Request` | Malformed request — unparseable body, missing required param |
| 401 | `Unauthorized` | No JWT, or an invalid one |
| 403 | `Forbidden` | Authenticated, but not permitted — a non-admin on `/api/admin/*` |
| 404 | `Not Found` | No such route, or no such record |
| 409 | `Conflict` | Duplicate signup, already-moderated post |
| 422 | `Unprocessable Content` | Body, query or params failed the Zod schema |
| 429 | `Too Many Requests` | Recovery form, `POST /api/events` |
| 500 | `Internal Server Error` | Anything unhandled. `message` is suppressed in production |

A route that throws with no `.status` gets 500, which is the right default for an unhandled
error — so **anything the user should read needs an explicit 4xx**, per the suppression rule
above.

**Validation is 422, not 400.** The two are separated deliberately: 400 means we could not
parse the request, 422 means we parsed it and it failed the schema. A client that needs to
render field-level errors is looking for 422, and collapsing both into 400 loses that split.

> **Known mismatch:** `middleware/validate.js` currently throws **400**, not 422, so schema
> failures arrive with `code: "VALIDATION_FAILED"` on a 400. `CODE_BY_STATUS` has no 422
> entry either — it falls back by class to the same code. Either move `validate.js` to 422
> and give 422 its own entry, or drop this rule. Do not leave the doc and the handler
> disagreeing.

**Five of these have no producer yet** — 400, 401, 403, 422 and 429 wait on Zod, `requireAuth`,
`requireRole` and rate limiting, none of which are built (§28). The table exists now so they
arrive consistent rather than each inventing a status.

Of that surface, **`GET /api` and `GET /api/health` are the only things answering today**
(§28). Everything else is the target.

**Fixtures, when they land, are the authoritative response shapes** — not a convenience for
the frontend but the written form of this contract. Seed them from the real research in
Part I — the annual-report figures, the two HandsOn listings from §5, real programme names —
rather than placeholder text, because placeholder data hides layout problems that only appear
when a genuine Chinese title wraps to three lines. If the contract changes, the fixtures
change first. Whoever builds `apiClient` (§12) decides where they live and records it here.

Two shapes carry rules that are not obvious from their field names:

- **`/api/opportunities`** returns both `spots_filled` and `interested_count`. **Never sum
  them** (§17): the first is authoritative bookings inside HandsOn's system, the second is
  our leads. Render as *"HandsOn: 1/1 booked · 3 interested here"*.
- **`/api/donors/track/:token`** returns `sessions_supported` alongside
  `sessions_on_the_way`. The second exists solely so a first-time donor does not read
  "0 sessions supported" at the moment of peak engagement (§15).

---

## 30. Team split

Three frontend, three backend. **The labels below are tracks, not people** — who takes which
is the team's call. What matters is that each path in the repo has exactly one owner.

| Track | Owns | Day 1 | Day 2 | Day 3 |
|---|---|---|---|---|
| **FE1** | shell, design system, `styles/`, `components/ui/`, `layouts/`, `apiClient` | **install the frontend deps** (§28), then `apiClient` + providers + route skeleton, then design tokens and shared components | Landing page | admin shell, moderation queue, polish |
| **FE2** | `features/content/`, `pages/news/` | news hub + **the block renderer** | article detail, Updates, Learn | Voices + submission form |
| **FE3** | `features/donations/`, `features/volunteering/`, `pages/help/` | volunteer listings, detail, signup, HandsOn variant | donate form, Stripe redirect, thanks, **tracking page** | volunteer profile, recovery form, cutover |
| **BE1** | `app.js`, `middleware/`, `db/`, `data/` | **schema + migrations for every table, first** — both teammates are blocked on it — then middleware and auth | seed data, content endpoints | admin content, deploy |
| **BE2** | `services/donations/`, Stripe, Resend | checkout + webhook | allocation engine, tracking endpoint | demo controls, recovery, emails |
| **BE3** | `services/volunteering/`, `services/content/`, admin routes | opportunities, signups, **HandsOn stub** (small — §17 caps it deliberately) | sessions, **bulk attendance**, auto-complete job | badges, impact, dashboard, events |

**Two tracks are front-loaded with unblocking work.** FE1 and BE1 spend Day 1 building things
the other four need and end it with little visible output. That is the job working correctly.

**Both of those Day 1s start from less than this table assumes.** §28 is the inventory: the
client has react and react-dom and a stock starter, the server has four routes and no
middleware beyond a 404 and an error handler. So FE1's first commit is `npm install` plus the
shell, and BE1 owns `app.js` as it stands rather than as §11 draws it. The first two things
off FE1's bench — `apiClient` and the locale files — are what the other two frontend tracks
are literally unable to start without, so they come before anything with a colour in it.

**Say what you installed.** Adding a dependency changes `package.json` for six people. It is a
shared-file change under §25 and belongs in the PR body, not just the lockfile diff.

**Day 3 is integration, not features.** Six people building against fixtures for two days
will surface real contract mismatches, and that discovery cannot happen on demo morning. If a
pillar is still on fixtures when Day 3 starts, its remaining polish is cut and it integrates
instead — a pillar demoing on mock data fails the "working prototype, not a mockup" test in
§7.2.

### Rehearsal path

One continuous run that touches all three pillars and every service:

> landing → Learn article → volunteer signup → donate with test card → thanks → tracking page
> showing pending → admin bulk attendance → tracking page showing completed, with headcount
> and photo

If it runs clean twice, we are ready.

### Still open

§20 remains the open-questions list. Three bear directly on what is being built here:
**§20.5** (safeguarding screening before a first session — classes include participants from
age 6, and if a check is required our signup flow is missing a mandatory step), **§20.3**
(whether anyone on the team writes Traditional Chinese, which decides how much bilingual
coverage is honest to attempt), and **§20.1** (which stat set is current — seed data uses the
annual-report figures).

---

## 31. Toolchain, rule packs, and where this document lives

### This document is not in the repository

`CONTEXT.md`, `CLAUDE.md` and `.claude/` are **distributed directly** rather than committed.
A fresh clone does not contain any of them. If you are missing one, ask someone — do not
assume the repository is the whole project. It is also the reason this document restates its
own setup context instead of pointing at `CLAUDE.md` for it.

> **They are untracked but not ignored.** The root `.gitignore` has no entry for any of the
> three, so `git status` lists them and **`git add -A` or `git add .` will commit them.** If
> that is not what you want, either add them to `.gitignore` or stage deliberately. If the
> team decides they *should* be tracked, that is a fine decision — just make it once,
> explicitly, and delete this note. What should not happen is one person committing them by
> accident and everyone else discovering it in a merge conflict on a 1,500-line file.

### Plain JSX — no TypeScript, anywhere

`.jsx` for anything containing JSX, `.js` for logic, hooks and utilities. Linting is
**oxlint**, not ESLint, configured in `client/.oxlintrc.json` with `react/rules-of-hooks` at
error. There is no lint script on the server.

**The client is ESM, the server is CommonJS** (§9). `import` under `client/`, `require` under
`server/`. The ECC packs are written in ESM throughout; on the server, read their `import`
examples as `require`.

> **JSDoc carries what the type system would.** On exported functions, shared utilities,
> component props, and above all the §29 contract shapes, write a JSDoc block and keep it true
> to runtime behaviour. Untyped JavaScript across six people and a frozen contract is
> workable; untyped *and* undocumented is how a `snake_case` field quietly becomes
> `camelCase` on one side of the seam.

ECC's `react` pack assumes TypeScript throughout. Where it says `.tsx`, read `.jsx`; where it
shows `type Props = {…}`, read a JSDoc block. Everything else in it applies unchanged.

### The ECC rule packs

Vendored from [affaan-m/ECC](https://github.com/affaan-m/ECC) under `.claude/rules/ecc/` —
and so, per above, not in the repo. Four packs apply: `common`, `react`, `web`, and, despite
the name, `typescript`, whose files are every one scoped to `**/*.js` / `**/*.jsx` and which
carries the JSDoc guidance for untyped JavaScript. ECC ships no `javascript` pack.

**They are binding, not advisory.** §24.1 states this for the anti-template policy; it holds
for the rest of them.

Inlined here are the rules §§24–30 actually lean on, so this document stands up for someone
reading it without the packs to hand:

- **Anti-template** (`web/design-quality.md`). *Banned:* stock centred hero plus gradient
  blob; uniform card grids standing in for hierarchy; unmodified library defaults; safe
  grey-on-white with one decorative accent; identical radius, spacing and shadow everywhere.
  *Required, at least four of:* hierarchy through scale contrast, intentional spacing rhythm
  rather than uniform padding, depth or layering, typography with a real pairing strategy,
  colour used semantically, designed hover/focus/active states, grid-breaking editorial
  composition where it fits, texture or atmosphere, motion that clarifies, data visualisation
  treated as part of the design system.
- **Animation properties** (`web/performance.md`). Animate `transform`, `opacity`,
  `clip-path`, and `filter` sparingly. Never `width`, `height`, `top`, `left`, `margin`,
  `padding` or `font-size`. Honour `prefers-reduced-motion`.
- **Size limits** (`common/coding-style.md`). Functions under 50 lines; files 200–400 lines
  typical and 800 hard maximum; nesting no deeper than four — prefer early returns. Many
  small files beat few large ones, which is also what keeps six people out of each other's
  diffs (§30).
- **Immutability.** Never mutate an existing object; spread into a new one.
- **Validation at every boundary.** Zod on request body, query and params, and on any
  third-party response — including a local model's JSON, which is untrusted input despite
  running on our own machine. *Zod is not installed yet; the first endpoint taking input
  installs it.*
- **No `console.log` in committed code.** `pino` server-side — *also not installed. The
  existing `index.js` startup banner and the `console.error` in `error-handler.js` are the
  two deliberate exceptions, and they are what `pino` replaces when it lands.*
- **Secrets from environment variables only**, never literals, and never behind a `VITE_`
  prefix — §28 already flags that anything so prefixed compiles into the public bundle.
  *Nothing validates them at startup today: `config/supabase.js` throws lazily on first use,
  so a missing key surfaces as a 503 on the first request rather than a refusal to boot.
  Fail-fast validation is worth adding with the first secret that matters.*

### Testing posture — §26 modifies the ECC default

`common/testing.md` sets 80% coverage and test-first as mandatory. **§26 outranks it here**,
and recording that is better than letting the rule be ignored silently.

Write tests where a bug is **silent and expensive** — the places where nothing visibly breaks
and the number is simply wrong:

- the allocation engine: the clamp, the eligibility window, `COUNT(DISTINCT session_id)`
- the fortnight boundary and the empty-period rule
- webhook idempotency
- email normalisation, without which donor collation fails invisibly (§15)
- the recovery endpoint's uniform response — a privacy property, not a feature (§15)

Skip them for presentational components, where §24's visual bar and a real browser carry more
signal than markup assertions. Say plainly in the PR that coverage is deliberately partial;
that is a §26 decision, not an oversight.
