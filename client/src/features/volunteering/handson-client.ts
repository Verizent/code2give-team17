import { apiClient } from '@/lib/apiClient'
import { loadOpportunities, peekOpportunities } from '@/features/volunteering/api'
import type { VolunteerOpportunity } from '@/features/volunteering/fixtures'

export type HandsonOpportunityDto = {
  id: string
  title: string
  programme: string
  datetime: string
  location: string
  capacity: number
  spots_filled: number
  url?: string
}

/**
 * HandsOn-shaped data seam (CONTEXT §17).
 * Prefers API when live; otherwise returns HandsOn-sourced rows from /api/opportunities.
 */
export async function fetchHandsonOpportunities(): Promise<{
  items: HandsonOpportunityDto[]
  last_synced: string
  mode: 'live' | 'mock'
}> {
  try {
    const res = await apiClient<{
      items: HandsonOpportunityDto[]
      last_synced?: string
    }>('/api/handson/opportunities')
    return {
      items: res.items ?? [],
      last_synced: res.last_synced ?? new Date().toISOString(),
      mode: 'live',
    }
  } catch {
    const items = (await loadOpportunities())
      .filter((o) => o.source === 'handson')
      .map(toDto)
    return {
      items,
      last_synced: new Date().toISOString(),
      mode: 'mock',
    }
  }
}

function toDto(o: VolunteerOpportunity): HandsonOpportunityDto {
  return {
    id: o.id,
    title: o.title.en,
    programme: o.programme.en,
    datetime: o.when.en,
    location: o.placeHiddenUntilSignup ? 'Address after signup' : o.place.en,
    capacity: o.capacity,
    spots_filled: o.spots_filled,
    url: o.external_url,
  }
}

export function getLocalOpportunity(id: string) {
  return peekOpportunities().find((o) => o.id === id)
}
