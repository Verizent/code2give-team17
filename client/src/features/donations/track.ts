import { apiData } from '@/lib/apiClient'

/**
 * `GET /api/donors/track/:token` — the §15 tracking page.
 *
 * The token in the URL is a bearer capability: holding it *is* the authorisation, so there is
 * no login and no lookup by email. That is deliberate — an endpoint taking an email address
 * would answer "did this named person donate to a disability charity" for anyone who asked.
 * The mitigations are the token's own size (32 random bytes), `X-Robots-Tag: noindex` set
 * server-side, and the absence of any enumeration route.
 *
 * Shapes below mirror `server/src/services/donors.service.js#buildTrackView` exactly. There is
 * no `allocations` key by design: a donor sees session-level state, never the internal
 * allocation rows, and an event's status is the *session's* own scheduled/completed/cancelled.
 */

export type TrackEvent = {
  kind: 'session'
  id: string
  title: string | null
  starts_at: string
  location: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  /** Planned headcount. Server maps this from `sessions.capacity`. */
  expected_participants: number | null
  /** Who actually came. Null until staff record it — never conflate with the above. */
  attendance_count: number | null
  photo_url: string | null
}

export type TrackPeriod = {
  id: string
  period_start: string
  period_end: string
  status: string
  is_current: boolean
  events_credited: number
  events_shown: number
  events: TrackEvent[]
}

export type TrackView = {
  donor: { full_name: string | null; supporter_since: string | null }
  lifetime: {
    sessions_supported: number
    sessions_on_the_way: number
    total_given_hkd: number
    donation_count: number
    people_reached: number
  }
  period: TrackPeriod | null
  /** Archive, newest first. Pass an id back as `periodId` to read an earlier edition. */
  periods: { id: string; label: string; status: string }[]
}

export async function fetchTrackView(
  token: string,
  periodId?: string | null,
): Promise<TrackView> {
  const query = periodId ? `?period=${encodeURIComponent(periodId)}` : ''
  const res = await apiData<TrackView>(
    `/api/donors/track/${encodeURIComponent(token)}${query}`,
  )
  return res.data
}
