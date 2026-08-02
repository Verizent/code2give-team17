const express = require("express");
const { envelope } = require("../lib/envelope");
const instagramService = require("../services/admin/instagram.service");

const router = express.Router();

/** Public — returns only active embeds ordered by display_order. */
router.get("/", async (req, res, next) => {
  try {
    const items = await instagramService.listActiveEmbeds();
    res.json(envelope(items));
  } catch (e) { next(e); }
});

module.exports = router;
