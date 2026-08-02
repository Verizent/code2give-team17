const express = require("express");
const { validate } = require("../middleware/validate");
const { localeQuerySchema } = require("../schemas/query.schema");
const { envelope } = require("../lib/envelope");
const instagramService = require("../services/admin/instagram.service");

const router = express.Router();

/** Public — active embeds ordered by display_order, caption resolved to `?locale=`. */
router.get("/", validate({ query: localeQuerySchema }), async (req, res, next) => {
  try {
    const items = await instagramService.listActiveEmbeds(req.validatedQuery.locale);
    res.json(envelope(items));
  } catch (e) { next(e); }
});

module.exports = router;
