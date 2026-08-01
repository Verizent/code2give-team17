const express = require("express");
const {
  createDonation,
  donorHasHistory,
} = require("../services/donations.service");

const router = express.Router();

router.post("/", async (request, response, next) => {
  try {
    const donation = await createDonation(request.body);
    response.status(201).json(donation);
  } catch (error) {
    next(error);
  }
});

router.get("/donor-exists", async (request, response, next) => {
  try {
    const exists = await donorHasHistory(request.query.email);
    response.json({ exists });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
