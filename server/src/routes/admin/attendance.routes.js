const express = require("express");
const { validate } = require("../../middleware/validate");
const { envelope } = require("../../lib/envelope");
const attendanceService = require("../../services/admin/attendance.service");
const {
  markAttendanceBodySchema,
  opportunityIdParamsSchema,
} = require("../../schemas/attendance.schema");

const router = express.Router();

router.post(
  "/:id/attendance",
  validate({ params: opportunityIdParamsSchema, body: markAttendanceBodySchema }),
  async (request, response, next) => {
    try {
      const result = await attendanceService.markAttendance(
        request.validatedParams.id,
        request.body.signups,
      );
      response.json(envelope(result));
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
