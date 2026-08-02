import type { Localized } from '@/lib/mock'

export type VolunteerSkill =
  | 'patient'
  | 'sports'
  | 'music'
  | 'kitchen'
  | 'photography'
  | 'youth14'
  | 'cantonese'

/** Demographic brackets for volunteer signup / reporting. */
export type VolunteerAgeGroup =
  | 'youth14_18'
  | 'age19_29'
  | 'age30_44'
  | 'age45_59'
  | 'age60_plus'

export type OpportunitySource = 'handson' | 'internal'

/**
 * Client view of a listing. Sourced from Supabase `volunteer_opportunities`
 * via GET /api/opportunities — bilingual / display fields are mapped in
 * `map-opportunity.ts` (not stored as Localized blobs in the DB).
 */
export type VolunteerOpportunity = {
  id: string
  title: Localized
  programme: Localized
  when: Localized
  place: Localized
  /** HandsOn-style: hide venue until after signup */
  placeHiddenUntilSignup: boolean
  source: OpportunitySource
  capacity: number
  /** Both channels combined. */
  spots_filled: number
  /** Booked on HandsOn's site. Always 0 for an internal listing. */
  spots_filled_handson: number
  /** Booked here. */
  local_signups_count: number
  interested_count: number
  skills: VolunteerSkill[]
  recruiting: boolean
  external_url?: string
  description: Localized
  age_note: Localized
  whatYouDo: Localized
  group_note: Localized
  youth14: boolean
  image: string
  starts_at?: string
  ends_at?: string
}

export const VOLUNTEER_SKILLS: VolunteerSkill[] = [
  'patient',
  'sports',
  'music',
  'kitchen',
  'photography',
  'youth14',
  'cantonese',
]

export const VOLUNTEER_AGE_GROUPS: VolunteerAgeGroup[] = [
  'youth14_18',
  'age19_29',
  'age30_44',
  'age45_59',
  'age60_plus',
]

/** Map legacy age chips to the current demographic brackets. */
export function normaliseAgeGroup(value: unknown): VolunteerAgeGroup | undefined {
  if (typeof value !== 'string') return undefined
  if ((VOLUNTEER_AGE_GROUPS as string[]).includes(value)) {
    return value as VolunteerAgeGroup
  }
  if (value === 'age14_15' || value === 'age16_17') return 'youth14_18'
  if (value === 'age18') return 'age19_29'
  return undefined
}
