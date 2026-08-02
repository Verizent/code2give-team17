// DEMO-ONLY: /api/admin/handson/sync wraps the HandsOn stub — no real partner
// integration exists yet (§17). Real version needs partner credentials + client.
const express = require("express");
const { envelope } = require("../../lib/envelope");
const handsonAdminService = require("../../services/admin/handson.service");

const router = express.Router();

router.post("/sync", async (request, response, next) => {
  try {
    const report = await handsonAdminService.runSync();
    response.json(envelope(report));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
