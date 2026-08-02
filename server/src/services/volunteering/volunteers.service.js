const volunteersRepo = require("../../data/volunteers.repo");
const verificationsRepo = require("../../data/volunteer-email-verifications.repo");
const signupsRepo = require("../../data/volunteer-signups.repo");
const badgesRepo = require("../../data/badges.repo");
const emailVerificationService = require("./email-verification.service");
const { normalizeEmail } = require("../../lib/normalize-email");
const { generateAccessToken } = require("../../lib/tokens");
const { ApiError } = require("../../lib/api-error");

function buildPageUrl(accessToken) {
  const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  return `${origin.replace(/\/$/, "")}/help/volunteer/${accessToken}`;
}

/**
 * @param {object} input
 */
async function registerVolunteer(input) {
  const email = normalizeEmail(input.email);
  await emailVerificationService.assertVerificationTokenForEmail(
    input.verification_token,
    email,
  );

  const existing = await volunteersRepo.findByEmail(email);

  if (existing) {
    const updated =
      existing.full_name !== input.full_name.trim() || !existing.email_verified_at
        ? await volunteersRepo.updateVolunteer(existing.id, {
            full_name: input.full_name.trim(),
            email_verified_at: existing.email_verified_at || new Date().toISOString(),
          })
        : existing;

    await verificationsRepo.revokeVerificationToken(input.verification_token);

    return {
      id: updated.id,
      email: updated.email,
      full_name: updated.full_name,
      access_token: updated.access_token,
      page_url: buildPageUrl(updated.access_token),
      claimed_at: updated.claimed_at,
      existing: true,
    };
  }

  const accessToken = generateAccessToken();
  const created = await volunteersRepo.createVolunteer({
    email,
    full_name: input.full_name.trim(),
    access_token: accessToken,
    locale: input.locale || "en",
    phone: input.phone || null,
    email_verified_at: new Date().toISOString(),
  });

  await verificationsRepo.revokeVerificationToken(input.verification_token);

  return {
    id: created.id,
    email: created.email,
    full_name: created.full_name,
    access_token: created.access_token,
    page_url: buildPageUrl(created.access_token),
    claimed_at: created.claimed_at,
    existing: false,
  };
}

/**
 * @param {string} accessToken
 */
async function getVolunteerPage(accessToken) {
  const volunteer = await volunteersRepo.findByAccessToken(accessToken);

  if (!volunteer) {
    throw ApiError.notFound("Volunteer not found");
  }

  const [upcomingSignups, totalHours, badges] = await Promise.all([
    signupsRepo.listUpcomingSignups(volunteer.id),
    signupsRepo.sumHoursForVolunteer(volunteer.id),
    badgesRepo.listBadgesForVolunteer(volunteer.id),
  ]);

  return {
    id: volunteer.id,
    email: volunteer.email,
    full_name: volunteer.full_name,
    locale: volunteer.locale,
    claimed_at: volunteer.claimed_at,
    can_make_permanent: volunteer.claimed_at === null,
    total_hours: totalHours,
    upcoming_signups: upcomingSignups,
    badges,
  };
}

/**
 * @param {string} accessToken
 * @param {string} profileId
 */
async function claimPermanentAccount(accessToken, profileId) {
  const volunteer = await volunteersRepo.findByAccessToken(accessToken);

  if (!volunteer) {
    throw ApiError.notFound("Volunteer not found");
  }

  if (volunteer.claimed_at) {
    return {
      id: volunteer.id,
      profile_id: volunteer.profile_id,
      claimed_at: volunteer.claimed_at,
      already_claimed: true,
    };
  }

  const updated = await volunteersRepo.updateVolunteer(volunteer.id, {
    profile_id: profileId,
    claimed_at: new Date().toISOString(),
  });

  return {
    id: updated.id,
    profile_id: updated.profile_id,
    claimed_at: updated.claimed_at,
    already_claimed: false,
  };
}

module.exports = {
  registerVolunteer,
  getVolunteerPage,
  claimPermanentAccount,
  buildPageUrl,
};
