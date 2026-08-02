const express = require("express");

const { constructEvent } = require("../lib/stripe");
const { handleEvent } = require("../services/donations/webhook.service");

const router = express.Router();

/**
 * POST /api/webhooks/stripe
 *
 * `express.raw()` is mounted here rather than relying on the global `express.json()` in
 * `app.js`. CONTEXT.md §17: signature verification runs over the **exact bytes** Stripe sent,
 * so a parsed-and-restringified body fails verification on a perfectly valid signature.
 * `app.js` also short-circuits this path above the JSON parser — both halves are required.
 *
 * This route is deliberately outside the §29 envelope. Stripe is not a client of our API; it
 * reads the status line and nothing else.
 */
router.post("/", express.raw({ type: "application/json" }), async (request, response, next) => {
  let event;

  try {
    event = constructEvent(request.body, request.get("stripe-signature"));
  } catch (error) {
    // A bad signature is a 400 and must stay one. Answering 500 tells Stripe to retry a
    // payload that will never verify, and it retries for days.
    next(error);
    return;
  }

  try {
    const outcome = await handleEvent(event);
    // 200 even for a duplicate or an unhandled type: the event is ledgered, and any non-2xx
    // puts Stripe into a retry loop over something we have already dealt with.
    response.status(200).json({ received: true, ...outcome });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
