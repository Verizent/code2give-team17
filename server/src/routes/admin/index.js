const express = require("express");
const { requireRole } = require("../../middleware/require-role");
const communityPostsRoutes = require("./community-posts.routes");

const router = express.Router();

/**
 * Every admin router mounts beneath this one, so the guard is structural rather
 * than remembered. A new admin surface cannot ship without it, because being
 * mounted here is how it gets a URL at all.
 *
 * Deliberately NOT a global guard in app.js: most of this API is public (articles,
 * Voices, impact, the health probes, the donor tracking token page), so a
 * path-prefix allowlist in a file six people edit would fail by 401-ing a
 * judge-visible page, which is the worse direction to be wrong in.
 *
 * Keep child mounts alphabetical — same reason as routes/index.js.
 */
router.use(requireRole("admin"));

router.use("/community-posts", communityPostsRoutes);

module.exports = router;
