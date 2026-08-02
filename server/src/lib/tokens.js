const crypto = require("node:crypto");

/** @returns {string} 43 chars — clears the `length(access_token) >= 32` floor. */
function generateAccessToken() {
  return crypto.randomBytes(32).toString("base64url");
}

/** @returns {string} */
function generateVerificationToken() {
  return crypto.randomBytes(32).toString("base64url");
}

/** @returns {string} Six-digit code from a CSPRNG. */
function generateVerificationCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

module.exports = {
  generateAccessToken,
  generateVerificationToken,
  generateVerificationCode,
};
