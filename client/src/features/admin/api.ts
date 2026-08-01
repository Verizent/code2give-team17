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
  pending_proofs?: number
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

export type AttendanceSession = {
  id: string
  title: string
  location: string
  programme: string
  starts_at: string
  ends_at: string
  capacity: number
  spots_filled: number
  source: string
  headcount_confirmed: number
  headcount_expected: number
  signups: Array<{
    id: string
    status: string
    hours_logged: number
    attended_at: string | null
    volunteer: { id: string; full_name: string | null; email: string | null }
  }>
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

export type ProofItem = {
  id: string
  title: string
  programme: string
  captured_at: string
  consent: 'consented' | 'partial' | 'none'
  members_visible: number
  members_blurred: number
  thumb: string
  status: 'pending' | 'approved'
  approved_at: string | null
  fanout: {
    website_story: { locale: string; headline: string; excerpt: string; path: string }
    drafts: Array<{ channel: string; lang: string; caption: string }>
    languages: string[]
    stats_delta: { sessions_featured: number; photos_published: number }
    blur_note: string
  } | null
}

export type SocialDraft = {
  id: string
  channel: 'instagram' | 'facebook'
  lang: 'en' | 'zh-Hant' | 'zh-Hans'
  caption: string
  status: 'draft' | 'queued' | 'copied'
  scheduled_for: string | null
  proof_id: string | null
  created_at: string
}

export async function fetchAdminDashboard(): Promise<DashboardPayload> {
  const { data } = await apiData<DashboardPayload>('/api/admin/dashboard')
  return data
}

export async function fetchAdminFunnel(): Promise<FunnelPayload> {
  const { data } = await apiData<FunnelPayload>('/api/admin/funnel')
  return data
}

export async function fetchProofs(): Promise<{ items: ProofItem[]; available: boolean }> {
  const res = await apiClient<Envelope<ProofItem[]> & { meta?: { available?: boolean } }>(
    '/api/admin/proofs',
  )
  return {
    items: res.data ?? [],
    available: res.meta?.available !== false,
  }
}

export async function approveProof(id: string): Promise<ProofItem> {
  const { data } = await apiData<ProofItem>(
    `/api/admin/proofs/${encodeURIComponent(id)}/approve`,
    { method: 'POST', body: '{}' },
  )
  return data
}

export async function fetchSocialDrafts(): Promise<{ items: SocialDraft[]; available: boolean }> {
  const res = await apiClient<Envelope<SocialDraft[]> & { meta?: { available?: boolean } }>(
    '/api/admin/social',
  )
  return {
    items: res.data ?? [],
    available: res.meta?.available !== false,
  }
}

export async function scheduleSocialDraft(id: string, scheduled_for: string) {
  const { data } = await apiData<SocialDraft>(
    `/api/admin/social/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ scheduled_for }),
    },
  )
  return data
}

export async function markSocialCopied(id: string) {
  const { data } = await apiData<SocialDraft>(
    `/api/admin/social/${encodeURIComponent(id)}/copy`,
    { method: 'POST', body: '{}' },
  )
  return data
}

export async function fetchAttendance(from?: string, to?: string): Promise<{
  sessions: AttendanceSession[]
  from: string
  to: string
}> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()
  const path = qs ? `/api/admin/attendance?${qs}` : '/api/admin/attendance'
  const res = await apiClient<Envelope<AttendanceSession[]> & { meta?: { from?: string; to?: string } }>(
    path,
  )
  return {
    sessions: res.data ?? [],
    from: res.meta?.from ?? '',
    to: res.meta?.to ?? '',
  }
}

export async function markSignupAttended(
  signupId: string,
  hours_logged?: number,
): Promise<{ signup: { id: string; status: string }; badges_awarded: string[] }> {
  const { data } = await apiData<{
    signup: { id: string; status: string }
    badges_awarded: string[]
  }>(`/api/admin/volunteer-signups/${encodeURIComponent(signupId)}/attendance`, {
    method: 'POST',
    body: JSON.stringify(hours_logged != null ? { hours_logged } : {}),
  })
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
