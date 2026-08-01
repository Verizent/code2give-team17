const express = require("express");
const { validate } = require("../../middleware/validate");
const { listQuerySchema, idParamSchema } = require("../../schemas/query.schema");
const { envelope } = require("../../lib/envelope");
const adminImpactService = require("../../services/admin/impact.service");

const router = express.Router();

router.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const { items, meta } = await adminImpactService.listAdminImpact(req.validatedQuery);
    res.json(envelope(items, meta));
  } catch (e) { next(e); }
});

router.get("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminImpactService.getAdminImpact(req.validatedParams.id)));
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    res.status(201).json(envelope(await adminImpactService.createAdminImpact(req.body)));
  } catch (e) { next(e); }
});

router.patch("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminImpactService.updateAdminImpact(req.validatedParams.id, req.body)));
  } catch (e) { next(e); }
});

router.delete("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    await adminImpactService.deleteAdminImpact(req.validatedParams.id);
    res.status(204).end();
  } catch (e) { next(e); }
});

module.exports = router;
