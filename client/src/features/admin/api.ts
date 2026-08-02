import { apiData, apiClient, type Envelope } from '@/lib/apiClient'

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

export type FunnelPayload = {
  stages: Array<{
    id: string
    label: string
    count: number
    conversion_from_prev: number | null
  }>
  dropoffs: Array<{
    from: string
    to: string
    from_label: string
    to_label: string
    lost: number
    rate: number
  }>
  sources: Array<{
    source: string
    label: string
    visitors: number
    volunteers: number
    donors: number
  }>
  seeded: boolean
  empty?: boolean
  period_label: string
  note?: string
}

export async function fetchAdminDashboard(): Promise<DashboardPayload> {
  const { data } = await apiData<DashboardPayload>('/api/admin/dashboard')
  return data
}

export async function fetchAdminFunnel(): Promise<FunnelPayload> {
  const { data } = await apiData<FunnelPayload>('/api/admin/funnel')
  return data
}

/** `null` means the denominator was empty — render "not enough data", never 0%. */
export type AnalyticsPayload = {
  donor_retention: {
    rate: number | null
    retained: number
    prior_donors: number
    current_donors: number
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
    attendance_count: number
    fill_rate: number | null
  }>
  acquisition: {
    donors: Array<{ source: string; count: number }>
    volunteers: Array<{ source: string; count: number }>
    available: boolean
  }
}

export async function fetchAdminAnalytics(): Promise<AnalyticsPayload> {
  const { data } = await apiData<AnalyticsPayload>('/api/admin/analytics')
  return data
}

export async function fetchCommunityPosts(status = 'pending'): Promise<{
  items: CommunityPost[]
  available: boolean
}> {
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
  const res = await apiClient<
    Envelope<AdminArticle[]> & { meta?: { available?: boolean } }
  >(`/api/admin/articles?status=${encodeURIComponent(status)}`)
  return {
    items: res.data ?? [],
    available: res.meta?.available !== false,
  }
}

export async function fetchAdminArticle(id: string): Promise<AdminArticle> {
  const { data } = await apiData<AdminArticle>(
    `/api/admin/articles/${encodeURIComponent(id)}`,
  )
  return data
}

export async function createAdminArticle(payload: ArticleWritePayload): Promise<AdminArticle> {
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
  const { data } = await apiData<AdminArticle>(
    `/api/admin/articles/${encodeURIComponent(id)}/publish`,
    { method: 'POST', body: '{}' },
  )
  return data
}

export async function unpublishAdminArticle(id: string): Promise<AdminArticle> {
  const { data } = await apiData<AdminArticle>(
    `/api/admin/articles/${encodeURIComponent(id)}/unpublish`,
    { method: 'POST', body: '{}' },
  )
  return data
}
