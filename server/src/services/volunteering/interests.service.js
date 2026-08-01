const opportunitiesRepo = require("../../data/volunteer-opportunities.repo");
const volunteersRepo = require("../../data/volunteers.repo");
const interestsRepo = require("../../data/volunteer-interests.repo");
const signupsService = require("./signups.service");
const opportunitiesService = require("./opportunities.service");
const { normalizeEmail } = require("../../lib/normalize-email");
const { generateAccessToken } = require("../../lib/tokens");
const { ApiError } = require("../../lib/api-error");

/**
 * @param {string} opportunityId
 * @param {object} input
 */
async function expressInterest(opportunityId, input) {
  const opportunity = await opportunitiesRepo.findOpenById(opportunityId);

  if (!opportunity) {
    throw ApiError.notFound("Opportunity not found");
  }

  const volunteer = await signupsService.resolveVolunteer({
    email: input.email,
    full_name: input.full_name,
    phone: input.phone,
    locale: input.locale,
    user: null,
  });

  const interest = await interestsRepo.createInterest({
    opportunity_id: opportunityId,
    volunteer_id: volunteer.id,
    message: input.message || null,
  });

  const counts = await interestsRepo.countByOpportunityIds([opportunityId]);
  const localCounts = await opportunitiesRepo.countLocalSignupsByOpportunity([opportunityId]);

  return {
    interest,
    volunteer: {
      id: volunteer.id,
      email: volunteer.email,
      full_name: volunteer.full_name,
    },
    opportunity: opportunitiesService.toPublic(
      opportunity,
      counts.get(opportunityId) ?? 1,
      localCounts.get(opportunityId) ?? 0,
    ),
  };
}

/**
 * @param {string} opportunityId
 * @param {object} body
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

  const interest = await interestsRepo.createInterest({
    opportunity_id: opportunityId,
    volunteer_id: volunteer.id,
    message: body.message ?? null,
  });

  const counts = await interestsRepo.countByOpportunityIds([opportunityId]);
  const localCounts = await opportunitiesRepo.countLocalSignupsByOpportunity([opportunityId]);

  return {
    interest,
    volunteer: {
      id: volunteer.id,
      email: volunteer.email,
      full_name: volunteer.full_name,
    },
    opportunity: opportunitiesService.toPublic(
      opportunity,
      counts.get(opportunityId) ?? 1,
      localCounts.get(opportunityId) ?? 0,
    ),
  };
}

/**
 * Programme-level interest with no listing attached.
 *
 * @param {object} body
 */
async function registerProgrammeInterest(body) {
  const email = normalizeEmail(body.email);
  let volunteer = await volunteersRepo.findByEmail(email);

  if (!volunteer) {
    volunteer = await volunteersRepo.createVolunteer({
      email,
      full_name: body.full_name.trim(),
      phone: body.phone ?? null,
      locale: body.locale || "en",
      access_token: generateAccessToken(),
    });
  }

  return {
    interest: null,
    volunteer: {
      id: volunteer.id,
      email: volunteer.email,
      full_name: volunteer.full_name,
    },
    opportunity: null,
    message: body.message ?? null,
  };
}

module.exports = { expressInterest, registerInterest, registerProgrammeInterest };
