import { apiData, isRealApiMode } from '@/lib/apiClient'
import { getSignup, type VolunteerSignup } from '@/features/volunteering/signup-store'

/**
 * Resolves a signup id to something we can prove belongs to the person holding it.
 *
 * Two sources, in order: this browser's own store, which is written the moment the server
 * accepts a signup; then `GET /api/volunteer-signups`, which needs a volunteer token or a
 * signed-in account and only ever returns that volunteer's own rows. A stranger with
 * somebody else's id resolves to null on both.
 *
 * Shared by the success page and the briefing page. It lived only in the briefing page,
 * which is why the success page rendered a confirmation for any id at all — including ones
 * that never existed.
 */
export async function resolveSignup(signupId: string): Promise<VolunteerSignup | null> {
  const local = getSignup(signupId)
  if (local) return local

  if (!isRealApiMode()) return null

  try {
    const { data } = await apiData<{ items: Array<{ id: string; opportunity_id: string }> }>(
      '/api/volunteer-signups',
    )
    const row = (data?.items ?? []).find((item) => item.id === signupId)
    if (!row) return null

    // Deliberately sparse: the list endpoint returns the signup, not the volunteer's
    // details, and the pages that use this only need the link between signup and session.
    return {
      id: row.id,
      opportunity_id: row.opportunity_id,
      name: '',
      email: '',
      age_group: 'age19_29',
      status: 'confirmed',
      created_at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}
