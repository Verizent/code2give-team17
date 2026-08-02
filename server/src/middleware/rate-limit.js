const { ApiError } = require("../lib/api-error");

/**
 * Fixed-window limiter, in memory.
 *
 * This was a no-op stub, which was harmless while EMAIL_MODE was effectively always
 * log-mode: POST /api/email-verifications only ever printed a code to a console. Now that
 * SMTP is wired, an unauthenticated endpoint that emails an arbitrary address without a
 * limit is an email-bombing tool that sends from our own domain — so the abuse is
 * attributed to us, and our domain is what gets blocklisted.
 *
 * Buckets on the email in the body when there is one, falling back to the caller IP.
 * Per-address matters in both directions: a shared NAT must not lock a whole office out,
 * and one attacker on one IP must not be able to bomb a thousand different inboxes.
 *
 * LIMITS — single process, so state is lost on restart and not shared between instances.
 * Adequate for one demo box; a real deployment wants a shared store and `trust proxy` set,
 * or `request.ip` is whatever the last hop claims it is.
 */

const buckets = new Map();

/** Bound the map: an attacker rotating addresses would otherwise grow it without limit. */
const MAX_BUCKETS = 10_000;

function sweep(now) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

/**
 * @param {{ key?: string, limit?: number, windowMs?: number }} [options]
 * @returns {import("express").RequestHandler}
 */
function rateLimit(options = {}) {
  const name = options.key || "default";
  const limit = options.limit ?? 5;
  const windowMs = options.windowMs ?? 15 * 60_000;

  return (request, _response, next) => {
    const now = Date.now();

    // Same normalisation as volunteers.email, or `Dana@x` and `dana@x` are two budgets.
    const email =
      typeof request.body?.email === "string" ? request.body.email.trim().toLowerCase() : null;
    const identity = email || request.ip || "unknown";
    const bucketKey = `${name}:${identity}`;

    if (buckets.size > MAX_BUCKETS) {
      sweep(now);
    }

    const bucket = buckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(bucketKey, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= limit) {
      // No detail about the address: the response must not become an oracle for whether
      // a given person has been asking to volunteer at a disability charity.
      next(ApiError.rateLimited("Too many requests — wait a few minutes and try again"));
      return;
    }

    bucket.count += 1;
    next();
  };
}

/** Test seam — drops all buckets. */
rateLimit.__reset = () => buckets.clear();

module.exports = rateLimit;
