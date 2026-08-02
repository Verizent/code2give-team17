import { apiClient } from '@/lib/apiClient'
import {
  IMPACT_LADDER,
  impactForAmount,
  wishlistItems as fixtureWishlist,
  COVER_IMAGE_OPTIONS,
  type WishlistItem,
  type DonateProgramme,
} from '@/features/donations/fixtures'

export type LocalCampaign = {
  slug: string
  title: string
  story: string
  goal_hkd: number
  raised_hkd: number
  cover: string
  end_date: string
  status: 'pending_approval' | 'approved' | 'rejected'
  created_at: string
}

export type DonationFrequency = 'once' | 'weekly' | 'monthly'

export type CreateDonationInput = {
  amount_hkd: number
  email: string
  frequency: DonationFrequency
  programme: DonateProgramme
  campaign_slug?: string
}

export type DonationResult = {
  id: string
  amount_hkd: number
  frequency: DonationFrequency
  programme: DonateProgramme
  status: string
  created_at: string
  email: string
  campaign_slug: string | null
  access_token: string
}

export type PledgeInput = {
  name: string
  email: string
  quantity: number
}

/** Impact ladder stays client-side (static copy). */
export function impactLadder() {
  return IMPACT_LADDER
}

export function describeImpact(amount: number) {
  return impactForAmount(amount)
}

export function coverOptions() {
  return COVER_IMAGE_OPTIONS
}

export async function listWishlist(): Promise<WishlistItem[]> {
  try {
    const res = await apiClient<{ items: WishlistItem[] }>('/api/wishlist')
    return res.items.length ? res.items : fixtureWishlist
  } catch {
    return fixtureWishlist
  }
}

export async function pledgeWishlistItem(id: string, input: PledgeInput) {
  return apiClient<{ pledge: unknown; item: WishlistItem }>(`/api/wishlist/${id}/pledge`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export type CampaignFeed = {
  public: LocalCampaign[]
  mine: LocalCampaign[]
}

const MY_CAMPAIGN_SLUGS_KEY = 'love21-my-campaign-slugs'

function readMyCampaignSlugs(): string[] {
  try {
    const raw = localStorage.getItem(MY_CAMPAIGN_SLUGS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : []
  } catch {
    return []
  }
}

export function rememberMyCampaign(slug: string) {
  const slugs = new Set(readMyCampaignSlugs())
  slugs.add(slug)
  localStorage.setItem(MY_CAMPAIGN_SLUGS_KEY, JSON.stringify([...slugs]))
}

export async function listCampaigns(): Promise<CampaignFeed> {
  const slugs = readMyCampaignSlugs()
  const query = slugs.length ? `?slugs=${slugs.map(encodeURIComponent).join(',')}` : ''
  return apiClient<CampaignFeed>(`/api/campaigns${query}`)
}

export async function getCampaign(slug: string): Promise<LocalCampaign | undefined> {
  try {
    return await apiClient<LocalCampaign>(`/api/campaigns/${slug}`)
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
}): Promise<LocalCampaign> {
  return apiClient<LocalCampaign>('/api/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      title: input.title,
      story: input.story,
      goal_hkd: input.goal_hkd,
      end_date: input.end_date,
      cover_image_url: input.cover,
    }),
  }).then((campaign) => {
    rememberMyCampaign(campaign.slug)
    return campaign
  })
}

/**
 * DEMO-ONLY: records a succeeded gift without Stripe Checkout.
 * Real version: POST /api/donations/checkout → Stripe redirect.
 */
export async function createDonation(input: CreateDonationInput): Promise<DonationResult> {
  return apiClient<DonationResult>('/api/donations', {
    method: 'POST',
    body: JSON.stringify({
      amount_hkd: input.amount_hkd,
      email: input.email,
      frequency: input.frequency,
      programme: input.programme,
      campaign_slug: input.campaign_slug,
    }),
  })
}

export async function donorHasHistory(email: string): Promise<boolean> {
  if (!email.trim()) return false
  const res = await apiClient<{ exists: boolean }>(
    `/api/donations/donor-exists?email=${encodeURIComponent(email)}`,
  )
  return res.exists
}

export type { WishlistItem, DonateProgramme }
