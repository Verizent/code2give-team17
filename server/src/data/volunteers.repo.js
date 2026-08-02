const { getServiceClient } = require("../config/supabase");
const { throwIfDbError } = require("./supabase-error");
const { normalizeEmail } = require("../lib/normalize-email");
const { generateAccessToken } = require("../lib/tokens");

async function findByEmail(email) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteers")
    .select("*")
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

async function findByAccessToken(accessToken) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteers")
    .select("*")
    .eq("access_token", accessToken)
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

async function findByProfileId(profileId) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteers")
    .select("*")
    .eq("profile_id", profileId)
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

/**
 * @param {object} values
 */
async function createVolunteer(values) {
  const db = getServiceClient();
  const { data, error } = await db.from("volunteers").insert(values).select().single();

  throwIfDbError(error, { conflictMessage: "A volunteer with this email already exists" });
  return data;
}

/**
 * @param {{ email: string, full_name: string, phone?: string | null, locale?: string, profile_id?: string | null }} input
 */
async function insert(input) {
  const profileId = input.profile_id ?? null;
  return createVolunteer({
    email: normalizeEmail(input.email),
    full_name: input.full_name,
    phone: input.phone ?? null,
    locale: input.locale === "zh-Hant" ? "zh-Hant" : "en",
    access_token: generateAccessToken(),
    profile_id: profileId,
    claimed_at: profileId ? new Date().toISOString() : null,
  });
}

/**
 * @param {string} volunteerId
 * @param {string} profileId
 */
async function claim(volunteerId, profileId) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteers")
    .update({
      profile_id: profileId,
      claimed_at: new Date().toISOString(),
    })
    .eq("id", volunteerId)
    .is("profile_id", null)
    .select()
    .single();

  throwIfDbError(error);
  return data;
}

/**
 * @param {string} id
 * @param {object} patch
 */
async function updateVolunteer(id, patch) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteers")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  throwIfDbError(error);
  return data;
}

/**
 * @param {string} volunteerId
 * @param {{ full_name?: string, phone?: string | null }} patch
 */
async function updateBasics(volunteerId, patch) {
  return updateVolunteer(volunteerId, patch);
}

/**
 * Records that the address was proved. Idempotent by intent — callers check
 * `email_verified_at` first, so this keeps the original proof time rather than moving it
 * forward on every later signup.
 *
 * @param {string} volunteerId
 */
async function markEmailVerified(volunteerId) {
  return updateVolunteer(volunteerId, { email_verified_at: new Date().toISOString() });
}

/**
 * Has this address already told us how it found Love 21?
 *
 * Mirrors donorsRepo.hasReferralSources. Selects the one column and returns a boolean, so
 * nothing about the volunteer can leak out through the caller by accident. Unknown address
 * and known-but-never-answered both come back false, which is what makes the endpoint above
 * useless as a way to test whether someone volunteers here.
 *
 * @param {string} email Already normalised by the caller.
 */
async function hasDiscoverySources(email) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteers")
    .select("discovery_sources")
    .eq("email", email)
    .maybeSingle();

  throwIfDbError(error);
  return (data?.discovery_sources?.length ?? 0) > 0;
}

/**
 * Records how the volunteer first heard about Love 21. Callers check that nothing is
 * recorded yet — it is asked once, and a later blank submission must not erase it.
 *
 * @param {string} volunteerId
 * @param {{ discovery_sources: string[], discovery_other: string | null }} patch
 */
async function setDiscovery(volunteerId, patch) {
  return updateVolunteer(volunteerId, patch);
}

module.exports = {
  hasDiscoverySources,
  setDiscovery,
  findByEmail,
  findByAccessToken,
  findByProfileId,
  createVolunteer,
  insert,
  claim,
  updateVolunteer,
  updateBasics,
  markEmailVerified,
};
