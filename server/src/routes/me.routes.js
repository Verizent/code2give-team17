const express = require("express");
const { requireAuth } = require("../middleware/require-auth");
const { envelope } = require("../lib/envelope");
const meService = require("../services/auth/me.service");

const router = express.Router();

// requireAuth, not optionalAuth: an anonymous caller has no identity to describe,
// so 401 is the honest answer rather than an empty body the client must interpret.
router.get("/", requireAuth, async (request, response, next) => {
  try {
    const me = await meService.getMe(request.auth);
    response.json(envelope(me));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
