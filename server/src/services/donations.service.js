// DEMO-ONLY: createDonation records a succeeded donation directly without Stripe.
// Real version: POST /api/donations/checkout creates a Stripe Checkout Session;
// POST /api/webhooks/stripe marks succeeded on checkout.session.completed (§17).
const { ApiError } = require("../lib/api-error");
const { normalizeEmail } = require("../lib/normalize");
const donationsRepo = require("../data/donations.repo");
const donorsRepo = require("../data/donors.repo");
const donorsService = require("./donors.service");

const VALID_FREQUENCIES = new Set(["once", "weekly", "monthly"]);
const VALID_PROGRAMMES = new Set(["sports", "fitness", "nutrition", "family", "where_needed"]);

/**
 * Creates a donation record for a donor (DEMO-ONLY: no Stripe, status is immediately succeeded).
 *
 * @param {{ email: string, amount_hkd: number, frequency?: string, programme?: string }} input
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

  const programme = input.programme ?? "where_needed";
  if (!VALID_PROGRAMMES.has(programme)) {
    throw ApiError.badRequest(`programme must be one of: ${[...VALID_PROGRAMMES].join(", ")}`);
  }

  const donor = await donorsService.upsertDonor({ email, trackingOptIn: true });

  const donation = await donationsRepo.insertDonation({
    donor_id: donor.id,
    amount_hkd: amount,
    frequency,
    programme,
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

module.exports = { createDonation, donorHasHistory };
