import { apiClient, ApiError, apiData, isRealApiMode } from '@/lib/apiClient'
import {
  saveDonation,
  type GiftFrequency,
  type StoredDonation,
} from '@/features/donations/donation-store'
import type { DonateProgramme } from '@/features/donations/fixtures'

export type CheckoutInput = {
  amount_hkd: number
  frequency: GiftFrequency
  programme: DonateProgramme
  email: string
  receipt_name: string
  receipt_for_other?: boolean
  journey_opt_in: boolean
  campaign_slug?: string
}

export type CheckoutResult =
  | { mode: 'stripe'; url: string; donation: StoredDonation }
  | { mode: 'local'; donation: StoredDonation }

/**
 * Frontend checkout seam.
 * Tries real Stripe Checkout via API when available; otherwise persists locally
 * and records the gift on the server when possible.
 */
export async function startDonationCheckout(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  const publishable = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
  const canAttemptStripe =
    isRealApiMode() &&
    Boolean(publishable) &&
    !String(publishable).includes('replace_me')

  if (canAttemptStripe) {
    try {
      const res = await apiData<{ url: string }>('/api/donations/checkout', {
        method: 'POST',
        body: JSON.stringify({
          amount_hkd: input.amount_hkd,
          frequency: input.frequency === 'once' ? 'one_time' : input.frequency,
          designation: input.programme,
          email: input.email.trim().toLowerCase(),
          full_name: input.receipt_name.trim(),
          tracking_opt_in: input.journey_opt_in,
          campaign_id: input.campaign_slug,
          success_path: '/give/thanks',
          cancel_path: '/give',
        }),
      })
      if (res?.data?.url) {
        const donation = saveDonation({ ...input, stripe_redirected: true })
        return { mode: 'stripe', url: res.data.url, donation }
      }
    } catch (err) {
      // No checkout route yet, or Stripe unavailable — fall through to local.
      if (!(err instanceof ApiError)) throw err
    }
  }

  const donation = saveDonation(input)

  if (isRealApiMode()) {
    try {
      await apiData('/api/donations/record', {
        method: 'POST',
        body: JSON.stringify({
          amount_hkd: input.amount_hkd,
          frequency: input.frequency,
          programme: input.programme,
          email: input.email.trim().toLowerCase(),
          full_name: input.receipt_name.trim(),
          tracking_opt_in: input.journey_opt_in,
          campaign_id: input.campaign_slug ?? null,
        }),
      })
    } catch {
      // Local gift already saved — server sync is best-effort.
    }
  }

  return { mode: 'local', donation }
}

/** Ask backend to send a gift-use update; soft-fail for local path. */
export async function requestGiftJourneyNotify(input: {
  email: string
  donation_id: string
  stage: string
}): Promise<'sent' | 'local'> {
  try {
    await apiClient('/api/donors/notify', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    return 'sent'
  } catch {
    return 'local'
  }
}
