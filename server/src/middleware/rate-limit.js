const { ApiError } = require("../lib/api-error");

/**
 * Fixed-window rate limiting, held in this process's memory.
 *
 * Each call to `rateLimit()` closes over its own Map, so the three routes that mount it cannot
 * evict or throttle one another, and a test gets a clean store just by building new middleware.
 *
 * KNOWN LIMITS, both deliberate:
 *  - **Per process.** Counters reset on restart and do not coordinate across instances. Fine
 *    for the single server this runs on; a second instance would double every limit.
 *  - **Per `request.ip`,** which is the socket address unless `app.set("trust proxy")` is on.
 *    Behind a proxy every visitor collapses into one bucket and an IP-keyed limit becomes an
 *    outage rather than a defence — see TRUST_PROXY in app.js and .env.example.
 *
 * Set `RATE_LIMIT_DISABLED=true` to bypass entirely (demo escape hatch).
 */

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_LIMIT = 30;
const SWEEP_INTERVAL_MS = 60 * 1000;

/**
 * Ceiling on tracked buckets. Reached only under a spray of distinct identities — i.e. the
 * attack this exists to survive — so the response is to drop expired entries early rather
 * than let one attacker grow the Map until the process dies.
 */
const MAX_TRACKED_KEYS = 10_000;

/** @param {import("express").Request} request */
function defaultIdentify(request) {
  return request.ip || request.socket?.remoteAddress || null;
}

/**
 * @param {Map<string, { count: number, resetAt: number }>} buckets
 * @param {number} now
 */
function purgeExpired(buckets, now) {
  for (const [bucketKey, entry] of buckets) {
    if (entry.resetAt <= now) buckets.delete(bucketKey);
  }
}

/**
 * @param {{
 *   key?: string,
 *   limit?: number,
 *   windowMs?: number,
 *   identify?: (request: import("express").Request) => string | string[] | null | undefined,
 * }} [options]
 *   `identify` may return several identities — the request is refused when **any** of them is
 *   exhausted, and every one is charged only if the request is allowed through. That is what
 *   lets a route limit per-IP and per-target at once: enumeration is one axis, mailing a
 *   single victim from many addresses is a different one, and either alone leaves a hole.
 * @returns {import("express").RequestHandler}
 */
function rateLimit({
  key = "default",
  limit = DEFAULT_LIMIT,
  windowMs = DEFAULT_WINDOW_MS,
  identify = defaultIdentify,
} = {}) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const buckets = new Map();

  // unref'd so a mounted limiter never holds the process (or a test run) open.
  const sweep = setInterval(() => purgeExpired(buckets, Date.now()), SWEEP_INTERVAL_MS);
  if (typeof sweep.unref === "function") sweep.unref();

  return (request, response, next) => {
    if (process.env.RATE_LIMIT_DISABLED === "true") {
      next();
      return;
    }

    const now = Date.now();
    const identities = [identify(request)]
      .flat()
      .filter(Boolean)
      .map((identity) => String(identity).toLowerCase());

    // Nothing to key on — an unidentifiable caller is let through rather than blocked, so a
    // missing `request.ip` degrades to today's behaviour instead of refusing everyone.
    if (identities.length === 0) {
      next();
      return;
    }

    if (buckets.size > MAX_TRACKED_KEYS) purgeExpired(buckets, now);

    const entries = identities.map((identity) => {
      const bucketKey = `${key}:${identity}`;
      const existing = buckets.get(bucketKey);
      if (!existing || existing.resetAt <= now) {
        const fresh = { count: 0, resetAt: now + windowMs };
        buckets.set(bucketKey, fresh);
        return fresh;
      }
      return existing;
    });

    const exhausted = entries.find((entry) => entry.count >= limit);
    if (exhausted) {
      const retryAfter = Math.max(1, Math.ceil((exhausted.resetAt - now) / 1000));
      if (typeof response.set === "function") {
        response.set("Retry-After", String(retryAfter));
      }
      next(ApiError.rateLimited(`Too many requests. Try again in ${retryAfter}s.`));
      return;
    }

    // Charged only on the allowed path, so a caller already being refused on one axis does
    // not keep inflating their other buckets while they wait the window out.
    for (const entry of entries) entry.count += 1;
    next();
  };
}

module.exports = rateLimit;
