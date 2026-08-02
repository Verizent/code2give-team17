const express = require("express");
const { z } = require("zod");
const { validate } = require("../../middleware/validate");
const { listQuerySchema, idParamSchema } = require("../../schemas/query.schema");
const { envelope } = require("../../lib/envelope");
const sessionsService = require("../../services/admin/sessions.service");

const router = express.Router();

const bulkAttendanceSchema = z.object({
  entries: z.array(z.object({
    session_id: z.string().uuid(),
    attendance_count: z.number().int().min(0),
    photo_url: z.string().url().optional(),
  })).min(1),
});

router.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const { items, meta } = await sessionsService.listSessions(req.validatedQuery);
    res.json(envelope(items, meta));
  } catch (e) { next(e); }
});

router.get("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await sessionsService.getSession(req.validatedParams.id)));
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(envelope(await sessionsService.createSession(req.body)));
  } catch (e) { next(e); }
});

router.post("/attendance/bulk", validate({ body: bulkAttendanceSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await sessionsService.recordBulkAttendance(req.body.entries)));
  } catch (e) { next(e); }
});

router.patch("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await sessionsService.updateSession(req.validatedParams.id, req.body)));
  } catch (e) { next(e); }
});

router.post("/:id/cancel", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await sessionsService.cancelSession(req.validatedParams.id)));
  } catch (e) { next(e); }
});

router.post("/:id/attendance", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await sessionsService.recordAttendance(req.validatedParams.id, req.body)));
  } catch (e) { next(e); }
});

router.delete("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    await sessionsService.deleteSession(req.validatedParams.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
