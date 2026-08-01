const crypto = require("node:crypto");
const { getServiceClient } = require("../config/supabase");
const { throwIfDbError } = require("./supabase-error");
const { normalizeEmail } = require("../lib/normalize-email");

/**
 * @param {object} values
 */
async function createVerification(values) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_email_verifications")
    .insert(values)
    .select()
    .single();

  throwIfDbError(error);
  return data;
}

async function findVerificationById(id) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_email_verifications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

async function findLatestVerificationForEmail(email) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_email_verifications")
    .select("*")
    .eq("email", normalizeEmail(email))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

/**
 * @param {string} id
 * @param {number} attempts
 */
async function incrementAttempts(id, attempts) {
  const db = getServiceClient();
  const { error } = await db
    .from("volunteer_email_verifications")
    .update({ attempts: attempts + 1 })
    .eq("id", id)
    .is("consumed_at", null);

  throwIfDbError(error);
}

/**
 * @param {string} id
 * @param {object} patch
 */
async function updateVerification(id, patch) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_email_verifications")
    .update(patch)
    .eq("id", id)
    .is("consumed_at", null)
    .select()
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

/**
 * @param {string} token
 */
async function revokeVerificationToken(token) {
  const db = getServiceClient();
  const { error } = await db
    .from("volunteer_email_verifications")
    .update({ verification_token: null, verification_token_expires_at: null })
    .eq("verification_token", token);

  throwIfDbError(error);
}

async function findConsumedVerificationByToken(token) {
  const db = getServiceClient();
  const { data, error } = await db
    .from("volunteer_email_verifications")
    .select("*")
    .eq("verification_token", token)
    .not("consumed_at", "is", null)
    .maybeSingle();

  throwIfDbError(error);
  return data;
}

function hashVerificationCode(code) {
  const secret = process.env.EMAIL_VERIFICATION_SECRET || "demo-only-secret";
  return crypto.createHmac("sha256", secret).update(code).digest("hex");
}

function codesMatch(providedCode, storedHash) {
  const providedHash = hashVerificationCode(providedCode);
  const a = Buffer.from(providedHash, "utf8");
  const b = Buffer.from(storedHash, "utf8");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  createVerification,
  findVerificationById,
  findLatestVerificationForEmail,
  incrementAttempts,
  updateVerification,
  revokeVerificationToken,
  findConsumedVerificationByToken,
  hashVerificationCode,
  codesMatch,
};
