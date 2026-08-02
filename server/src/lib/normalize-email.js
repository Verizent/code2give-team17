/**
 * §15: every email write and lookup must use the same normalisation the database enforces.
 *
 * @param {string} email
 * @returns {string}
 */
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

module.exports = { normalizeEmail };
