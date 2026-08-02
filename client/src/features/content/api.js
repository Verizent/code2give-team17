import { apiClient, apiData, API_MODE, toApiLocale } from '@/lib/apiClient'
import { impactFixture, articlesFixture } from '@/lib/mock'
import { pickLocale } from '@/lib/home-content'

/**
 * Collapse a fixture article's localised maps into the flat strings the API
 * already returns, so callers cannot tell live rows from fallback rows.
 */
function resolveFixtureArticle(article, locale) {
  return {
    ...article,
    title: pickLocale(article.title, locale),
    excerpt: pickLocale(article.excerpt, locale),
    cover_alt: pickLocale(article.cover_alt, locale),
  }
}

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
 * GET /api/articles — the Home stories strip.
 *
 * `locale` goes through toApiLocale because the backend enum is `en | zh-Hant`
 * only; sending the site's `zh-Hans` verbatim is a 400, not a fallback.
 *
 * DEMO-ONLY: falls back to articlesFixture on any failure rather than surfacing an
 * error, so a server hiccup never leaves a hole in the landing page mid-demo. Real
 * version should render a retry affordance instead of swallowing it.
 *
 * @param {{locale?: string, limit?: number, category?: string, isFeatured?: boolean}} options
 * @returns {Promise<Array<object>>} locale-resolved article rows, newest first
 */
export async function getArticles({ locale = 'en', limit = 3, category, isFeatured } = {}) {
  const fallback = () =>
    articlesFixture
      .filter((a) => (category ? a.category === category : true))
      .filter((a) => (isFeatured === undefined ? true : a.is_featured === isFeatured))
      .slice(0, limit)
      .map((a) => resolveFixtureArticle(a, locale))

  if (API_MODE !== 'real') return fallback()

  const params = new URLSearchParams({ locale: toApiLocale(locale), limit: String(limit) })
  if (category) params.set('category', category)
  // The backend reads an explicit "true"/"false" string here — a coerced boolean
  // would make `false` truthy and silently return featured articles instead.
  if (isFeatured !== undefined) params.set('is_featured', isFeatured ? 'true' : 'false')

  try {
    const { data } = await apiData(`/api/articles?${params}`)
    return Array.isArray(data) && data.length ? data : fallback()
  } catch (error) {
    console.error('getArticles failed, using fixture', error)
    return fallback()
  }
}

/**
 * The single featured report behind the Home "Read our full Annual Report" bar.
 * Returns null when the API has no report to offer, which is the signal for the
 * bar to keep its hardcoded PDF link rather than render a dead in-site route.
 *
 * @param {string} locale
 * @returns {Promise<object|null>}
 */
export async function getReportArticle(locale = 'en') {
  const [report] = await getArticles({ locale, limit: 1, category: 'report' })
  return report ?? null
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
