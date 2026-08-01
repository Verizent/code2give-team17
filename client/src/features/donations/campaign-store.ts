import { apiData } from '@/lib/apiClient'
import { COVER_IMAGE_OPTIONS } from '@/features/donations/fixtures'

/** Matches live Supabase `campaigns_status_check`. */
export type CampaignStatus = 'pending_approval' | 'approved' | 'rejected'

export type Campaign = {
  id: string
  slug: string
  title: string
  story: string
  goal_hkd: number
  raised_hkd: number
  /** Client alias for `cover_image_url`. */
  cover: string
  end_date: string
  status: CampaignStatus
  created_at: string
}

type ApiCampaign = {
  id: string
  slug: string
  title: string
  story: string
  goal_hkd: number
  raised_hkd: number
  cover_image_url: string
  end_date: string
  status: CampaignStatus
  created_at: string
}

const MINE_KEY = 'love21-my-campaign-slugs'

function mapCampaign(row: ApiCampaign): Campaign {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    story: row.story,
    goal_hkd: row.goal_hkd,
    raised_hkd: row.raised_hkd,
    cover: row.cover_image_url,
    end_date: row.end_date,
    status: row.status,
    created_at: row.created_at,
  }
}

function readMineSlugs(): string[] {
  try {
    const raw = sessionStorage.getItem(MINE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

function writeMineSlugs(slugs: string[]) {
  sessionStorage.setItem(MINE_KEY, JSON.stringify([...new Set(slugs)]))
}

export function rememberMyCampaign(slug: string) {
  const list = readMineSlugs()
  list.unshift(slug)
  writeMineSlugs(list)
}

/** Approved fundraisers only — public directory. */
export async function listApprovedCampaigns(): Promise<Campaign[]> {
  const { data } = await apiData<ApiCampaign[]>('/api/campaigns')
  return (data ?? []).map(mapCampaign)
}

/** Campaigns created in this browser, with live status from Supabase. */
export async function listMyCampaigns(): Promise<Campaign[]> {
  const slugs = readMineSlugs()
  if (!slugs.length) return []
  const results = await Promise.all(
    slugs.map(async (slug) => {
      try {
        return await getCampaign(slug)
      } catch {
        return null
      }
    }),
  )
  return results.filter((c): c is Campaign => Boolean(c))
}

export async function getCampaign(slug: string): Promise<Campaign | undefined> {
  try {
    const { data } = await apiData<ApiCampaign>(
      `/api/campaigns/${encodeURIComponent(slug)}`,
    )
    return data ? mapCampaign(data) : undefined
  } catch {
    return undefined
  }
}

export async function saveCampaign(input: {
  title: string
  story: string
  goal_hkd: number
  cover?: string
  end_date: string
}): Promise<Campaign> {
  const { data } = await apiData<ApiCampaign>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      story: input.story,
      goal_hkd: input.goal_hkd,
      cover_image_url: input.cover || COVER_IMAGE_OPTIONS[0],
      end_date: input.end_date,
    }),
  })
  const campaign = mapCampaign(data)
  rememberMyCampaign(campaign.slug)
  return campaign
}

/** @deprecated Prefer live raised_hkd from the API after donation record. */
export function addDemoDonation(_slug: string, _amount: number) {
  // no-op — raised totals live in Supabase now
}

export async function listPendingCampaigns(): Promise<Campaign[]> {
  const { data } = await apiData<ApiCampaign[]>(
    '/api/admin/campaigns?status=pending_approval',
  )
  return (data ?? []).map(mapCampaign)
}

export async function moderateCampaign(
  id: string,
  status: 'approved' | 'rejected',
): Promise<Campaign> {
  const { data } = await apiData<ApiCampaign>(
    `/api/admin/campaigns/${encodeURIComponent(id)}/moderate`,
    {
      method: 'POST',
      body: JSON.stringify({ status }),
    },
  )
  return mapCampaign(data)
}

/** @deprecated Use Campaign */
export type LocalCampaign = Campaign

export function listCampaigns(): Campaign[] {
  return []
}
