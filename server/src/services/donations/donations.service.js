const donorsRepo = require("../../data/donors.repo");
const donationsRepo = require("../../data/donations.repo");
const { ApiError } = require("../../lib/api-error");

function normaliseEmail(email) {
  return String(email).trim().toLowerCase();
}

/**
 * Map client frequency onto the live donations check constraint (`once` | `weekly` | `monthly`).
 *
 * @param {string} frequency
 */
function mapFrequency(frequency) {
  if (frequency === "one_time" || frequency === "once") return "once";
  if (frequency === "weekly") return "weekly";
  if (frequency === "monthly" || frequency === "recurring") return "monthly";
  return "once";
}

/**
 * @param {object} body
 * @param {{ id: string, email?: string } | null | undefined} user
 */
async function recordDonation(body, user) {
  const email = normaliseEmail(body.email);
  let donor = await donorsRepo.findByEmail(email);

  if (!donor) {
    donor = await donorsRepo.insert({
      email,
      full_name: body.full_name,
      locale: body.locale,
      tracking_opt_in: body.tracking_opt_in ?? false,
      profile_id: user?.id ?? null,
    });
  } else {
    const patch = {};
    if (body.tracking_opt_in != null) patch.tracking_opt_in = body.tracking_opt_in;
    if (body.full_name) patch.full_name = body.full_name;
    if (user?.id && !donor.profile_id) patch.profile_id = user.id;
    if (Object.keys(patch).length) {
      donor = await donorsRepo.update(donor.id, patch);
    }
  }

  const donation = await donationsRepo.insert({
    donor_id: donor.id,
    amount_hkd: body.amount_hkd,
    frequency: mapFrequency(body.frequency),
    programme: body.programme,
    campaign_id: body.campaign_id,
    status: "pending",
  });

  return { donor: publicDonor(donor), donation };
}

function publicDonor(donor) {
  return {
    id: donor.id,
    email: donor.email,
    full_name: donor.full_name,
    locale: donor.locale,
    tracking_opt_in: donor.tracking_opt_in,
    access_token: donor.access_token,
    profile_id: donor.profile_id,
  };
}

/**
 * @param {{ id: string, email?: string }} user
 */
async function getDonationsMe(user) {
  let donor = await donorsRepo.findByProfileId(user.id);
  const email = user.email ? normaliseEmail(user.email) : null;

  if (!donor && email) {
    donor = await donorsRepo.findByEmail(email);
    if (donor && !donor.profile_id) {
      donor = await donorsRepo.update(donor.id, { profile_id: user.id });
    }
  }

  if (!donor) {
    return { donor: null, donations: [] };
  }

  const donations = await donationsRepo.listByDonorId(donor.id);
  return { donor: publicDonor(donor), donations };
}

/**
 * Guest tracking page — capability via access_token (no auth).
 *
 * @param {string} token
 */
async function trackByToken(token) {
  const donor = await donorsRepo.findByAccessToken(token);
  if (!donor) {
    throw ApiError.notFound("Tracking link not found");
  }
  const donations = await donationsRepo.listByDonorId(donor.id);
  return { donor: publicDonor(donor), donations };
}

/**
 * Privacy property: identical response for known and unknown addresses.
 *
 * @param {string} email
 */
async function recoverLink(email) {
  const normalised = normaliseEmail(email);
  const donor = await donorsRepo.findByEmail(normalised);
  // Real version emails the token via Resend. We never reveal whether the address exists.
  void donor;
  return {
    ok: true,
    message: "If we have gifts for that email, a tracking link is on its way.",
  };
}

/**
 * Soft notify endpoint — accepts the payload; live email is a later cutover.
 */
async function notifyGiftJourney(_body) {
  return { ok: true, delivered: false };
}

module.exports = {
  recordDonation,
  getDonationsMe,
  trackByToken,
  recoverLink,
  notifyGiftJourney,
  mapFrequency,
  normaliseEmail,
};
