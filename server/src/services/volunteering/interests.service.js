const opportunitiesRepo = require("../../data/volunteer-opportunities.repo");
const volunteersRepo = require("../../data/volunteers.repo");
const interestsRepo = require("../../data/volunteer-interests.repo");
const signupsService = require("./signups.service");
const opportunitiesService = require("./opportunities.service");
const emailLib = require("../../lib/email");
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

  // Deliver the enquiry itself, not just the contact. This path backs the organisation
  // panel and the volunteer hub form; it used to return `interest: null` and drop both
  // the message and the organisation, so a lead reached nobody.
  //
  // volunteer_interests cannot hold these rows — opportunity_id is NOT NULL and an
  // enquiry is not about one session — so staff are emailed instead. The volunteer row
  // above is the durable half: if the mail server is down the contact still survives.
  const organisation = body.organisation?.trim() || null;
  const message = body.message?.trim() || null;

  const subject = organisation
    ? `ENQUIRY FROM ${volunteer.full_name} <${volunteer.email}> — ${organisation}`
    : `ENQUIRY FROM ${volunteer.full_name} <${volunteer.email}>`;

  const text = [
    `Organisation:  ${organisation ?? "—"}`,
    `Name:          ${volunteer.full_name}`,
    `Email:         ${volunteer.email}`,
    `Phone:         ${body.phone?.trim() || "—"}`,
    "",
    "Message:",
    message ?? "(none)",
    "",
    "— Sent by the Love 21 volunteer page enquiry form.",
  ].join("\n");

  let delivered = false;
  try {
    const result = await emailLib.sendEmail({
      to: process.env.ENQUIRY_TO || process.env.SMTP_USER || process.env.EMAIL_FROM,
      subject,
      text,
    });
    delivered = result.delivered;
  } catch (error) {
    // Do not fail the request: the visitor did their part and the contact is saved. But
    // say so loudly, because a silently swallowed send is the bug this whole change is
    // about — nobody would learn the lead never arrived.
    console.error(`[enquiry] delivery failed for ${volunteer.email}: ${error.message}`);
  }

  return {
    interest: null,
    delivered,
    volunteer: {
      id: volunteer.id,
      email: volunteer.email,
      full_name: volunteer.full_name,
    },
    opportunity: null,
  };
}

module.exports = { expressInterest, registerInterest, registerProgrammeInterest };
