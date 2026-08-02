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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * `POST /api/donations/checkout` validates with a Zod **strictObject**, so an unknown key is a
 * 400 rather than a silently dropped field. It accepts exactly four: `amount_hkd`,
 * `frequency`, `campaign_id`, `tracking_opt_in`.
 *
 * This exists to stop the rest of what the form collects from reaching the wire. Those fields
 * are not ours to send:
 *
 *  - **email / name** — Stripe Checkout collects them natively and the webhook reads them back
 *    off the session (CONTEXT.md §15). Our form has no payer email field at all; the receipt
 *    fields are for the Section 88 receipt, which is a separate concern.
 *  - **programme / designation** — donors do not choose one. `donations.programme` was dropped
 *    from the schema on 1 Aug; every gift is unrestricted.
 *  - **success_path / cancel_path** — the server owns the return URLs.
 */
function toCheckoutBody(input: CheckoutInput) {
  const body: Record<string, unknown> = {
    amount_hkd: input.amount_hkd,
    // Passes through unmapped: the endpoint accepts all three the form offers. This used to
    // rewrite `weekly` to `monthly`, which billed a weekly pledge monthly without saying so.
    frequency: input.frequency,
    tracking_opt_in: input.journey_opt_in,
  }
  // `campaign_slug` is a human-readable slug; the column is a uuid. Sending a slug is a 400,
  // so an unresolvable campaign is dropped rather than failing the whole gift.
  if (input.campaign_slug && UUID_RE.test(input.campaign_slug)) {
    body.campaign_id = input.campaign_slug
  }
  return body
}

/**
 * Frontend checkout seam.
 *
 * Two modes, and the choice is made *before* the request, never as a reaction to one failing:
 *
 *  - **Stripe** whenever the API is real and a publishable key is configured. Errors from here
 *    propagate to the caller.
 *  - **local** only when Stripe was never an option — mock mode, or no key.
 *
 * There is deliberately no fallback from the first to the second. It used to catch `ApiError`
 * and save a localStorage "gift" instead, which meant a 400 from the checkout endpoint
 * rendered as a successful donation: the donor saw a thank-you page, no money moved, and
 * nothing was logged. The frontend had been sending a body the endpoint rejects for some time
 * and nobody noticed, because the fallback made a broken payment path look identical to a
 * working one. A payment that cannot complete must fail visibly.
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
    const res = await apiData<{ checkout_url: string; session_id: string }>(
      '/api/donations/checkout',
      { method: 'POST', body: JSON.stringify(toCheckoutBody(input)) },
    )
    // The endpoint returns `checkout_url`, not `url`. Reading the wrong key made a successful
    // 201 indistinguishable from a failure and silently dropped us into the local path.
    if (!res?.data?.checkout_url) {
      throw new ApiError('Checkout did not return a payment link', 502)
    }
    const donation = saveDonation({ ...input, stripe_redirected: true })
    return { mode: 'stripe', url: res.data.checkout_url, donation }
  }

  // Mock mode or no publishable key: record the gift locally so the UI still demos.
  // `POST /api/donations/record` used to be called here; that route has never existed
  // (the DEMO-ONLY route is `POST /api/donations`), so every call 404'd into an empty catch.
  return { mode: 'local', donation: saveDonation(input) }
}

/** Shape of `GET /api/donations/session/:session_id` (server: donations.service.js). */
export type CheckoutStatus = {
  status: 'pending' | 'succeeded' | 'failed' | 'refunded'
  amount_hkd: number
  frequency: string
  events_credited: number | null
  /** Present only once the donation succeeded AND the donor opted into tracking. */
  tracking_token?: string
}

/**
 * Thanks-page poll. Stripe returns the donor here the instant the card clears, but the
 * donation row is still `pending` until the `checkout.session.completed` webhook lands on our
 * side — a separate network hop we do not control the timing of. So the page arrives before
 * the data does, and has to wait for it.
 *
 * Keyed on the unguessable Stripe session id, which is why this needs no auth. `tracking_token`
 * is gated server-side on the donation having succeeded with tracking opted in.
 */
export async function fetchCheckoutStatus(sessionId: string): Promise<CheckoutStatus> {
  const res = await apiData<CheckoutStatus>(
    `/api/donations/session/${encodeURIComponent(sessionId)}`,
  )
  return res.data
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
