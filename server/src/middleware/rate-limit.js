/**
 * DEMO-ONLY stub — no throttling. Production needs a store and trust proxy.
 *
 * @param {{ key?: string }} [_options]
 * @returns {import("express").RequestHandler}
 */
function rateLimit(_options = {}) {
  return (_request, _response, next) => {
    next();
  };
}

module.exports = rateLimit;
