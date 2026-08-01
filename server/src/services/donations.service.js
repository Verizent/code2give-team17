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

module.exports = { createDonation, donorHasHistory, submitFeedback };
