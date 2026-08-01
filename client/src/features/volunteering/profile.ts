import { loadOpportunities } from '@/features/volunteering/api'
import { evaluateBadges, type EarnedBadge } from '@/features/volunteering/badges'
import type {
  VolunteerOpportunity,
  VolunteerSkill,
} from '@/features/volunteering/fixtures'
import { getProfileSkills } from '@/features/volunteering/profile-prefs'
import {
  listSignups,
  type VolunteerSignup,
} from '@/features/volunteering/signup-store'
import type { Localized } from '@/lib/mock'

export type ProfileSession = {
  signup: VolunteerSignup
  opportunity?: VolunteerOpportunity
  title: Localized
  when: Localized
  hours: number
}

export type ProfileInterest = {
  id: string
  title: Localized
  when: Localized
  message: string | null
}

export type VolunteerProfile = {
  name: string | null
  email: string | null
  /** Permanent skills saved on the volunteer profile */
  skills: VolunteerSkill[]
  session_count: number
  hours_total: number
  programme_count: number
  sessions: ProfileSession[]
  interests: ProfileInterest[]
  badges: EarnedBadge[]
}

function hoursFromOpportunity(opportunity?: VolunteerOpportunity): number {
  if (opportunity?.starts_at && opportunity.ends_at) {
    const ms =
      new Date(opportunity.ends_at).getTime() - new Date(opportunity.starts_at).getTime()
    if (ms > 0) return Math.round((ms / 3_600_000) * 10) / 10
  }
  return 1.5
}

function emptyTitle(): Localized {
  return { en: 'Session', 'zh-Hant': '課堂', 'zh-Hans': '课堂' }
}

function emptyWhen(): Localized {
  return { en: 'Date TBC', 'zh-Hant': '日期待定', 'zh-Hans': '日期待定' }
}

/** Build the volunteer profile from browser signups + saved skills + opportunity cache/API. */
export async function loadVolunteerProfile(
  email?: string | null,
): Promise<VolunteerProfile> {
  const signups = listSignups()
  const opportunities = await loadOpportunities().catch(() => [] as VolunteerOpportunity[])
  const byId = new Map(opportunities.map((o) => [o.id, o]))

  const sessions: ProfileSession[] = signups.map((signup) => {
    const opportunity = byId.get(signup.opportunity_id)
    return {
      signup,
      opportunity,
      title: opportunity?.title ?? emptyTitle(),
      when: opportunity?.when ?? emptyWhen(),
      hours: hoursFromOpportunity(opportunity),
    }
  })

  const programmes = new Set(
    sessions
      .map((s) => s.opportunity?.programme.en)
      .filter((p): p is string => Boolean(p)),
  )
  const hours_total =
    Math.round(sessions.reduce((sum, s) => sum + s.hours, 0) * 10) / 10
  const latest = signups[0]
  const profileEmail = email?.trim().toLowerCase() || latest?.email || null

  return {
    name: latest?.name ?? null,
    email: profileEmail,
    skills: getProfileSkills(profileEmail),
    session_count: sessions.length,
    hours_total,
    programme_count: programmes.size,
    sessions,
    interests: [],
    badges: evaluateBadges({
      signup_count: sessions.length,
      hours: hours_total,
      programme_count: programmes.size,
    }),
  }
}
