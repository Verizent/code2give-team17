import { apiData, ApiError, isRealApiMode } from '@/lib/apiClient'
import type {
  VolunteerAgeGroup,
  VolunteerOpportunity,
  VolunteerSkill,
} from '@/features/volunteering/fixtures'
import {
  mapOpportunityRow,
  type OpportunityApiRow,
} from '@/features/volunteering/map-opportunity'
import {
  applyLocalClaims,
  createSignup,
  listResolvedFromBase,
} from '@/features/volunteering/signup-store'

let cache: VolunteerOpportunity[] | null = null
let loadPromise: Promise<VolunteerOpportunity[]> | null = null

async function fetchFromApi(): Promise<VolunteerOpportunity[]> {
  const { data } = await apiData<OpportunityApiRow[]>('/api/opportunities?limit=50')
  return (data ?? []).map(mapOpportunityRow)
}

/**
 * Load listings from Supabase via the Express API only.
 * No client fixture fallback. Throws when real mode and the API fails.
 */
export async function loadOpportunities(): Promise<VolunteerOpportunity[]> {
  if (cache) return listResolvedFromBase(cache)
  if (!loadPromise) {
    loadPromise = (async () => {
      if (!isRealApiMode()) {
        cache = []
        return []
      }
      try {
        cache = await fetchFromApi()
        return listResolvedFromBase(cache)
      } catch (error) {
        cache = null
        throw error
      }
    })().finally(() => {
      loadPromise = null
    })
  }
  return loadPromise
}

export function peekOpportunities(): VolunteerOpportunity[] {
  return listResolvedFromBase(cache ?? [])
}

export async function listOpportunities(
  skills: VolunteerSkill[] = [],
): Promise<VolunteerOpportunity[]> {
  const all = await loadOpportunities()
  if (skills.length === 0) return all
  return all.filter((o) => skills.some((s) => o.skills.includes(s)))
}

export async function fetchOpportunity(
  id: string,
): Promise<VolunteerOpportunity | undefined> {
  const all = await loadOpportunities()
  const found = all.find((o) => o.id === id)
  if (found) return found

  if (!isRealApiMode()) return undefined

  try {
    const { data } = await apiData<OpportunityApiRow>(`/api/opportunities/${id}`)
    const mapped = applyLocalClaims(mapOpportunityRow(data))
    cache = [...(cache ?? []), mapped]
    return mapped
  } catch {
    return undefined
  }
}

export async function allOpportunities() {
  return loadOpportunities()
}

/** Drop cache after local signup claims so capacity refreshes. */
export function invalidateOpportunitiesCache() {
  cache = null
}

/**
 * Prefer server signup; fall back to localStorage when the API is down.
 * Capacity is enforced server-side for UUID opportunities.
 */
export async function submitSignup(input: {
  opportunity_id: string
  full_name: string
  email: string
  phone?: string
  age_group: VolunteerAgeGroup
  emergency_name?: string
  emergency_phone?: string
}): Promise<
  { ok: true; signupId: string } | { ok: false; reason: 'full' | 'duplicate' | 'error' }
> {
  const looksLikeUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.opportunity_id,
    )

  if (isRealApiMode() && looksLikeUuid) {
    try {
      const { data } = await apiData<{
        signup: { id: string }
      }>('/api/volunteer/signups', {
        method: 'POST',
        body: JSON.stringify({
          opportunity_id: input.opportunity_id,
          full_name: input.full_name,
          email: input.email,
          phone: input.phone ?? null,
        }),
      })
      invalidateOpportunitiesCache()
      createSignup({
        opportunity_id: input.opportunity_id,
        name: input.full_name,
        email: input.email,
        phone: input.phone,
        age_group: input.age_group,
        emergency_name: input.emergency_name,
        emergency_phone: input.emergency_phone,
        id: data.signup.id,
        skipCapacityCheck: true,
      })
      return { ok: true, signupId: data.signup.id }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const body = err.message
        if (
          body.includes('ALREADY_SIGNED_UP') ||
          body.includes('Already signed up')
        ) {
          return { ok: false, reason: 'duplicate' }
        }
        return { ok: false, reason: 'full' }
      }
      // Fall through to local mirror.
    }
  }

  const cached = peekOpportunities().find((o) => o.id === input.opportunity_id)
  const result = createSignup({
    opportunity_id: input.opportunity_id,
    name: input.full_name,
    email: input.email,
    phone: input.phone,
    age_group: input.age_group,
    emergency_name: input.emergency_name,
    emergency_phone: input.emergency_phone,
    knownOpportunity: cached,
  })
  if (!result.ok) return { ok: false, reason: result.reason === 'full' ? 'full' : 'error' }
  return { ok: true, signupId: result.signup.id }
}

/**
 * Register interest (lead). Does not claim a capacity spot.
 * With opportunity_id → volunteer_interests row; without → volunteer contact only.
 */
export async function submitInterest(input: {
  opportunity_id?: string
  full_name: string
  email: string
  phone?: string
  message?: string
}): Promise<{ ok: true; interestId: string | null } | { ok: false; reason: 'duplicate' | 'error' }> {
  if (!isRealApiMode()) {
    return { ok: true, interestId: null }
  }

  try {
    if (input.opportunity_id) {
      const { data } = await apiData<{ interest: { id: string } }>(
        `/api/opportunities/${input.opportunity_id}/interest`,
        {
          method: 'POST',
          body: JSON.stringify({
            full_name: input.full_name,
            email: input.email,
            phone: input.phone ?? null,
            message: input.message ?? null,
          }),
        },
      )
      invalidateOpportunitiesCache()
      return { ok: true, interestId: data.interest.id }
    }

    const { data } = await apiData<{ interest: { id: string } | null }>(
      '/api/volunteer/interest',
      {
        method: 'POST',
        body: JSON.stringify({
          full_name: input.full_name,
          email: input.email,
          phone: input.phone ?? null,
          message: input.message ?? null,
        }),
      },
    )
    return { ok: true, interestId: data.interest?.id ?? null }
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { ok: false, reason: 'duplicate' }
    }
    return { ok: false, reason: 'error' }
  }
}

/** §23 post-attendance feedback — only valid when signup.status === 'attended'. */
export type SignupFeedbackInput = {
  experience_rating?: number
  would_return?: boolean
  improvement_note?: string | null
}

export async function submitSignupFeedback(
  signupId: string,
  body: SignupFeedbackInput,
): Promise<
  | {
      ok: true
      feedback_submitted_at: string | null
      experience_rating: number | null
      would_return: boolean | null
      improvement_note: string | null
    }
  | { ok: false; reason: 'error' }
> {
  if (!isRealApiMode()) {
    return { ok: false, reason: 'error' }
  }

  try {
    const { data } = await apiData<{
      feedback_submitted_at?: string | null
      experience_rating?: number | null
      would_return?: boolean | null
      improvement_note?: string | null
    }>(`/api/volunteer-signups/${signupId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    })
    return {
      ok: true,
      feedback_submitted_at: data.feedback_submitted_at ?? new Date().toISOString(),
      experience_rating: data.experience_rating ?? body.experience_rating ?? null,
      would_return: data.would_return ?? body.would_return ?? null,
      improvement_note:
        data.improvement_note ?? body.improvement_note ?? null,
    }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

export type { VolunteerOpportunity, VolunteerSkill }
