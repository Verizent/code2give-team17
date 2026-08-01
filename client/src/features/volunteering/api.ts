import {
  filterOpportunities,
  getOpportunity,
  opportunities,
  type VolunteerOpportunity,
  type VolunteerSkill,
} from '@/features/volunteering/fixtures'

/** Domain reads — fixtures now; swap to apiClient later. */
export function listOpportunities(skills: VolunteerSkill[] = []) {
  return filterOpportunities(skills)
}

export function fetchOpportunity(id: string): VolunteerOpportunity | undefined {
  return getOpportunity(id)
}

export function allOpportunities() {
  return opportunities
}

export type { VolunteerOpportunity, VolunteerSkill }
