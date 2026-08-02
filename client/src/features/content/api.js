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
export async function submitVoice({
  authorName,
  relationship,
  story,
  contactEmail,
  photoUrl,
  website,
}) {
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
      ...(photoUrl ? { photo_url: photoUrl } : {}),
      ...(website ? { website } : {}),
    }),
  })
  return data
}

/**
 * POST /api/uploads/community-photo — store a Voices photo, get back its public URL.
 *
 * Sends the File as a raw body, not multipart: the endpoint takes exactly one image and
 * no other fields. The Content-Type is the browser's guess and the server does not trust
 * it — it sniffs the bytes — so a wrong guess is rejected rather than believed.
 *
 * Throws ApiError; the dialog shows the message.
 *
 * @param {File} file
 * @returns {Promise<string>} public URL
 */
export async function uploadCommunityPhoto(file) {
  if (API_MODE !== 'real') return null

  const { data } = await apiClient('/api/uploads/community-photo', {
    method: 'POST',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  return data.photo_url
}

/**
 * GET /api/community-posts — approved Voices for the Ability Wall.
 *
 * Returns `[]` rather than throwing on failure: the feed also renders curated
 * stories, and blanking the whole wall because one request failed is worse than
 * showing fewer cards. `meta` is dropped — the wall is not paginated.
 *
 * @param {{ limit?: number }} [options]
 * @returns {Promise<object[]>} raw rows: { id, author_name, relationship, story, photo_url, submitted_at }
 */
export async function listVoices({ limit = 50 } = {}) {
  if (API_MODE !== 'real') return []

  try {
    const { data } = await apiClient(`/api/community-posts?limit=${limit}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('listVoices failed, showing curated stories only', error)
    return []
  }
}

/**
 * GET /api/instagram — active embeds for the Ability Wall, curated in the admin screen.
 *
 * The API resolves `caption` and attaches `shortcode`, so nothing here parses a URL.
 * Returns `[]` on failure: the wall has plenty else to show.
 *
 * @param {string} [locale]
 * @returns {Promise<object[]>}
 */
export async function listInstagram(locale = 'en') {
  if (API_MODE !== 'real') return []

  try {
    const { data } = await apiClient(`/api/instagram?locale=${toApiLocale(locale)}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('listInstagram failed, omitting embeds', error)
    return []
  }
}

/**
 * GET /api/articles — the Home featured strip.
 *
 * The API resolves `_en`/`_zh` into plain `title` / `excerpt` / `cover_alt` for the
 * requested locale, so call sites read those directly. Returns `[]` on failure, which
 * makes the strip hide itself rather than break the page.
 *
 * @param {{ locale?: string, category?: string, limit?: number, isFeatured?: boolean }} [options]
 * @returns {Promise<object[]>}
 */
export async function listArticles({ locale = 'en', category, limit = 3, isFeatured } = {}) {
  if (API_MODE !== 'real') return []

  const params = new URLSearchParams({ locale: toApiLocale(locale), limit: String(limit) })
  if (category) params.set('category', category)
  // Explicit "true"/"false" strings: the API rejects anything else, and a coerced
  // boolean would read "false" as true.
  if (isFeatured !== undefined) params.set('is_featured', isFeatured ? 'true' : 'false')

  try {
    const { data } = await apiClient(`/api/articles?${params}`)
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('listArticles failed, hiding the strip', error)
    return []
  }
}

/**
 * GET /api/articles/:slug — the article detail page.
 *
 * Throws (unlike the list calls) because there is nothing else on the page to show:
 * the detail route needs to tell the difference between "not found" and "failed".
 *
 * @param {string} slug
 * @param {string} [locale]
 * @returns {Promise<object>}
 */
export async function getArticle(slug, locale = 'en') {
  const { data } = await apiClient(
    `/api/articles/${encodeURIComponent(slug)}?locale=${toApiLocale(locale)}`,
  )
  return data
}
