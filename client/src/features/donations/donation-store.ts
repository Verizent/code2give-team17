import type { DonateProgramme } from '@/features/donations/fixtures'

export type GiftFrequency = 'once' | 'weekly' | 'monthly'

/** Gift journey stages — not an x=y calculator. */
export type JourneyStage = 'received' | 'matched' | 'session_update'

export type StoredDonation = {
  id: string
  amount_hkd: number
  frequency: GiftFrequency
  programme: DonateProgramme
  email: string
  /** Name printed on the Section 88 receipt */
  receipt_name: string
  /** True when receipt is issued under someone other than the payer/account */
  receipt_for_other: boolean
  journey_opt_in: boolean
  stage: JourneyStage
  campaign_slug?: string
  created_at: string
  /** Set when frontend successfully handed off to Stripe Checkout */
  stripe_redirected?: boolean
  /** Optional session that this gift helped support (journey stage 3) */
  session_title?: string
  session_when?: string
}

const KEY = 'love21-demo-donations'

function readAll(): StoredDonation[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as StoredDonation[]
  } catch {
    return []
  }
}

function writeAll(list: StoredDonation[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

function id() {
  return `gift_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function listDonations(): StoredDonation[] {
  return readAll()
}

export function getDonation(donationId: string): StoredDonation | undefined {
  return readAll().find((d) => d.id === donationId)
}

export function saveDonation(input: {
  amount_hkd: number
  frequency: GiftFrequency
  programme: DonateProgramme
  email: string
  receipt_name: string
  receipt_for_other?: boolean
  journey_opt_in: boolean
  campaign_slug?: string
  stripe_redirected?: boolean
}): StoredDonation {
  const donation: StoredDonation = {
    id: id(),
    amount_hkd: Math.max(1, Math.round(input.amount_hkd)),
    frequency: input.frequency,
    programme: input.programme,
    email: input.email.trim().toLowerCase(),
    receipt_name: input.receipt_name.trim(),
    receipt_for_other: Boolean(input.receipt_for_other),
    journey_opt_in: input.journey_opt_in,
    stage: 'received',
    campaign_slug: input.campaign_slug,
    created_at: new Date().toISOString(),
    stripe_redirected: input.stripe_redirected,
  }
  const list = readAll()
  list.unshift(donation)
  writeAll(list)
  return donation
}

const STAGE_ORDER: JourneyStage[] = ['received', 'matched', 'session_update']

export function advanceDonationStage(donationId: string): StoredDonation | undefined {
  const list = readAll()
  const idx = list.findIndex((d) => d.id === donationId)
  if (idx < 0) return undefined
  const current = list[idx].stage
  const next = STAGE_ORDER[Math.min(STAGE_ORDER.indexOf(current) + 1, STAGE_ORDER.length - 1)]
  list[idx] = { ...list[idx], stage: next }
  writeAll(list)
  return list[idx]
}

export function updateDonationNotify(
  donationId: string,
  journey_opt_in: boolean,
  email: string,
): StoredDonation | undefined {
  const list = readAll()
  const idx = list.findIndex((d) => d.id === donationId)
  if (idx < 0) return undefined
  list[idx] = {
    ...list[idx],
    journey_opt_in,
    email: email.trim().toLowerCase(),
  }
  writeAll(list)
  return list[idx]
}

/**
 * Inject sample gifts at each journey stage for the given email (local demo only).
 * Idempotent — skips if sample ids already exist.
 */
export function seedSampleGifts(email: string): StoredDonation[] {
  const normalised = email.trim().toLowerCase()
  if (!normalised) return listDonations()

  const samples: StoredDonation[] = [
    {
      id: 'gift_sample_received',
      amount_hkd: 500,
      frequency: 'once',
      programme: 'sports',
      email: normalised,
      receipt_name: '',
      receipt_for_other: false,
      journey_opt_in: true,
      stage: 'received',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'gift_sample_matched',
      amount_hkd: 1000,
      frequency: 'monthly',
      programme: 'nutrition',
      email: normalised,
      receipt_name: '',
      receipt_for_other: false,
      journey_opt_in: true,
      stage: 'matched',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'gift_sample_session',
      amount_hkd: 2500,
      frequency: 'once',
      programme: 'sports',
      email: normalised,
      receipt_name: '',
      receipt_for_other: false,
      journey_opt_in: true,
      stage: 'session_update',
      session_title: 'Saturday sports club',
      session_when: '12 July 2026',
      created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]

  const existing = readAll()
  const sampleIds = new Set(samples.map((s) => s.id))
  const merged = [
    ...samples.map((s) => {
      const prev = existing.find((d) => d.id === s.id)
      return prev ? { ...prev, ...s, email: normalised } : s
    }),
    ...existing.filter((d) => !sampleIds.has(d.id)),
  ]
  writeAll(merged)
  return merged
}
