import { apiClient, API_MODE, toApiLocale } from '@/lib/apiClient'
import { impactFixture } from '@/lib/mock'

/**
 * GET /api/impact — the Home stats band figures.
 *
 * DEMO-ONLY: on any fetch failure this falls back to impactFixture rather than
 * showing an error, so a server hiccup never breaks the Home page during a demo.
 * Real version should surface a retry/error state instead of swallowing it.
 */
export async function getImpact(locale = 'en') {
  if (API_MODE !== 'real') return impactFixture

  try {
    const { data } = await apiClient(`/api/impact?locale=${toApiLocale(locale)}`)
    return data
  } catch (error) {
    console.error('getImpact failed, using fixture', error)
    return impactFixture
  }
}

/**
 * POST /api/community-posts — a Voices submission from "Share a moment".
 * `photo_url` is omitted: there is no real upload endpoint yet, so the
 * dialog's photo toggle stays UI-only (DEMO-ONLY) rather than sending a
 * fake URL into a real table. Mock mode just resolves — no pending queue.
 * Throws ApiError on failure; the dialog is responsible for showing it.
 */
export async function submitVoice({ authorName, relationship, story, contactEmail, website }) {
  if (API_MODE !== 'real') {
    return { id: 'mock-post', submitted_at: new Date().toISOString() }
  }

  const { data } = await apiClient('/api/community-posts', {
    method: 'POST',
    body: JSON.stringify({
      author_name: authorName,
      relationship,
      story,
      consent_given: true,
      ...(contactEmail ? { contact_email: contactEmail } : {}),
      ...(website ? { website } : {}),
    }),
  })
  return data
}
