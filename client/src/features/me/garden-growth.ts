/**
 * Shared Impact Garden growth — same 1–4 tree as Giving “impact growth”,
 * with pillars ordered: education → volunteering → donations (money + items).
 */

import {
  clampGrowthStage,
  cumulativeGrowthLevel,
  isSessionGiftStage,
  type GiftJourneyItem,
  type GrowthStage,
} from '@/features/donations/components/gift-journey-tree'

export type GardenPillars = {
  education_count: number
  session_count: number
  hours_total: number
  gifts: GiftJourneyItem[]
  item_pledges: number
  item_lines: number
}

/**
 * Level 1–4 matching GiftJourneyTree cumulative growth.
 * Learn raises the early floor; volunteering the mid tree; money/items
 * and multi-pillar depth unlock the mature canopy (4).
 *
 * Arc: seed → sprout → sapling → young / mature grove
 */
export function computeGardenLevel(pillars: GardenPillars): GrowthStage {
  const {
    education_count,
    session_count,
    hours_total,
    gifts,
    item_pledges,
    item_lines,
  } = pillars

  let level: GrowthStage = 1

  // 1–3 · Learn first
  if (education_count >= 1) level = 2
  if (education_count >= 2) level = Math.max(level, 3) as GrowthStage

  // 2–4 · Volunteering — show up
  if (hours_total > 0 || session_count > 0) {
    level = Math.max(level, 3) as GrowthStage
  }
  if (hours_total >= 3 || session_count >= 1) {
    level = Math.max(level, 4) as GrowthStage
  }

  // Donations — money (same curve as Giving tab)
  if (gifts.length > 0) {
    level = Math.max(level, cumulativeGrowthLevel(gifts)) as GrowthStage
  }

  // Item pledges count as giving
  if (item_pledges >= 1 || item_lines >= 1) {
    level = Math.max(level, gifts.length > 0 ? 4 : 3) as GrowthStage
  }
  if (item_pledges >= 3 || item_lines >= 2) {
    level = Math.max(level, 4) as GrowthStage
  }

  // Multi-pillar depth → mature (4)
  const hasLearn = education_count >= 1
  const hasVolunteer = hours_total > 0 || session_count > 0
  const hasMoney = gifts.length > 0
  const hasItems = item_pledges > 0 || item_lines > 0
  const pillarsActive = [hasLearn, hasVolunteer, hasMoney || hasItems].filter(Boolean).length
  const sessionGifts = gifts.filter((g) => isSessionGiftStage(String(g.stage))).length

  if (pillarsActive >= 2) level = Math.max(level, 4) as GrowthStage
  if (sessionGifts >= 1) level = 4

  return clampGrowthStage(level)
}

export function gardenFruitCount(pillars: GardenPillars): number {
  const sessions = pillars.gifts.filter((g) => isSessionGiftStage(String(g.stage))).length
  return Math.min(
    6,
    sessions + Math.floor(pillars.hours_total / 6) + Math.min(3, pillars.item_lines),
  )
}
