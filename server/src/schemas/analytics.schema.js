const { z } = require("zod");

/** Window options offered by the admin analytics control. */
const ANALYTICS_RANGES = ["all", "1y", "6m", "3m", "1m"];

/**
 * `z.object`, not `z.strictObject`: query schemas STRIP unknown keys rather than reject
 * them, because link-sharing and client libraries append parameters we never declared and
 * a 400 for an unknown query key is a baffling failure. A *declared* key with a bad value
 * still 400s — `?range=banana` is a caller error worth reporting.
 */
const analyticsQuerySchema = z.object({
  range: z.enum(ANALYTICS_RANGES).default("all"),
});

module.exports = { analyticsQuerySchema, ANALYTICS_RANGES };
