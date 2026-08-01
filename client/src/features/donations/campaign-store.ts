import { COVER_IMAGE_OPTIONS } from '@/features/donations/fixtures'

export type LocalCampaign = {
  slug: string
  title: string
  story: string
  goal_hkd: number
  raised_hkd: number
  cover: string
  end_date: string
  status: 'pending_approval' | 'live'
  created_at: string
}

const KEY = 'love21-demo-campaigns'

function readAll(): LocalCampaign[] {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as LocalCampaign[]
  } catch {
    return []
  }
}

function writeAll(list: LocalCampaign[]) {
  sessionStorage.setItem(KEY, JSON.stringify(list))
}

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return base || `campaign-${Date.now().toString(36)}`
}

export function listCampaigns(): LocalCampaign[] {
  return readAll()
}

export function getCampaign(slug: string): LocalCampaign | undefined {
  return readAll().find((c) => c.slug === slug)
}

export function saveCampaign(input: {
  title: string
  story: string
  goal_hkd: number
  cover?: string
  end_date: string
}): LocalCampaign {
  const list = readAll()
  let slug = slugify(input.title)
  if (list.some((c) => c.slug === slug)) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`
  }
  const campaign: LocalCampaign = {
    slug,
    title: input.title,
    story: input.story,
    goal_hkd: input.goal_hkd,
    raised_hkd: 0,
    cover: input.cover || COVER_IMAGE_OPTIONS[0],
    end_date: input.end_date,
    // DEMO-ONLY: may go live without staff review in this build
    status: 'pending_approval',
    created_at: new Date().toISOString(),
  }
  list.unshift(campaign)
  writeAll(list)
  return campaign
}

export function addDemoDonation(slug: string, amount: number) {
  const list = readAll()
  const idx = list.findIndex((c) => c.slug === slug)
  if (idx < 0) return
  list[idx] = {
    ...list[idx],
    raised_hkd: list[idx].raised_hkd + amount,
    status: 'live',
  }
  writeAll(list)
}
