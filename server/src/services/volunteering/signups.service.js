const volunteersRepo = require("../../data/volunteers.repo");
const signupsRepo = require("../../data/signups.repo");
const opportunitiesRepo = require("../../data/opportunities.repo");
const interestsRepo = require("../../data/interests.repo");
const { ApiError } = require("../../lib/api-error");
const { toPublic } = require("./opportunities.service");

function normaliseEmail(email) {
  return String(email).trim().toLowerCase();
}

/**
 * Find or create a volunteer by normalised email; claim profile when authenticated.
 *
 * @param {{ email: string, full_name: string, phone?: string | null, locale?: string, user?: { id: string, email?: string } | null }} input
 */
async function resolveVolunteer(input) {
  const email = normaliseEmail(input.email);
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
 * Auto-confirm signup (no staff gate). Guests allowed.
 *
 * @param {object} body
 * @param {{ id: string } | null | undefined} user
 */
async function createSignup(body, user) {
  const claim = await signupsRepo.claimSpot(body.opportunity_id);
  if (!claim.ok) {
    if (!claim.opportunity) {
      throw ApiError.notFound("Opportunity not found");
    }
    throw ApiError.conflict("This opportunity is full");
  }

  const opportunity = await opportunitiesRepo.findOpenById(body.opportunity_id);
  if (!opportunity) {
    await signupsRepo.releaseSpot(body.opportunity_id);
    throw ApiError.notFound("Opportunity not found");
  }

  const volunteer = await resolveVolunteer({
    email: body.email,
    full_name: body.full_name,
    phone: body.phone,
    locale: body.locale,
    user,
  });

  try {
    const signup = await signupsRepo.insert({
      opportunity_id: body.opportunity_id,
      volunteer_id: volunteer.id,
      profile_id: user?.id ?? volunteer.profile_id,
      status: "confirmed",
    });

    return {
      signup,
      volunteer: {
        id: volunteer.id,
        email: volunteer.email,
        full_name: volunteer.full_name,
      },
      opportunity: toPublic(opportunity),
    };
  } catch (error) {
    await signupsRepo.releaseSpot(body.opportunity_id);
    throw error;
  }
}

/**
 * @param {string} signupId
 * @param {{ id: string }} user
 */
async function cancelSignup(signupId, user) {
  const signup = await signupsRepo.findById(signupId);
  if (!signup || signup.status === "cancelled") {
    throw ApiError.notFound("Signup not found");
  }

  const volunteer =
    (await volunteersRepo.findByProfileId(user.id)) ||
    (user.email ? await volunteersRepo.findByEmail(normaliseEmail(user.email)) : null);

  if (!volunteer || volunteer.id !== signup.volunteer_id) {
    throw ApiError.forbidden("You can only cancel your own signup");
  }

  const cancelled = await signupsRepo.cancel(signupId);
  await signupsRepo.releaseSpot(signup.opportunity_id);
  return cancelled;
}

/**
 * Authed volunteer home: sessions + badge progress (hours from Love 21 signups only).
 *
 * @param {{ id: string, email?: string, user_metadata?: { full_name?: string } }} user
 */
async function getVolunteerMe(user) {
  const email = user.email ? normaliseEmail(user.email) : null;
  let volunteer = await volunteersRepo.findByProfileId(user.id);

  if (!volunteer && email) {
    volunteer = await volunteersRepo.findByEmail(email);
    if (volunteer && !volunteer.profile_id) {
      volunteer = await volunteersRepo.claim(volunteer.id, user.id);
    }
  }

  if (!volunteer) {
    return {
      volunteer: null,
      signups: [],
      interests: [],
      stats: {
        session_count: 0,
        hours_total: 0,
        programme_count: 0,
        interest_count: 0,
      },
    };
  }

  const signups = await signupsRepo.listByVolunteerId(volunteer.id);
  const enriched = [];

  for (const signup of signups) {
    const opportunity = await opportunitiesRepo.findOpenById(signup.opportunity_id);
    let hours = Number(signup.hours_logged) || 0;
    if (!hours && opportunity?.starts_at && opportunity?.ends_at) {
      const ms =
        new Date(opportunity.ends_at).getTime() - new Date(opportunity.starts_at).getTime();
      if (ms > 0) hours = Math.round((ms / 3_600_000) * 10) / 10;
    }
    if (!hours) hours = 1.5;

    enriched.push({
      ...signup,
      hours,
      opportunity: opportunity ? toPublic(opportunity) : null,
    });
  }

  const interestRows = await interestsRepo.listByVolunteerId(volunteer.id);
  const interests = [];
  for (const row of interestRows) {
    const opportunity = await opportunitiesRepo.findOpenById(row.opportunity_id);
    interests.push({
      id: row.id,
      message: row.message,
      created_at: row.created_at,
      opportunity: opportunity ? toPublic(opportunity) : null,
    });
  }

  const programmes = new Set(
    enriched.map((s) => s.opportunity?.programme).filter(Boolean),
  );
  const hours_total =
    Math.round(enriched.reduce((sum, s) => sum + s.hours, 0) * 10) / 10;

  return {
    volunteer: {
      id: volunteer.id,
      email: volunteer.email,
      full_name: volunteer.full_name,
      phone: volunteer.phone,
      locale: volunteer.locale,
      profile_id: volunteer.profile_id,
    },
    signups: enriched,
    interests,
    stats: {
      session_count: enriched.length,
      hours_total,
      programme_count: programmes.size,
      interest_count: interests.length,
    },
  };
}

module.exports = {
  createSignup,
  cancelSignup,
  getVolunteerMe,
  resolveVolunteer,
  normaliseEmail,
};
