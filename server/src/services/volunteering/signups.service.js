const volunteersRepo = require("../../data/volunteers.repo");
const signupsRepo = require("../../data/volunteer-signups.repo");
const opportunitiesService = require("./opportunities.service");
const { normalizeEmail } = require("../../lib/normalize-email");
const { ApiError } = require("../../lib/api-error");

/**
 * @param {{ email: string, full_name: string, phone?: string | null, locale?: string, user?: { id: string } | null }} input
 */
async function resolveVolunteer(input) {
  const email = normalizeEmail(input.email);
  let volunteer = await volunteersRepo.findByEmail(email);

  if (!volunteer) {
    volunteer = await volunteersRepo.insert({
      email,
      full_name: input.full_name,
      phone: input.phone,
      locale: input.locale,
      profile_id: input.user?.id ?? null,
    });
    return volunteer;
  }

  if (input.user?.id && !volunteer.profile_id) {
    volunteer = await volunteersRepo.claim(volunteer.id, input.user.id);
  }

  if (input.full_name && input.full_name !== volunteer.full_name) {
    volunteer = await volunteersRepo.updateBasics(volunteer.id, {
      full_name: input.full_name,
      phone: input.phone ?? volunteer.phone,
    });
  }

  return volunteer;
}

/**
 * Guest-friendly auto-confirm signup — matches frontend short signup form.
 *
 * @param {object} body
 * @param {{ id: string } | null | undefined} user
 */
async function createSignup(body, user) {
  const { row, localFilled } = await opportunitiesService.assertSeatAvailable(body.opportunity_id);

  const volunteer = await resolveVolunteer({
    email: body.email,
    full_name: body.full_name,
    phone: body.phone,
    locale: body.locale,
    user,
  });

  try {
    const signup = await signupsRepo.createSignup({
      opportunity_id: body.opportunity_id,
      volunteer_id: volunteer.id,
      profile_id: user?.id ?? volunteer.profile_id,
      status: "confirmed",
    });

    await opportunitiesService.syncStatusAfterSignup(body.opportunity_id, localFilled + 1);

    const opportunity = await opportunitiesService.getOpportunityById(body.opportunity_id);

    return {
      signup,
      volunteer: {
        id: volunteer.id,
        email: volunteer.email,
        full_name: volunteer.full_name,
      },
      opportunity,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      throw error;
    }
    throw error;
  }
}

/**
 * @param {string} volunteerId
 * @param {string} opportunityId
 * @param {string} [profileId]
 */
async function createSignupForVolunteer(volunteerId, opportunityId, profileId) {
  const { localFilled } = await opportunitiesService.assertSeatAvailable(opportunityId);

  const signup = await signupsRepo.createSignup({
    opportunity_id: opportunityId,
    volunteer_id: volunteerId,
    profile_id: profileId || null,
    status: "confirmed",
  });

  await opportunitiesService.syncStatusAfterSignup(opportunityId, localFilled + 1);
  return signup;
}

/**
 * @param {string} volunteerId
 * @param {{ opportunityId?: string }} [filters]
 */
async function listSignups(volunteerId, filters = {}) {
  return signupsRepo.listSignupsForVolunteer(volunteerId, {
    opportunityId: filters.opportunityId,
  });
}

/**
 * @param {string} signupId
 * @param {string} volunteerId
 */
async function deleteSignup(signupId, volunteerId) {
  const signup = await signupsRepo.findSignupById(signupId);

  if (!signup) {
    throw ApiError.notFound("Signup not found");
  }

  if (signup.volunteer_id !== volunteerId) {
    throw ApiError.forbidden();
  }

  if (signup.status === "cancelled") {
    return;
  }

  await signupsRepo.cancelSignup(signupId);
  await opportunitiesService.syncStatusAfterCancel(signup.opportunity_id);
}

/**
 * @param {string} signupId
 * @param {{ id: string, email?: string }} user
 */
async function cancelSignup(signupId, user) {
  const signup = await signupsRepo.findSignupById(signupId);
  if (!signup || signup.status === "cancelled") {
    throw ApiError.notFound("Signup not found");
  }

  const volunteer =
    (await volunteersRepo.findByProfileId(user.id)) ||
    (user.email ? await volunteersRepo.findByEmail(user.email) : null);

  if (!volunteer || volunteer.id !== signup.volunteer_id) {
    throw ApiError.forbidden("You can only cancel your own signup");
  }

  const cancelled = await signupsRepo.cancelSignup(signupId);
  await opportunitiesService.syncStatusAfterCancel(signup.opportunity_id);
  return cancelled;
}

module.exports = {
  resolveVolunteer,
  createSignup,
  createSignupForVolunteer,
  listSignups,
  deleteSignup,
  cancelSignup,
};
