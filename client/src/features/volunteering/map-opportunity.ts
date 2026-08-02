import type { Localized } from '@/lib/mock'
import { formatSessionWhenFromIso } from '@/lib/session-when'
import type {
  OpportunitySource,
  VolunteerOpportunity,
  VolunteerSkill,
} from '@/features/volunteering/fixtures'

/** Row shape from `GET /api/opportunities` (bilingual fields kept intact). */
export type OpportunityApiRow = {
  id: string
  title_en: string
  title_zh: string | null
  description_en: string | null
  description_zh: string | null
  location_en: string | null
  location_zh: string | null
  programme: string
  starts_at: string
  ends_at: string | null
  capacity: number
  spots_filled: number
  spots_filled_handson: number
  local_signups_count: number
  interested_count: number
  min_age: number
  skills: string[]
  status: string
  source: OpportunitySource
  handson_url: string | null
  handson_opportunity_id: string | null
  last_synced_at: string | null
}

const PROGRAMME_LABELS: Record<string, Localized> = {
  sports: {
    en: 'Sports & Fitness',
    'zh-Hant': '運動與體能',
    'zh-Hans': '运动与体能',
  },
  fitness: {
    en: 'Sports & Fitness',
    'zh-Hant': '運動與體能',
    'zh-Hans': '运动与体能',
  },
  nutrition: {
    en: 'Nutrition',
    'zh-Hant': '營養',
    'zh-Hans': '营养',
  },
  family_support: {
    en: 'Family support',
    'zh-Hant': '家庭支援',
    'zh-Hans': '家庭支援',
  },
  community_education: {
    en: 'Art / Music / Dance',
    'zh-Hant': '藝術／音樂／舞蹈',
    'zh-Hans': '艺术／音乐／舞蹈',
  },
}

const PROGRAMME_IMAGE: Record<string, string> = {
  sports: '/brand/class.jpg',
  fitness: '/brand/hero-climb.jpg',
  nutrition: '/brand/member.jpg',
  family_support: '/brand/hero-group.jpg',
  community_education: '/brand/activity.jpg',
}

const SKILL_SET = new Set<VolunteerSkill>([
  'patient',
  'sports',
  'music',
  'kitchen',
  'photography',
  'youth14',
  'cantonese',
])

/** Map legacy / ad-hoc DB skill tags onto the volunteer skill chips. */
const SKILL_ALIASES: Record<string, VolunteerSkill> = {
  youth: 'youth14',
  youth14: 'youth14',
  dance: 'music',
  music: 'music',
  art: 'photography',
  photography: 'photography',
  kitchen: 'kitchen',
  cooking: 'kitchen',
  sports: 'sports',
  fitness: 'sports',
  patient: 'patient',
  cantonese: 'cantonese',
}

function normaliseSkills(raw: string[] | null | undefined): VolunteerSkill[] {
  const out: VolunteerSkill[] = []
  for (const item of raw ?? []) {
    const key = String(item).trim().toLowerCase()
    const mapped =
      (SKILL_SET.has(key as VolunteerSkill) ? (key as VolunteerSkill) : null) ??
      SKILL_ALIASES[key] ??
      null
    if (mapped && !out.includes(mapped)) out.push(mapped)
  }
  return out
}

function bilingual(
  en: string | null | undefined,
  zh: string | null | undefined,
  fallback = '',
): Localized {
  const english = en?.trim() || fallback
  const chinese = zh?.trim() || english
  return { en: english, 'zh-Hant': chinese, 'zh-Hans': chinese }
}

function ageNote(minAge: number): Localized {
  if (minAge <= 14) {
    return {
      en: `${minAge}+ (Youth welcome). Comfortable with active sessions.`,
      'zh-Hant': `${minAge} 歲或以上（歡迎青少年）。需能應付活躍課堂。`,
      'zh-Hans': `${minAge} 岁或以上（欢迎青少年）。需能应付活跃课堂。`,
    }
  }
  return {
    en: `${minAge}+. Cantonese preferred, not required.`,
    'zh-Hant': `${minAge} 歲或以上。粵語較佳，非必須。`,
    'zh-Hans': `${minAge} 岁或以上。粤语较佳，非必须。`,
  }
}

export function mapOpportunityRow(row: OpportunityApiRow): VolunteerOpportunity {
  const skills = normaliseSkills(row.skills)
  const description = bilingual(row.description_en, row.description_zh)
  const isFull = row.spots_filled >= row.capacity || row.status === 'full'
  const recruiting = row.status === 'open' && !isFull
  const handson = row.source === 'handson'

  return {
    id: row.id,
    title: bilingual(row.title_en, row.title_zh, 'Session'),
    programme: PROGRAMME_LABELS[row.programme] ?? {
      en: row.programme,
      'zh-Hant': row.programme,
      'zh-Hans': row.programme,
    },
    when: formatSessionWhenFromIso(row.starts_at, row.ends_at),
    place: bilingual(
      row.location_en,
      row.location_zh,
      handson ? 'Address after signup' : 'Love 21',
    ),
    placeHiddenUntilSignup: handson,
    source: row.source,
    capacity: row.capacity,
    spots_filled: row.spots_filled,
    // Kept separate as well as summed: a handson listing takes bookings on both sites, and
    // "6 of 10 booked" cannot say which side holds them.
    spots_filled_handson: row.spots_filled_handson ?? 0,
    local_signups_count: row.local_signups_count ?? 0,
    interested_count: row.interested_count ?? 0,
    skills,
    recruiting,
    external_url: row.handson_url ?? undefined,
    description,
    age_note: ageNote(row.min_age ?? 16),
    whatYouDo: description,
    group_note: {
      en: 'Coaches on site',
      'zh-Hant': '教練在場',
      'zh-Hans': '教练在场',
    },
    youth14: (row.min_age ?? 16) <= 14 || skills.includes('youth14'),
    image: PROGRAMME_IMAGE[row.programme] ?? '/brand/class.jpg',
    starts_at: row.starts_at,
    ends_at: row.ends_at ?? undefined,
  }
}
