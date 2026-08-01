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
  listCampaigns,
  getCampaign,
  saveCampaign,
  addDemoDonation,
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
  listCampaigns,
  getCampaign,
  saveCampaign,
  addDemoDonation,
}

export type { WishlistItem, DonateProgramme, LocalCampaign }
