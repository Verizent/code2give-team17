const express = require("express");
const requireAuth = require("../../middleware/require-auth");
const requireRole = require("../../middleware/require-role");
const handsonStubService = require("../../services/volunteering/handson-stub.service");

const router = express.Router();

router.use(requireAuth, requireRole("admin"));

router.post("/handson-syncs", async (_request, response, next) => {
  try {
    const run = handsonStubService.runHandsonSync();
    response.status(201).json(run);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
