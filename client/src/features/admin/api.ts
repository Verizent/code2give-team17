import { apiData, apiClient, type Envelope } from '@/lib/apiClient'
import {
  ADMIN_STUB,
  analyticsFixture,
  articles as stubArticles,
  communityPosts as stubPosts,
  dashboardFixture,
  instagram as stubInstagram,
  readingTime,
  slugify,
  stubFind,
  stubList,
  stubNow,
  stubRemove,
  stubUpdate,
  wishlist as stubWishlist,
} from './fixtures'

export type DashboardMetrics = {
  donations_total_hkd: number
  donations_count: number
  volunteer_sessions_upcoming: number
  volunteer_spots_open: number
  interests_count: number
  pending_campaigns: number
  pending_voices: number
  voices_available: boolean
  impact_current?: boolean
}

export type DashboardQueueItem = {
  id: string
  title: string
  detail: string
  count: number | null
  href: string
}

export type DashboardPayload = {
  metrics: DashboardMetrics
  charts: {
    donations_by_month: Array<{ month: string; amount_hkd: number }>
    volunteer_hours_by_month: Array<{ month: string; hours: number }>
  }
  queue: DashboardQueueItem[]
}

export type CommunityPost = {
  id: string
  author_name: string
  relationship: string
  story: string
  photo_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
}

export async function fetchAdminDashboard(): Promise<DashboardPayload> {
  if (ADMIN_STUB) return dashboardFixture()
  const { data } = await apiData<DashboardPayload>('/api/admin/dashboard')
  return data
}

/** `null` means the denominator was empty — render "not enough data", never 0%. */
export type AnalyticsPayload = {
  range: string
  donor_retention: {
    rate: number | null
    retained: number
    prior_donors: number
    current_donors: number
    prior_window_label: string
    current_window_label: string
    /** The 40–45% sector benchmark is annual; false means do not print it. */
    benchmark_applies: boolean
  }
  repeat_gift: { rate: number | null; repeat_donors: number; total_donors: number }
  capacity_fill: { rate: number | null; attended: number; capacity: number }
  satisfaction: {
    average_rating: number | null
    would_return_rate: number | null
    responses: number
  }
  donations_by_month: Array<{ month: string; amount_hkd: number }>
  programmes: Array<{
    programme: string
    capacity: number
    signups: number
    attended: number
    fill_rate: number | null
  }>
  acquisition: {
    donors: Array<{ source: string; count: number }>
    volunteers: Array<{ source: string; count: number }>
    available: boolean
  }
}

export async function fetchAdminAnalytics(range = 'all'): Promise<AnalyticsPayload> {
  if (ADMIN_STUB) return analyticsFixture(range)
  const { data } = await apiData<AnalyticsPayload>(
    `/api/admin/analytics?range=${encodeURIComponent(range)}`,
  )
  return data
}

export async function fetchCommunityPosts(status = 'pending'): Promise<{
  items: CommunityPost[]
  available: boolean
}> {
  if (ADMIN_STUB) {
    const items = stubList(stubPosts).filter((p) => status === 'all' || p.status === status)
    return { items, available: true }
  }
  const res = await apiClient<
    Envelope<CommunityPost[]> & { meta?: { available?: boolean } }
  >(`/api/admin/community-posts?status=${encodeURIComponent(status)}`)
  return {
    items: res.data ?? [],
    available: res.meta?.available !== false,
  }
}

export async function moderateCommunityPost(
  id: string,
  status: 'approved' | 'rejected',
): Promise<CommunityPost> {
  if (ADMIN_STUB) return stubUpdate(stubPosts, id, { status })
  const { data } = await apiData<CommunityPost>(
    `/api/admin/community-posts/${encodeURIComponent(id)}/moderate`,
    {
      method: 'POST',
      body: JSON.stringify({ status }),
    },
  )
  return data
}

export type AdminArticle = {
  id: string
  slug: string
  category: 'news' | 'education' | 'report'
  title_en: string
  title_zh: string | null
  excerpt_en: string | null
  excerpt_zh: string | null
  body_en?: Array<{ type: string; text?: string }>
  body_zh?: Array<{ type: string; text?: string }>
  cover_image_url: string | null
  cover_alt_en: string | null
  cover_alt_zh: string | null
  author: string | null
  status: 'draft' | 'published' | 'archived'
  published_at: string | null
  tags: string[]
  is_featured: boolean
  reading_time_minutes: number | null
  meta_title_en?: string | null
  meta_title_zh?: string | null
  meta_description_en?: string | null
  meta_description_zh?: string | null
  og_image_url?: string | null
  updated_at?: string
}

export type ArticleWritePayload = {
  category: 'news' | 'education' | 'report'
  title_en: string
  title_zh?: string
  excerpt_en?: string
  excerpt_zh?: string
  body_en?: Array<{ type: 'paragraph'; text: string }>
  body_zh?: Array<{ type: 'paragraph'; text: string }>
  cover_image_url?: string
  cover_alt_en?: string
  cover_alt_zh?: string
  author?: string
  tags?: string[]
  is_featured?: boolean
  meta_title_en?: string
  meta_description_en?: string
}

export async function fetchAdminArticles(status = 'all'): Promise<{
  items: AdminArticle[]
  available: boolean
}> {
  if (ADMIN_STUB) {
    const items = stubList(stubArticles).filter((a) => status === 'all' || a.status === status)
    return { items, available: true }
  }
  const res = await apiClient<
    Envelope<AdminArticle[]> & { meta?: { available?: boolean } }
  >(`/api/admin/articles?status=${encodeURIComponent(status)}`)
  return {
    items: res.data ?? [],
    available: res.meta?.available !== false,
  }
}

export async function fetchAdminArticle(id: string): Promise<AdminArticle> {
  if (ADMIN_STUB) return stubFind(stubArticles, id)
  const { data } = await apiData<AdminArticle>(
    `/api/admin/articles/${encodeURIComponent(id)}`,
  )
  return data
}

export async function createAdminArticle(payload: ArticleWritePayload): Promise<AdminArticle> {
  if (ADMIN_STUB) {
    const created: AdminArticle = {
      id: `art-stub-${stubArticles.length + 1}-${payload.title_en.length}`,
      // Mirrors the server: the slug is derived once, on create, and a later
      // rename never moves the public URL.
      slug: slugify(payload.title_en),
      category: payload.category,
      title_en: payload.title_en,
      title_zh: payload.title_zh ?? null,
      excerpt_en: payload.excerpt_en ?? null,
      excerpt_zh: payload.excerpt_zh ?? null,
      body_en: payload.body_en,
      body_zh: payload.body_zh,
      cover_image_url: payload.cover_image_url ?? null,
      cover_alt_en: payload.cover_alt_en ?? null,
      cover_alt_zh: payload.cover_alt_zh ?? null,
      author: payload.author ?? 'Love 21 Foundation',
      status: 'draft',
      published_at: null,
      tags: payload.tags ?? [],
      is_featured: payload.is_featured ?? false,
      reading_time_minutes: readingTime(payload.body_en),
      updated_at: stubNow(),
    }
    stubArticles.unshift(created)
    return { ...created }
  }
  const { data } = await apiData<AdminArticle>('/api/admin/articles', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export async function updateAdminArticle(
  id: string,
  payload: Partial<ArticleWritePayload> & { slug?: string },
): Promise<AdminArticle> {
  if (ADMIN_STUB) return stubUpdate(stubArticles, id, { ...payload, updated_at: stubNow() })
  const { data } = await apiData<AdminArticle>(
    `/api/admin/articles/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )
  return data
}

export async function publishAdminArticle(id: string): Promise<AdminArticle> {
  if (ADMIN_STUB) {
    return stubUpdate(stubArticles, id, { status: 'published', published_at: stubNow() })
  }
  const { data } = await apiData<AdminArticle>(
    `/api/admin/articles/${encodeURIComponent(id)}/publish`,
    { method: 'POST', body: '{}' },
  )
  return data
}

export async function unpublishAdminArticle(id: string): Promise<AdminArticle> {
  if (ADMIN_STUB) {
    return stubUpdate(stubArticles, id, { status: 'draft', published_at: null })
  }
  const { data } = await apiData<AdminArticle>(
    `/api/admin/articles/${encodeURIComponent(id)}/unpublish`,
    { method: 'POST', body: '{}' },
  )
  return data
}

export type AdminWishlistItem = {
  id: string
  title_en: string
  title_zh: string
  why_en: string
  why_zh: string
  needed: number
  /** Derived from wishlist_pledges by the pledge RPC — never sent on a write. */
  pledged: number
  image_url: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

/** `id` is the slug and is settable on create only; a rename would move the public URL. */
export type WishlistCreatePayload = {
  id: string
  title_en: string
  title_zh: string
  why_en: string
  why_zh: string
  needed: number
  image_url: string
  is_active?: boolean
}

export type WishlistUpdatePayload = Partial<Omit<WishlistCreatePayload, 'id'>>

export async function fetchAdminWishlist(): Promise<AdminWishlistItem[]> {
  if (ADMIN_STUB) return stubList(stubWishlist)
  const res = await apiClient<Envelope<AdminWishlistItem[]>>('/api/admin/wishlist?limit=50')
  return res.data ?? []
}

export async function fetchAdminWishlistItem(id: string): Promise<AdminWishlistItem> {
  if (ADMIN_STUB) return stubFind(stubWishlist, id)
  const { data } = await apiData<AdminWishlistItem>(
    `/api/admin/wishlist/${encodeURIComponent(id)}`,
  )
  return data
}

export async function createAdminWishlistItem(
  payload: WishlistCreatePayload,
): Promise<AdminWishlistItem> {
  if (ADMIN_STUB) {
    if (stubWishlist.some((w) => w.id === payload.id)) {
      throw new Error(`A wishlist item with the id “${payload.id}” already exists.`)
    }
    const created: AdminWishlistItem = {
      ...payload,
      // Pledges are derived server-side and always start empty on a new item.
      pledged: 0,
      is_active: payload.is_active ?? true,
      created_at: stubNow(),
      updated_at: stubNow(),
    }
    stubWishlist.push(created)
    return { ...created }
  }
  const { data } = await apiData<AdminWishlistItem>('/api/admin/wishlist', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export async function updateAdminWishlistItem(
  id: string,
  payload: WishlistUpdatePayload,
): Promise<AdminWishlistItem> {
  if (ADMIN_STUB) return stubUpdate(stubWishlist, id, { ...payload, updated_at: stubNow() })
  const { data } = await apiData<AdminWishlistItem>(
    `/api/admin/wishlist/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  )
  return data
}

/** Server answers 204 with no body, so there is nothing to unwrap. */
export async function deleteAdminWishlistItem(id: string): Promise<void> {
  if (ADMIN_STUB) return stubRemove(stubWishlist, id)
  await apiClient(`/api/admin/wishlist/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export type AdminInstagramEmbed = {
  id: string
  url: string
  caption_en: string | null
  caption_zh: string | null
  thumbnail_url: string | null
  display_order: number
  is_active: boolean
}

export async function fetchInstagramEmbeds(): Promise<AdminInstagramEmbed[]> {
  if (ADMIN_STUB) {
    return stubList(stubInstagram).sort((a, b) => a.display_order - b.display_order)
  }
  const res = await apiClient<Envelope<AdminInstagramEmbed[]>>('/api/admin/instagram?limit=50')
  return res.data ?? []
}

export async function createInstagramEmbed(
  body: Partial<AdminInstagramEmbed>,
): Promise<AdminInstagramEmbed> {
  if (ADMIN_STUB) {
    const created: AdminInstagramEmbed = {
      id: `ig-stub-${stubInstagram.length + 1}`,
      url: body.url ?? '',
      caption_en: body.caption_en ?? null,
      caption_zh: body.caption_zh ?? null,
      thumbnail_url: body.thumbnail_url ?? null,
      display_order: body.display_order ?? stubInstagram.length + 1,
      is_active: body.is_active ?? true,
    }
    stubInstagram.push(created)
    return { ...created }
  }
  const { data } = await apiData<AdminInstagramEmbed>('/api/admin/instagram', {
    method: 'POST',
    body: JSON.stringify(body),
  })
  return data
}

export async function updateInstagramEmbed(
  id: string,
  body: Partial<AdminInstagramEmbed>,
): Promise<AdminInstagramEmbed> {
  if (ADMIN_STUB) return stubUpdate(stubInstagram, id, body)
  const { data } = await apiData<AdminInstagramEmbed>(
    `/api/admin/instagram/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(body) },
  )
  return data
}

export async function deleteInstagramEmbed(id: string): Promise<void> {
  if (ADMIN_STUB) return stubRemove(stubInstagram, id)
  await apiClient(`/api/admin/instagram/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

/**
 * Uploads a cover image and returns its public URL.
 *
 * Sends raw bytes with the file's own Content-Type — the server mounts express.raw on
 * this route only. FormData would have needed a multipart parser added as a shared
 * dependency; base64 would inflate every upload by a third.
 */
export async function uploadCoverImage(file: File): Promise<string> {
  // Shows the operator's own file rather than a stand-in photo. The URL dies with
  // the tab, which is the whole lifetime of a stubbed session.
  if (ADMIN_STUB) return URL.createObjectURL(file)
  const { data } = await apiData<{ url: string }>('/api/admin/uploads/cover', {
    method: 'POST',
    body: file,
    // Overrides apiClient's JSON default; the body is the image itself.
    headers: { 'Content-Type': file.type },
  })
  return data.url
}
