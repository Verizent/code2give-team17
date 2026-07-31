const express = require("express");
const healthRoutes = require("./health.routes");

const router = express.Router();

router.get("/api", (request, response) => {
  response.json({
    message: "Code2Give Team 17 API",
    status: "running",
  });
});

router.use("/api/health", healthRoutes);

module.exports = router;
