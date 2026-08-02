import { apiData, isRealApiMode } from '@/lib/apiClient'
import {
  listDonations,
  type StoredDonation,
} from '@/features/donations/donation-store'
import {
  pledgedItemLines,
  totalItemPledges,
} from '@/features/donations/wishlist-store'
import {
  clampGrowthStage,
  type GrowthStage,
} from '@/features/donations/components/gift-journey-tree'
import {
  computeGardenLevel,
  gardenFruitCount,
} from '@/features/me/garden-growth'
import { educationReadCount } from '@/features/me/education'
import {
  loadVolunteerProfile,
  type VolunteerProfile,
} from '@/features/volunteering/profile'

export type MeImpactGarden = {
  /** Same 1–5 scale as Giving “impact growth”. */
  level: GrowthStage
  education_count: number
  session_count: number
  hours_total: number
  gift_count: number
  funded_classes: number
  total_given_hkd: number
  item_pledges: number
  item_lines: number
  fruit_count: number
}

export type MeProofReceipt = {
  id: string
  headline: string
  detail: string
  happened_at: string
  programme: string
  members_count: number
  source: 'live'
}

export type MeConversion = {
  id: string
  kind: 'monthly' | 'term' | 'first_gift'
  hours?: number
  amount_toward_class_hkd?: number
  class_cost_hkd?: number
  cta_path: string
} | null

export type MeAccountPrefs = {
  email: string | null
  full_name: string | null
  locale: string | null
  journey_updates: boolean
  email_notifications: boolean
  photo_story_consent: boolean
}

export type MeImpactPayload = {
  garden: MeImpactGarden
  receipts: MeProofReceipt[]
  conversion: MeConversion
  account: MeAccountPrefs
  donations: Array<{
    id: string
    amount_hkd: number
    frequency: string
    programme: string
    status: string
    created_at: string
  }>
  volunteer: {
    stats: {
      session_count: number
      hours_total: number
      programme_count: number
      interest_count?: number
    }
    session_count: number
  }
}

const PREFS_KEY = 'love21-me-prefs'

export type LocalMePrefs = {
  journey_updates: boolean
  email_notifications: boolean
  photo_story_consent: boolean
}

export function loadLocalPrefs(): LocalMePrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) {
      return {
        journey_updates: true,
        email_notifications: true,
        photo_story_consent: false,
      }
    }
    return { ...JSON.parse(raw) } as LocalMePrefs
  } catch {
    return {
      journey_updates: true,
      email_notifications: true,
      photo_story_consent: false,
    }
  }
}

export function saveLocalPrefs(prefs: LocalMePrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

function giftsAsJourney(gifts: StoredDonation[]) {
  return gifts.map((g) => ({
    id: g.id,
    amount_hkd: g.amount_hkd,
    created_at: g.created_at,
    stage: g.stage,
    programme: g.programme,
    frequency: g.frequency,
    session_title: g.session_title,
    session_when: g.session_when,
  }))
}

function gardenFromLocal(
  gifts: StoredDonation[],
  hoursTotal: number,
  sessionCount: number,
): MeImpactGarden {
  const journey = giftsAsJourney(gifts)
  const fundedClasses = gifts.filter((g) => g.stage === 'session_update').length
  const totalGiven = gifts.reduce((sum, g) => sum + g.amount_hkd, 0)
  const education_count = educationReadCount()
  const item_pledges = totalItemPledges()
  const item_lines = pledgedItemLines()
  const pillars = {
    education_count,
    session_count: sessionCount,
    hours_total: hoursTotal,
    gifts: journey,
    item_pledges,
    item_lines,
  }

  return {
    level: computeGardenLevel(pillars),
    education_count,
    session_count: sessionCount,
    hours_total: hoursTotal,
    gift_count: gifts.length,
    funded_classes: fundedClasses,
    total_given_hkd: totalGiven,
    item_pledges,
    item_lines,
    fruit_count: gardenFruitCount(pillars),
  }
}

/**
 * Merge browser education + wishlist into an API garden payload.
 * Does not invent gift rows — when local gifts are absent, preserves API level floor.
 */
export function enrichGardenWithLocal(
  garden: MeImpactGarden,
  gifts: StoredDonation[],
): MeImpactGarden {
  const education_count = Math.max(garden.education_count ?? 0, educationReadCount())
  const item_pledges = Math.max(garden.item_pledges ?? 0, totalItemPledges())
  const item_lines = Math.max(garden.item_lines ?? 0, pledgedItemLines())
  const journey = giftsAsJourney(gifts)
  const pillars = {
    education_count,
    session_count: garden.session_count ?? 0,
    hours_total: garden.hours_total ?? 0,
    gifts: journey,
    item_pledges,
    item_lines,
  }

  let level = computeGardenLevel(pillars)
  if ((garden.gift_count ?? 0) > 0 && journey.length === 0) {
    level = clampGrowthStage(Math.max(level, garden.level))
  }

  return {
    ...garden,
    education_count,
    item_pledges,
    item_lines,
    level,
    fruit_count: Math.max(garden.fruit_count ?? 0, gardenFruitCount(pillars)),
  }
}

function conversionFromLocal(
  gifts: StoredDonation[],
  hoursTotal: number,
  itemPledges: number,
): MeConversion {
  const isMonthly = gifts.some((g) => g.frequency === 'monthly' || g.frequency === 'weekly')
  const totalGiven = gifts.reduce((sum, g) => sum + g.amount_hkd, 0)

  if (hoursTotal >= 12 && !isMonthly) {
    return {
      id: 'hours_to_monthly',
      kind: 'monthly',
      hours: hoursTotal,
      cta_path: '/give?frequency=monthly',
    }
  }

  const remainder = totalGiven % 2500
  if (
    !isMonthly &&
    totalGiven > 0 &&
    (remainder >= 1500 || (totalGiven >= 500 && totalGiven < 2500))
  ) {
    return {
      id: 'one_more_class',
      kind: 'term',
      amount_toward_class_hkd: remainder || totalGiven,
      class_cost_hkd: 2500,
      cta_path: '/give',
    }
  }

  if ((gifts.length > 0 || itemPledges > 0) && !isMonthly) {
    return {
      id: 'become_monthly',
      kind: 'monthly',
      hours: hoursTotal,
      cta_path: '/give?frequency=monthly',
    }
  }

  if (gifts.length === 0 && itemPledges === 0 && hoursTotal > 0) {
    return {
      id: 'volunteer_to_give',
      kind: 'first_gift',
      hours: hoursTotal,
      cta_path: '/give',
    }
  }

  return null
}

/**
 * Receipts only when a gift already carries a real session title — no invented
 * member counts or seeded stand-ins.
 */
function receiptsFromGifts(gifts: StoredDonation[]): MeProofReceipt[] {
  return gifts
    .filter((g) => g.stage === 'session_update' && g.session_title)
    .map((g) => ({
      id: `local_${g.id}`,
      headline: `${g.session_title} — the session you helped fund — has run.`,
      detail: g.session_when
        ? `It happened on ${g.session_when}.`
        : 'A session your gift helped keep free has run.',
      happened_at: g.created_at,
      programme: g.programme,
      members_count: 0,
      source: 'live' as const,
    }))
}

function buildLocalImpact(
  email: string | null,
  profile: VolunteerProfile | null,
  userName: string | null,
): MeImpactPayload {
  const gifts = listDonations().filter((d) => !email || d.email === email)
  const hours = profile?.hours_total ?? 0
  const sessions = profile?.session_count ?? 0
  const garden = gardenFromLocal(gifts, hours, sessions)
  const prefs = loadLocalPrefs()

  return {
    garden,
    receipts: receiptsFromGifts(gifts),
    conversion: conversionFromLocal(gifts, hours, garden.item_pledges),
    account: {
      email,
      full_name: profile?.name ?? userName,
      locale: null,
      journey_updates: prefs.journey_updates,
      email_notifications: prefs.email_notifications,
      photo_story_consent: prefs.photo_story_consent,
    },
    donations: gifts.map((g) => ({
      id: g.id,
      amount_hkd: g.amount_hkd,
      frequency: g.frequency,
      programme: g.programme,
      status: g.stage,
      created_at: g.created_at,
    })),
    volunteer: {
      stats: {
        session_count: sessions,
        hours_total: hours,
        programme_count: profile?.programme_count ?? 0,
      },
      session_count: sessions,
    },
  }
}

/**
 * Load PAGE 5 payload — API first; local garden from real gifts/hours as fallback.
 */
export async function loadMeImpact(input: {
  email: string | null
  userName?: string | null
}): Promise<{ impact: MeImpactPayload; profile: VolunteerProfile }> {
  const profile = await loadVolunteerProfile(input.email)
  if (input.email) {
    profile.email = input.email
    profile.name = profile.name ?? input.userName ?? null
  }

  if (isRealApiMode()) {
    try {
      const { data } = await apiData<MeImpactPayload>('/api/me/impact')
      const prefs = loadLocalPrefs()
      const localGifts = listDonations().filter(
        (d) => !input.email || d.email === input.email,
      )
      const garden = enrichGardenWithLocal(
        {
          level: clampGrowthStage(data.garden?.level ?? 1),
          education_count: data.garden?.education_count ?? 0,
          session_count:
            data.garden?.session_count ?? data.volunteer?.session_count ?? 0,
          hours_total:
            data.garden?.hours_total ?? data.volunteer?.stats?.hours_total ?? 0,
          gift_count: data.garden?.gift_count ?? data.donations?.length ?? 0,
          funded_classes: data.garden?.funded_classes ?? 0,
          total_given_hkd: data.garden?.total_given_hkd ?? 0,
          item_pledges: data.garden?.item_pledges ?? 0,
          item_lines: data.garden?.item_lines ?? 0,
          fruit_count: data.garden?.fruit_count ?? 0,
        },
        localGifts,
      )
      const apiReceipts = Array.isArray(data.receipts) ? data.receipts : []
      const receipts =
        apiReceipts.length > 0 ? apiReceipts : receiptsFromGifts(localGifts)

      return {
        impact: {
          ...data,
          garden,
          receipts,
          account: {
            ...data.account,
            journey_updates: data.account.journey_updates || prefs.journey_updates,
            email_notifications:
              data.account.email_notifications || prefs.email_notifications,
            photo_story_consent: prefs.photo_story_consent,
          },
        },
        profile,
      }
    } catch {
      // Fall through to local.
    }
  }

  return {
    impact: buildLocalImpact(input.email, profile, input.userName ?? null),
    profile,
  }
}
