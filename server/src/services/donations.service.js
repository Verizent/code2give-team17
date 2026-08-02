// DEMO-ONLY: createDonation records a succeeded donation directly without Stripe.
// Real version: POST /api/donations/checkout creates a Stripe Checkout Session;
// POST /api/webhooks/stripe marks succeeded on checkout.session.completed (§17).
const { ApiError } = require("../lib/api-error");
const { normalizeEmail } = require("../lib/normalize");
const donationsRepo = require("../data/donations.repo");
const donorsRepo = require("../data/donors.repo");
const donorsService = require("./donors.service");

const VALID_FREQUENCIES = new Set(["once", "weekly", "monthly"]);

/**
 * Creates a donation record for a donor (DEMO-ONLY: no Stripe, status is immediately succeeded).
 *
 * Donors do not choose a programme designation — every gift is unrestricted. See PLAN.md §3
 * ("No designation"); `donations.programme` was dropped from the schema on 1 Aug 2026.
 *
 * @param {{ email: string, amount_hkd: number, frequency?: string, campaign_id?: string|null }} input
 */
async function createDonation(input) {
  const email = normalizeEmail(input.email);
  if (!email || !email.includes("@")) {
    throw ApiError.badRequest("A valid email is required");
  }

  const amount = Number(input.amount_hkd);
  if (!Number.isInteger(amount) || amount < 1) {
    throw ApiError.badRequest("amount_hkd must be a positive integer");
  }

  const frequency = input.frequency ?? "once";
  if (!VALID_FREQUENCIES.has(frequency)) {
    throw ApiError.badRequest(`frequency must be one of: ${[...VALID_FREQUENCIES].join(", ")}`);
  }

  const donor = await donorsService.upsertDonor({ email, trackingOptIn: true });

  const donation = await donationsRepo.insertDonation({
    donor_id: donor.id,
    amount_hkd: amount,
    frequency,
    campaign_id: input.campaign_id ?? null,
    status: "succeeded",
  });

  return {
    ...donation,
    email: donor.email,
    access_token: donor.access_token,
  };
}

/**
 * @param {string} email Raw (un-normalised) email from caller.
 * @returns {Promise<boolean>}
 */
async function donorHasHistory(email) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const existing = await donorsRepo.findByEmail(normalized);
  return existing !== null;
}

/**
 * Post-payment optional feedback (PLAN.md §Phase C3). Never on the donate form (§15) —
 * only after payment succeeded, since the fields exist to say something about a gift the
 * donor already made.
 *
 * All fields optional. An empty body still updates (touching `updated_at`); the client
 * doesn't have to filter its payload.
 *
 * @param {string} donationId
 * @param {{ message?: string, referral_source?: string, referral_source_other?: string,
 *   is_anonymous?: boolean }} fields
 */
async function submitFeedback(donationId, fields) {
  const donation = await donationsRepo.findById(donationId);
  if (!donation) throw ApiError.notFound("Donation not found");
  if (donation.status !== "succeeded") {
    throw ApiError.badRequest("Feedback can only be submitted on a succeeded donation");
  }

  // Whitelist — never spread an untrusted body straight into an UPDATE.
  const clean = {};
  if (fields.message !== undefined) clean.message = fields.message;
  if (fields.referral_source !== undefined) clean.referral_source = fields.referral_source;
  if (fields.referral_source_other !== undefined) clean.referral_source_other = fields.referral_source_other;
  if (fields.is_anonymous !== undefined) clean.is_anonymous = fields.is_anonymous;

  return donationsRepo.updateFeedback(donationId, clean);
}

/**
 * Thanks-page poll for a Stripe checkout session (PLAN.md §3 A5).
 *
 * Keyed on the unguessable Stripe session id, so the route needs no auth — which is also
 * why the token is gated here rather than left to the caller.
 *
 * `tracking_token` is returned only when the donation actually succeeded **and** the donor
 * opted in. Both flags live on the donation row, so a pending or opted-out poll answers
 * without reading `donors` at all: fetching the donor and then discarding the token would
 * produce the same JSON while still touching a table this path has no business reading.
 *
 * `donor_id` is null between checkout and the webhook landing (donations.repo.js), so a
 * poll arriving mid-write returns the base shape rather than throwing.
 *
 * @param {string} sessionId Stripe Checkout Session id.
 * @returns {Promise<{ status: string, amount_hkd: number, frequency: string,
 *   events_credited: number|null, tracking_token?: string }>}
 * @throws {ApiError} 404 when no donation points at that session.
 */
async function getCheckoutStatus(sessionId) {
  const donation = await donationsRepo.findByStripeSession(sessionId);
  if (!donation) {
    throw ApiError.notFound("No donation found for that checkout session");
  }

  const status = {
    status: donation.status,
    amount_hkd: donation.amount_hkd,
    frequency: donation.frequency,
    events_credited: donation.events_credited,
  };

  if (donation.status !== "succeeded" || !donation.tracking_opt_in || !donation.donor_id) {
    return status;
  }

  const donor = await donorsRepo.findById(donation.donor_id);
  if (!donor?.access_token) {
    return status;
  }

  return { ...status, tracking_token: donor.access_token };
}

module.exports = { createDonation, donorHasHistory, submitFeedback, getCheckoutStatus };
