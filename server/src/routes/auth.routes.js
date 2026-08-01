const express = require("express");
const { requireAuth, resolveProfile } = require("../middleware/auth");
const { envelope } = require("../lib/envelope");

const router = express.Router();

/** Current session profile — role for client UX gates (server still enforces requireRole). */
router.get("/me", requireAuth, async (request, response, next) => {
  try {
    const profile = await resolveProfile(request.user);
    response.json(
      envelope({
        id: profile.id,
        email: profile.email ?? request.user.email ?? null,
        full_name: profile.full_name ?? null,
        role: profile.role,
        locale: profile.locale ?? null,
      }),
    );
  } catch (error) {
    next(error);
  }
});

module.exports = router;
