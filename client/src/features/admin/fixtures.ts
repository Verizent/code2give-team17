// DEMO-ONLY: every /admin surface reads from this file instead of the API when
// VITE_ADMIN_STUB=true — real version needs the live endpoints (§19, §26).
//
// Why this exists: /api/admin/dashboard currently 500s (volunteer_opportunities.spots_filled
// does not exist), the live moderation queue holds XSS probes and "[STRESS TEST]" rows, and
// the seeded giving figures are too thin to read on a projector. Stubbing is the demo-safe
// path; it does not fix the endpoint.
//
// Numbers here are derived, not hand-typed, so they cannot contradict each other on screen:
// programme rows sum to the capacity totals, acquisition sources sum to the donor count.

import type {
  AdminArticle,
  AdminInstagramEmbed,
  AdminWishlistItem,
  AnalyticsPayload,
  CommunityPost,
  DashboardPayload,
} from './api'
import type { Campaign } from '@/features/donations/campaign-store'

/**
 * Deliberately not ANDed with import.meta.env.DEV, unlike ADMIN_AUTH_BYPASS: the demo may
 * be run from `vite preview` (a production build), and silently losing the stubs mid-demo
 * is worse than the flag surviving a build nobody sets it for.
 */
export const ADMIN_STUB = import.meta.env.VITE_ADMIN_STUB === 'true'

/** Percentage to one decimal; null when the denominator is empty, per the API contract. */
function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null
  return Math.round((numerator / denominator) * 1000) / 10
}

function scale(value: number, factor: number): number {
  return Math.max(1, Math.round(value * factor))
}

/** Clone on read so a page mutating a returned row cannot corrupt the fixture. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

// ---------------------------------------------------------------------------
// Giving history — 24 months to 2026-08. Year-end and Lunar New Year peaks are
// what a Hong Kong charity's giving actually looks like; a flat line reads as fake.
// ---------------------------------------------------------------------------

const DONATIONS_BY_MONTH = [
  { month: '2024-09', amount_hkd: 8400 },
  { month: '2024-10', amount_hkd: 9150 },
  { month: '2024-11', amount_hkd: 11200 },
  { month: '2024-12', amount_hkd: 24600 },
  { month: '2025-01', amount_hkd: 10800 },
  { month: '2025-02', amount_hkd: 16400 },
  { month: '2025-03', amount_hkd: 12900 },
  { month: '2025-04', amount_hkd: 11750 },
  { month: '2025-05', amount_hkd: 13300 },
  { month: '2025-06', amount_hkd: 15050 },
  { month: '2025-07', amount_hkd: 12400 },
  { month: '2025-08', amount_hkd: 14900 },
  { month: '2025-09', amount_hkd: 16250 },
  { month: '2025-10', amount_hkd: 17800 },
  { month: '2025-11', amount_hkd: 19400 },
  { month: '2025-12', amount_hkd: 38900 },
  { month: '2026-01', amount_hkd: 18600 },
  { month: '2026-02', amount_hkd: 27300 },
  { month: '2026-03', amount_hkd: 21450 },
  { month: '2026-04', amount_hkd: 20100 },
  { month: '2026-05', amount_hkd: 22800 },
  { month: '2026-06', amount_hkd: 25600 },
  { month: '2026-07', amount_hkd: 21900 },
  { month: '2026-08', amount_hkd: 12300 },
]

const LIFETIME_HKD = DONATIONS_BY_MONTH.reduce((sum, row) => sum + row.amount_hkd, 0)
const LIFETIME_GIFTS = 486

/** Capacity and attendance per programme, full 24-month window. */
const PROGRAMMES = [
  { programme: 'sports', capacity: 320, signups: 296, attended: 241 },
  { programme: 'nutrition', capacity: 180, signups: 168, attended: 139 },
  { programme: 'fitness', capacity: 160, signups: 141, attended: 118 },
  { programme: 'community_education', capacity: 120, signups: 96, attended: 74 },
  { programme: 'family_support', capacity: 60, signups: 52, attended: 40 },
]

const DONOR_SOURCES = [
  { source: 'instagram', count: 58 },
  { source: 'friend', count: 41 },
  { source: 'search', count: 33 },
  { source: 'event', count: 22 },
  { source: 'employer', count: 18 },
  { source: 'unknown', count: 12 },
]

const VOLUNTEER_SOURCES = [
  { source: 'friend', count: 46 },
  { source: 'instagram', count: 34 },
  { source: 'school', count: 28 },
  { source: 'handson', count: 21 },
  { source: 'employer', count: 14 },
  { source: 'unknown', count: 9 },
]

type RangeKey = 'all' | '1y' | '6m' | '3m' | '1m'

const RANGE_PROFILE: Record<
  RangeKey,
  { months: number; factor: number; prior: string; current: string }
> = {
  // 12, not 24: the chart is captioned "past twelve months" and the live endpoint
  // caps the series there too. The extra history above only feeds the shorter slices.
  all: { months: 12, factor: 1, prior: 'Sep 24–Aug 25', current: 'Sep 25–Aug 26' },
  '1y': { months: 12, factor: 0.55, prior: 'Aug 24–Feb 25', current: 'Feb 25–Aug 26' },
  '6m': { months: 6, factor: 0.29, prior: 'Nov 25–Feb 26', current: 'Mar 26–Aug 26' },
  '3m': { months: 3, factor: 0.15, prior: 'Feb 26–Apr 26', current: 'May 26–Aug 26' },
  '1m': { months: 1, factor: 0.05, prior: 'Jun 26–Jul 26', current: 'Jul 26–Aug 26' },
}

export function analyticsFixture(range: string): AnalyticsPayload {
  const key: RangeKey = (Object.keys(RANGE_PROFILE) as RangeKey[]).includes(range as RangeKey)
    ? (range as RangeKey)
    : 'all'
  const profile = RANGE_PROFILE[key]

  const programmes = PROGRAMMES.map((row) => {
    const capacity = scale(row.capacity, profile.factor)
    const attended = scale(row.attended, profile.factor)
    return {
      programme: row.programme,
      capacity,
      signups: scale(row.signups, profile.factor),
      attended,
      fill_rate: rate(attended, capacity),
    }
  })

  // Derived from the rows above so the headline tile can never disagree with the bars.
  const capacity = programmes.reduce((sum, row) => sum + row.capacity, 0)
  const attended = programmes.reduce((sum, row) => sum + row.attended, 0)

  const donors = DONOR_SOURCES.map((row) => ({
    source: row.source,
    count: scale(row.count, profile.factor),
  }))
  const volunteers = VOLUNTEER_SOURCES.map((row) => ({
    source: row.source,
    count: scale(row.count, profile.factor),
  }))

  const currentDonors = donors.reduce((sum, row) => sum + row.count, 0)
  const priorDonors = Math.round(currentDonors * 0.87)
  const retained = Math.round(priorDonors * 0.444)
  const repeatDonors = Math.round(currentDonors * 0.337)

  return {
    range: key,
    donor_retention: {
      rate: rate(retained, priorDonors),
      retained,
      prior_donors: priorDonors,
      current_donors: currentDonors,
      prior_window_label: profile.prior,
      current_window_label: profile.current,
      // The 40–45% sector benchmark is annual — printing it against a 1-month
      // window would invite a comparison that is not valid.
      benchmark_applies: key === 'all' || key === '1y',
    },
    repeat_gift: {
      rate: rate(repeatDonors, currentDonors),
      repeat_donors: repeatDonors,
      total_donors: currentDonors,
    },
    capacity_fill: { rate: rate(attended, capacity), attended, capacity },
    satisfaction: {
      average_rating: 4.6,
      would_return_rate: 92.4,
      responses: scale(148, profile.factor),
    },
    donations_by_month: DONATIONS_BY_MONTH.slice(-profile.months),
    programmes,
    acquisition: { donors, volunteers, available: true },
  }
}

export function dashboardFixture(): DashboardPayload {
  return {
    metrics: {
      donations_total_hkd: LIFETIME_HKD,
      donations_count: LIFETIME_GIFTS,
      volunteer_sessions_upcoming: 7,
      volunteer_spots_open: 48,
      interests_count: 31,
      pending_campaigns: campaigns.filter((c) => c.status === 'pending_approval').length,
      pending_voices: communityPosts.filter((p) => p.status === 'pending').length,
      voices_available: true,
      impact_current: true,
    },
    charts: {
      donations_by_month: DONATIONS_BY_MONTH.slice(-12),
      volunteer_hours_by_month: [
        { month: '2025-09', hours: 96 },
        { month: '2025-10', hours: 112 },
        { month: '2025-11', hours: 128 },
        { month: '2025-12', hours: 84 },
        { month: '2026-01', hours: 104 },
        { month: '2026-02', hours: 92 },
        { month: '2026-03', hours: 136 },
        { month: '2026-04', hours: 148 },
        { month: '2026-05', hours: 154 },
        { month: '2026-06', hours: 162 },
        { month: '2026-07', hours: 139 },
        { month: '2026-08', hours: 58 },
      ],
    },
    // Counts read from the live fixture arrays, so moderating a story in the demo
    // visibly drops the queue number on the way back to the hub.
    queue: [
      {
        id: 'voices',
        title: 'Community stories awaiting review',
        detail: 'Submitted through “Share a moment” on the Community page.',
        count: communityPosts.filter((p) => p.status === 'pending').length,
        href: '/admin/moderation',
      },
      {
        id: 'campaigns',
        title: 'Fundraisers awaiting approval',
        detail: 'Supporter-created pages stay hidden until someone approves them.',
        count: campaigns.filter((c) => c.status === 'pending_approval').length,
        href: '/admin/campaigns',
      },
      {
        id: 'articles',
        title: 'Drafts not yet published',
        detail: 'Written but still invisible on the public News page.',
        count: articles.filter((a) => a.status === 'draft').length,
        href: '/admin/articles',
      },
      {
        id: 'wishlist',
        title: 'Wishlist items fully pledged',
        detail: 'Teaching kitchen tools hit its target — close it or raise the goal.',
        count: wishlist.filter((w) => w.is_active && w.pledged >= w.needed).length,
        href: '/admin/wishlist',
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Mutable collections. Module-level so create/edit/delete persist for the length
// of the demo session and reset on reload — no storage layer to explain on stage.
// ---------------------------------------------------------------------------

export const communityPosts: CommunityPost[] = [
  {
    id: 'cp-stub-0001',
    author_name: 'Priya S.',
    relationship: 'supporter',
    story:
      'I have been donating for two years but only visited the centre last month. Seeing where the money actually goes changed how I talk about Love 21 with other people.',
    photo_url: null,
    status: 'pending',
    submitted_at: '2026-08-01T09:55:39.282Z',
  },
  {
    id: 'cp-stub-0002',
    author_name: 'Marcus T.',
    relationship: 'volunteer',
    story:
      'Six months of Tuesday floor curling and I still cannot beat Kelvin. The pace is his, not mine — that was the part I had to learn.',
    photo_url: '/brand/activity.jpg',
    status: 'pending',
    submitted_at: '2026-08-02T14:20:11.004Z',
  },
  {
    id: 'cp-stub-0003',
    author_name: 'Wong Family',
    relationship: 'parent',
    story:
      'Our daughter joined the nutrition class in January. She now plans her own Saturday lunch and writes the shopping list herself. Small thing, enormous thing.',
    photo_url: null,
    status: 'pending',
    submitted_at: '2026-08-03T02:41:57.663Z',
  },
]

export const campaigns: Campaign[] = [
  {
    id: 'cmp-stub-0001',
    slug: 'run-for-love-21-half-marathon',
    title: 'Running the HK Half for Love 21',
    story:
      'I am running the Hong Kong Half Marathon in February and asking friends to back the nutrition programme instead of buying me a finish-line beer.',
    goal_hkd: 15000,
    raised_hkd: 4300,
    cover: '/brand/hero-climb.jpg',
    end_date: '2026-10-15',
    status: 'pending_approval',
    created_at: '2026-08-02T11:02:44.190Z',
  },
  {
    id: 'cmp-stub-0002',
    slug: 'office-bake-sale-quarry-bay',
    title: 'Quarry Bay office bake sale',
    story:
      'Our team is running a bake sale on the 14th floor. Everything raised goes to the Saturday sports sessions.',
    goal_hkd: 6000,
    raised_hkd: 1850,
    cover: '/brand/class.jpg',
    end_date: '2026-09-30',
    status: 'pending_approval',
    created_at: '2026-08-03T01:15:09.771Z',
  },
]

export const wishlist: AdminWishlistItem[] = [
  {
    id: 'kitchen-tools',
    title_en: 'Teaching kitchen tools',
    title_zh: '教學廚房用具',
    why_en: 'Safe knives, boards, and measuring cups for cook & share sessions.',
    why_zh: '安全刀具、砧板與量杯，供烹飪共享課使用。',
    needed: 15,
    pledged: 15,
    image_url: '/brand/class.jpg',
    is_active: true,
    created_at: '2026-06-01T06:13:36.250Z',
    updated_at: '2026-08-01T07:00:22.571Z',
  },
  {
    id: 'floor-curling-set',
    title_en: 'Floor curling set',
    title_zh: '地壺球套裝',
    why_en: 'Tuesday drop-in has outgrown one set — a second ends the waiting.',
    why_zh: '星期二的體驗課已超出一套器材的負荷，第二套可減少等候。',
    needed: 8,
    pledged: 5,
    image_url: '/brand/activity.jpg',
    is_active: true,
    created_at: '2026-06-14T09:20:11.000Z',
    updated_at: '2026-07-28T03:11:45.900Z',
  },
  {
    id: 'yoga-mats',
    title_en: 'Non-slip yoga mats',
    title_zh: '防滑瑜伽墊',
    why_en: 'The current mats slide on the studio floor and the thin ones hurt knees.',
    why_zh: '現有的墊子在地板上打滑，較薄的會令膝蓋不適。',
    needed: 20,
    pledged: 12,
    image_url: '/brand/member.jpg',
    is_active: true,
    created_at: '2026-07-02T04:45:00.000Z',
    updated_at: '2026-08-02T16:46:59.490Z',
  },
  {
    id: 'grocery-vouchers',
    title_en: 'Supermarket vouchers',
    title_zh: '超市禮券',
    why_en: 'Families shop for their own cook-along ingredients with dignity.',
    why_zh: '讓家庭有尊嚴地自行購買烹飪課食材。',
    needed: 30,
    pledged: 9,
    image_url: '/brand/family.jpg',
    is_active: true,
    created_at: '2026-07-19T08:00:00.000Z',
    updated_at: '2026-07-30T11:22:03.100Z',
  },
  {
    id: 'winter-jackets',
    title_en: 'Winter outing jackets',
    title_zh: '冬季外出外套',
    why_en: 'Retired for the season — reopens in October before the hiking block.',
    why_zh: '本季已停止募集，將於十月遠足活動前重開。',
    needed: 12,
    pledged: 12,
    image_url: '/brand/hero-huddle.jpg',
    is_active: false,
    created_at: '2025-11-08T02:30:00.000Z',
    updated_at: '2026-03-01T05:05:05.000Z',
  },
]

export const instagram: AdminInstagramEmbed[] = [
  {
    id: 'ig-stub-0001',
    url: 'https://www.instagram.com/p/DClgUbuyVp2/',
    caption_en: 'Floor curling drop-in — Tuesday regulars back on the mats.',
    caption_zh: '地壺球體驗 — 星期二的常客回來了。',
    thumbnail_url: '/brand/activity.jpg',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'ig-stub-0002',
    url: 'https://www.instagram.com/p/DCmXa1PyQq7/',
    caption_en: 'Cook & share: everyone plates their own lunch.',
    caption_zh: '烹飪共享：每個人都親手擺盤。',
    thumbnail_url: '/brand/class.jpg',
    display_order: 2,
    is_active: true,
  },
  {
    id: 'ig-stub-0003',
    url: 'https://www.instagram.com/p/DCn9RtLyKf4/',
    caption_en: 'Dragon boat crew, 6am, Stanley. Worth it.',
    caption_zh: '龍舟隊，清晨六時，赤柱。非常值得。',
    thumbnail_url: '/brand/dragonboat.jpeg',
    display_order: 3,
    is_active: true,
  },
  {
    id: 'ig-stub-0004',
    url: 'https://www.instagram.com/p/DCp2WvXyBn1/',
    caption_en: 'Sports day medals — all of them.',
    caption_zh: '運動會獎牌 — 全部。',
    thumbnail_url: '/brand/competition-champion.jpeg',
    display_order: 4,
    is_active: false,
  },
]

const BODY_EN = [
  {
    type: 'paragraph',
    text: 'Love 21 runs on a simple idea: adults with Down syndrome and autism deserve sport and nutrition programmes built around what they want to do, not what is easiest to deliver.',
  },
  {
    type: 'paragraph',
    text: 'That means the timetable changes when members ask it to, and the coaching adapts to the room rather than the plan.',
  },
]

export const articles: AdminArticle[] = [
  {
    id: 'art-stub-0001',
    slug: 'floor-curling-league-returns',
    category: 'news',
    title_en: 'Floor curling league returns for a third season',
    title_zh: '地壺球聯賽第三季回歸',
    excerpt_en: 'Sixteen members, four teams, and a trophy nobody is allowed to take home.',
    excerpt_zh: '十六位成員、四支隊伍，還有一座誰都不能帶回家的獎盃。',
    body_en: BODY_EN,
    cover_image_url: '/brand/activity.jpg',
    cover_alt_en: 'Members lining up a floor curling stone on the studio mats',
    cover_alt_zh: '成員在場地墊上瞄準地壺球',
    author: 'Love 21 Foundation',
    status: 'published',
    published_at: '2026-07-28T02:00:00.000Z',
    tags: ['sport', 'community'],
    is_featured: true,
    reading_time_minutes: 3,
  },
  {
    id: 'art-stub-0002',
    slug: 'what-to-expect-first-time-volunteer',
    category: 'education',
    title_en: 'What to expect as a first-time Love 21 volunteer',
    title_zh: '首次擔任 Love 21 義工：你需要知道的事',
    excerpt_en:
      "Nervous about your first session? Here is what actually happens, from arrival to your first high-five.",
    excerpt_zh: '對第一次的活動感到緊張嗎？由抵達到第一個擊掌，這是實際會發生的事。',
    body_en: BODY_EN,
    cover_image_url: '/brand/hero-huddle.jpg',
    cover_alt_en: 'Volunteers and members in a huddle before a session',
    cover_alt_zh: '義工與成員在活動前圍圈',
    author: 'Love 21 Foundation',
    status: 'draft',
    published_at: null,
    tags: ['volunteering', 'getting-started'],
    is_featured: false,
    reading_time_minutes: 2,
  },
  {
    id: 'art-stub-0003',
    slug: 'nutrition-programme-year-one',
    category: 'report',
    title_en: 'Nutrition programme: what one year changed',
    title_zh: '營養計劃：一年帶來的改變',
    excerpt_en:
      'Forty-one members, 139 sessions attended, and the shopping lists they now write themselves.',
    excerpt_zh: '四十一位成員、139 節課，以及他們現在自己寫的購物清單。',
    body_en: BODY_EN,
    cover_image_url: '/brand/class.jpg',
    cover_alt_en: 'A member measuring ingredients in the teaching kitchen',
    cover_alt_zh: '成員在教學廚房量度食材',
    author: 'Programmes Team',
    status: 'published',
    published_at: '2026-06-30T01:30:00.000Z',
    tags: ['nutrition', 'impact'],
    is_featured: false,
    reading_time_minutes: 6,
  },
  {
    id: 'art-stub-0004',
    slug: 'dragon-boat-crew-stanley',
    category: 'news',
    title_en: 'Our dragon boat crew took on Stanley',
    title_zh: '我們的龍舟隊出戰赤柱',
    excerpt_en: 'Six in the morning, twenty paddlers, and a drum nobody could hear over the wind.',
    excerpt_zh: '清晨六時、二十位划手，還有一面被風聲蓋過的鼓。',
    body_en: BODY_EN,
    cover_image_url: '/brand/dragonboat.jpeg',
    cover_alt_en: 'The dragon boat crew paddling out at dawn',
    cover_alt_zh: '龍舟隊在黎明時分划出',
    author: 'Love 21 Foundation',
    status: 'published',
    published_at: '2026-06-12T03:00:00.000Z',
    tags: ['sport', 'events'],
    is_featured: false,
    reading_time_minutes: 4,
  },
  {
    id: 'art-stub-0005',
    slug: 'talking-about-down-syndrome-at-work',
    category: 'education',
    title_en: 'Talking about Down syndrome at work',
    title_zh: '在職場談論唐氏綜合症',
    excerpt_en: 'A short guide for CSR teams who want to get the language right before they visit.',
    excerpt_zh: '給企業社會責任團隊的簡短指南，讓你在到訪前用對語言。',
    body_en: BODY_EN,
    cover_image_url: '/brand/csr.jpg',
    cover_alt_en: 'A corporate volunteering group at the centre',
    cover_alt_zh: '企業義工小組在中心',
    author: 'Love 21 Foundation',
    status: 'draft',
    published_at: null,
    tags: ['csr', 'education'],
    is_featured: false,
    reading_time_minutes: 5,
  },
  {
    id: 'art-stub-0006',
    slug: 'saturday-sports-waiting-list',
    category: 'news',
    title_en: 'Saturday sports has a waiting list — here is the plan',
    title_zh: '星期六運動班已有候補名單 — 我們的計劃',
    excerpt_en: 'Demand outgrew the hall in March. We are adding a second slot in October.',
    excerpt_zh: '三月起需求已超出場地負荷，我們將於十月增設第二節。',
    body_en: BODY_EN,
    cover_image_url: '/brand/hero-group.jpg',
    cover_alt_en: 'A full hall at Saturday sports',
    cover_alt_zh: '星期六運動班的滿場情況',
    author: 'Programmes Team',
    status: 'published',
    published_at: '2026-05-20T06:15:00.000Z',
    tags: ['sport', 'capacity'],
    is_featured: false,
    reading_time_minutes: 3,
  },
]

// ---------------------------------------------------------------------------
// Read/write helpers used by the api module.
// ---------------------------------------------------------------------------

export function stubList<T>(rows: T[]): T[] {
  return clone(rows)
}

export function stubFind<T extends { id: string }>(rows: T[], id: string): T {
  const row = rows.find((r) => r.id === id)
  if (!row) throw new Error(`Stub row not found: ${id}`)
  return clone(row)
}

export function stubUpdate<T extends { id: string }>(rows: T[], id: string, patch: Partial<T>): T {
  const index = rows.findIndex((r) => r.id === id)
  if (index === -1) throw new Error(`Stub row not found: ${id}`)
  rows[index] = { ...rows[index], ...patch }
  return clone(rows[index])
}

export function stubRemove(rows: Array<{ id: string }>, id: string): void {
  const index = rows.findIndex((r) => r.id === id)
  if (index !== -1) rows.splice(index, 1)
}

/** Fresh timestamp for rows created during the demo, so they sort to the top. */
export function stubNow(): string {
  return new Date().toISOString()
}

/** Latin-only, matching what the server derives for an English title. */
export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'untitled'
  )
}

export function readingTime(blocks?: Array<{ text?: string }>): number {
  const words = (blocks ?? []).reduce(
    (sum, block) => sum + (block.text ?? '').trim().split(/\s+/).filter(Boolean).length,
    0,
  )
  return Math.max(1, Math.round(words / 200))
}
