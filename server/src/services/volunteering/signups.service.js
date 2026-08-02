const volunteersRepo = require("../../data/volunteers.repo");
const signupsRepo = require("../../data/volunteer-signups.repo");
const opportunitiesService = require("./opportunities.service");
const emailVerification = require("./email-verification.service");
const emailLib = require("../../lib/email");
const { renderSignupConfirmation } = require("../../lib/email-templates");
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
  // Prove the address before anything else. This endpoint is unauthenticated by design —
  // a guest must be able to sign up — which without a proof of ownership meant anyone
  // could sign up anyone: the owner was never told, and the confirmation landed in a
  // stranger's inbox. Checked ahead of assertSeatAvailable so a stream of unverified
  // requests cannot exhaust a session's capacity on its way to failing.
  //
  // A signed-in caller using their own address is already proved: Supabase Auth would not
  // have issued the JWT otherwise. The addresses must match — being logged in says nothing
  // about an address that is not yours, and treating it as proof would reopen the hole for
  // anyone with an account.
  const signedInAsSelf =
    Boolean(user?.email) && normalizeEmail(user.email) === normalizeEmail(body.email);

  if (!signedInAsSelf) {
    await emailVerification.assertVerificationTokenForEmail(body.verification_token, body.email);
  }

  const { row } = await opportunitiesService.assertSeatAvailable(body.opportunity_id);

  const volunteer = await resolveVolunteer({
    email: body.email,
    full_name: body.full_name,
    phone: body.phone,
    locale: body.locale,
    user,
  });

  // Kept on volunteers rather than derived from the verification row, so the short-lived
  // proof can be deleted without losing the fact that it happened.
  if (!volunteer.email_verified_at) {
    await volunteersRepo.markEmailVerified(volunteer.id);
  }

  // Asked once. Skipped when nothing was offered, and never overwritten — a volunteer who
  // answered on their first signup is not re-asked, and a later blank submission must not
  // erase what they told us.
  const offered = body.discovery_sources ?? [];
  const alreadyAnswered = (volunteer.discovery_sources ?? []).length > 0;

  if (offered.length > 0 && !alreadyAnswered) {
    await volunteersRepo.setDiscovery(volunteer.id, {
      discovery_sources: offered,
      // The note belongs to 'other' and the database rejects it otherwise. Dropping a stray
      // one here keeps it from failing an otherwise perfectly good signup.
      discovery_other: offered.includes("other") ? body.discovery_other?.trim() || null : null,
    });
  }

  try {
    const signup = await signupsRepo.createSignup({
      opportunity_id: body.opportunity_id,
      volunteer_id: volunteer.id,
      profile_id: user?.id ?? volunteer.profile_id,
      status: "confirmed",
    });


    const opportunity = await opportunitiesService.getOpportunityById(body.opportunity_id);

    // Confirm the spot in writing. Before this a volunteer heard nothing at all between
    // signing up and turning up: the only email in the track fired after attendance, by
    // which point the session had already happened. Failure is logged, never thrown — the
    // seat is already taken, and losing the signup because the mail server was down would
    // be far worse than losing the email.
    try {
      const rendered = renderSignupConfirmation(volunteer, { ...row, ...opportunity }, signup);
      await emailLib.sendEmail({
        to: volunteer.email,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
      });
    } catch (error) {
      console.error(
        `[signup] confirmation email failed for signup ${signup.id}: ${error.message}`,
      );
    }

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
  await opportunitiesService.assertSeatAvailable(opportunityId);

  const signup = await signupsRepo.createSignup({
    opportunity_id: opportunityId,
    volunteer_id: volunteerId,
    profile_id: profileId || null,
    status: "confirmed",
  });

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
