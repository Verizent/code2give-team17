const express = require("express");
const { checkSupabaseConnection } = require("../config/supabase");

const router = express.Router();

router.get("/", (request, response) => {
  response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

router.get("/supabase", async (request, response, next) => {
  try {
    await checkSupabaseConnection();
    response.json({
      status: "ok",
      service: "supabase",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
