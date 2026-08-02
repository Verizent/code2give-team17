const verificationsRepo = require("../../data/volunteer-email-verifications.repo");
const { normalizeEmail } = require("../../lib/normalize-email");
const {
  generateVerificationCode,
  generateVerificationToken,
} = require("../../lib/tokens");
const { ApiError } = require("../../lib/api-error");

const TTL_MINUTES = Number.parseInt(
  process.env.EMAIL_VERIFICATION_TTL_MINUTES || "15",
  10,
);
const MAX_ATTEMPTS = Number.parseInt(
  process.env.EMAIL_VERIFICATION_MAX_ATTEMPTS || "5",
  10,
);
const TOKEN_TTL_MINUTES = Number.parseInt(
  process.env.EMAIL_VERIFICATION_TOKEN_TTL_MINUTES || "30",
  10,
);

/**
 * Uniform response — identical whether the address is known or unknown.
 *
 * @param {string} email
 */
async function startVerification(email) {
  const normalised = normalizeEmail(email);
  const code = generateVerificationCode();
  const codeHash = verificationsRepo.hashVerificationCode(code);
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000).toISOString();

  const row = await verificationsRepo.createVerification({
    email: normalised,
    code_hash: codeHash,
    expires_at: expiresAt,
  });

  const response = {
    id: row.id,
    email: normalised,
    expires_at: row.expires_at,
  };

  if (process.env.EMAIL_MODE === "console") {
    response.demo_code = code;
  }

  return response;
}

/**
 * @param {string} id
 * @param {string} code
 */
async function confirmVerification(id, code) {
  const row = await verificationsRepo.findVerificationById(id);

  if (!row) {
    throw ApiError.notFound("Verification not found");
  }

  if (row.consumed_at) {
    throw ApiError.conflict("Verification has already been used");
  }

  if (new Date(row.expires_at) < new Date()) {
    throw ApiError.badRequest("Verification code has expired");
  }

  if (row.attempts >= MAX_ATTEMPTS) {
    throw ApiError.badRequest("Too many failed attempts");
  }

  if (!verificationsRepo.codesMatch(code, row.code_hash)) {
    await verificationsRepo.incrementAttempts(id, row.attempts);
    throw ApiError.badRequest("Invalid verification code");
  }

  const verificationToken = generateVerificationToken();
  const verificationTokenExpiresAt = new Date(
    Date.now() + TOKEN_TTL_MINUTES * 60_000,
  ).toISOString();

  const consumed = await verificationsRepo.updateVerification(id, {
    consumed_at: new Date().toISOString(),
    verification_token: verificationToken,
    verification_token_expires_at: verificationTokenExpiresAt,
  });

  if (!consumed) {
    throw ApiError.conflict("Verification has already been used");
  }

  return {
    verification_token: verificationToken,
    verification_token_expires_at: verificationTokenExpiresAt,
    email: row.email,
  };
}

/**
 * @param {string} token
 * @param {string} email
 */
async function assertVerificationTokenForEmail(token, email) {
  const row = await verificationsRepo.findConsumedVerificationByToken(token);

  if (!row) {
    throw ApiError.badRequest("Invalid verification token");
  }

  if (row.email !== normalizeEmail(email)) {
    throw ApiError.badRequest("Verification token does not match this email");
  }

  if (
    row.verification_token_expires_at &&
    new Date(row.verification_token_expires_at) < new Date()
  ) {
    throw ApiError.badRequest("Verification token has expired");
  }
}

module.exports = {
  startVerification,
  confirmVerification,
  assertVerificationTokenForEmail,
};
