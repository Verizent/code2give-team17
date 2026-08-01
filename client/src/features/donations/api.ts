import {
  IMPACT_LADDER,
  impactForAmount,
  wishlistItems,
  getWishlistItem,
  demoAccountExists,
  COVER_IMAGE_OPTIONS,
  type WishlistItem,
  type DonateProgramme,
} from '@/features/donations/fixtures'
import {
  listApprovedCampaigns,
  listMyCampaigns,
  getCampaign,
  saveCampaign,
  addDemoDonation,
  listPendingCampaigns,
  moderateCampaign,
  type Campaign,
  type CampaignStatus,
  type LocalCampaign,
} from '@/features/donations/campaign-store'

export function listWishlist() {
  return wishlistItems
}

export function fetchWishlistItem(id: string) {
  return getWishlistItem(id)
}

export function impactLadder() {
  return IMPACT_LADDER
}

export function describeImpact(amount: number) {
  return impactForAmount(amount)
}

export function coverOptions() {
  return COVER_IMAGE_OPTIONS
}

export {
  demoAccountExists,
  listApprovedCampaigns,
  listMyCampaigns,
  getCampaign,
  saveCampaign,
  addDemoDonation,
  listPendingCampaigns,
  moderateCampaign,
}

export type { WishlistItem, DonateProgramme, Campaign, CampaignStatus, LocalCampaign }
