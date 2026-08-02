const { ApiError } = require("../../lib/api-error");
const crypto = require("node:crypto");

/**
 * DEMO-ONLY HandsOn sync stub. `HANDSON_MODE=live` throws.
 */
function runHandsonSync() {
  const mode = process.env.HANDSON_MODE || "stub";

  if (mode === "live") {
    throw ApiError.badRequest(
      "HandsOn live sync is not implemented — partner credentials are required",
    );
  }

  return {
    id: crypto.randomUUID(),
    status: "completed",
    mode: "stub",
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    message:
      "A stub built against the shape HandsOn's API would take; a real sync needs their credentials and an implementation.",
  };
}

module.exports = { runHandsonSync };
