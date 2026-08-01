/**
 * Detects PostgREST / Postgres "table not in schema" errors.
 *
 * Must NOT treat "permission denied for table X" as missing — that means the
 * table exists but service_role lacks GRANT (content migrations historically
 * omitted grants; see 20260802_1140). Matching bare table names alone would
 * hide that as available: false.
 *
 * @param {unknown} error — often ApiError whose message embeds the driver text
 * @param {string} tableName — e.g. "session_proofs"
 * @returns {boolean}
 */
function isMissingTable(error, tableName) {
  const msg = String(
    (error && typeof error === "object" && "message" in error && error.message) ||
      error ||
      "",
  );
  if (/permission denied/i.test(msg)) return false;

  const escaped = tableName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return (
    new RegExp(`relation ["']?(?:public\\.)?${escaped}["']? does not exist`, "i").test(
      msg,
    ) ||
    new RegExp(`Could not find the table ['"]?(?:public\\.)?${escaped}['"]?`, "i").test(
      msg,
    )
  );
}

module.exports = { isMissingTable };
