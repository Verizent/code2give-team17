const opportunitiesRepo = require("../../data/opportunities.repo");
const interestsRepo = require("../../data/interests.repo");
const { ApiError } = require("../../lib/api-error");
const signupsService = require("./signups.service");
const { toPublic } = require("./opportunities.service");

/**
 * Register interest in a listing (lead, not a booking — §17).
 * Does not bump spots_filled.
 *
 * @param {string} opportunityId
 * @param {{ full_name: string, email: string, phone?: string | null, locale?: string, message?: string | null }} body
 * @param {{ id: string, email?: string } | null | undefined} user
 */
async function registerInterest(opportunityId, body, user) {
  const opportunity = await opportunitiesRepo.findOpenById(opportunityId);
  if (!opportunity) {
    throw ApiError.notFound("Opportunity not found");
  }

  const volunteer = await signupsService.resolveVolunteer({
    email: body.email,
    full_name: body.full_name,
    phone: body.phone,
    locale: body.locale,
    user,
  });

  const interest = await interestsRepo.insert({
    opportunity_id: opportunityId,
    volunteer_id: volunteer.id,
    message: body.message ?? null,
  });

  const counts = await interestsRepo.countByOpportunityIds([opportunityId]);

  return {
    interest,
    volunteer: {
      id: volunteer.id,
      email: volunteer.email,
      full_name: volunteer.full_name,
    },
    opportunity: toPublic(opportunity, counts.get(opportunityId) ?? 1),
  };
}

module.exports = { registerInterest };
