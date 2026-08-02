const signupsRepo = require("../../data/volunteer-signups.repo");
const { ApiError } = require("../../lib/api-error");

// §23 columns — split into two sets so the service can gate feedback fields on
// signup.status === 'attended' but let discovery fields land any time.
const DISCOVERY_FIELDS = new Set([
  "discovery_source",
  "discovery_source_other",
  "signup_motivation",
]);
const FEEDBACK_FIELDS = new Set([
  "experience_rating",
  "would_return",
  "improvement_note",
]);

/**
 * @param {string} signupId
 * @param {Record<string, unknown>} body Validated `patchSignupBodySchema`.
 */
async function patchSignup(signupId, body) {
  const existing = await signupsRepo.findSignupById(signupId);
  if (!existing) {
    throw ApiError.notFound("Signup not found");
  }

  const includesFeedback = Object.keys(body).some((key) =>
    FEEDBACK_FIELDS.has(key),
  );

  if (includesFeedback && existing.status !== "attended") {
    throw ApiError.badRequest(
      "Feedback can only be submitted after the signup is marked attended",
    );
  }

  const patch = { ...body };
  if (includesFeedback && !existing.feedback_submitted_at) {
    patch.feedback_submitted_at = new Date().toISOString();
  }

  return signupsRepo.patchSignupFields(signupId, patch);
}

module.exports = { patchSignup, DISCOVERY_FIELDS, FEEDBACK_FIELDS };
