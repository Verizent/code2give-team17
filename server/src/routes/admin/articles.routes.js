const express = require("express");
const { validate } = require("../../middleware/validate");
const { listQuerySchema, idParamSchema } = require("../../schemas/query.schema");
const { envelope } = require("../../lib/envelope");
const adminArticlesService = require("../../services/admin/articles.service");

const router = express.Router();

router.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const { items, meta } = await adminArticlesService.listAdminArticles(req.validatedQuery);
    res.json(envelope(items, meta));
  } catch (e) { next(e); }
});

// Keyed on id, not slug. `slug` is editable through updateArticleSchema, so a PATCH that
// changes it would destroy the identifier the request was addressed by — a retry after a
// timeout could not tell "already renamed" from "never existed". The PUBLIC route in
// routes/articles.routes.js stays slug-keyed, because there the slug IS the stable URL.
router.get("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminArticlesService.getAdminArticle(req.validatedParams.id)));
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const row = await adminArticlesService.createAdminArticle(req.body);
    res.status(201).json(envelope(row));
  } catch (e) { next(e); }
});

router.patch("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminArticlesService.updateAdminArticle(req.validatedParams.id, req.body)));
  } catch (e) { next(e); }
});

router.delete("/:id", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminArticlesService.deleteAdminArticle(req.validatedParams.id)));
  } catch (e) { next(e); }
});

// Verb routes rather than a status field on PATCH: publishing stamps published_at as well
// as setting status, and §29 keeps both out of the write schemas because they are
// server-derived. A status field would let a caller publish without a publication date.
router.post("/:id/publish", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminArticlesService.publishAdminArticle(req.validatedParams.id)));
  } catch (e) { next(e); }
});

router.post("/:id/unpublish", validate({ params: idParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminArticlesService.unpublishAdminArticle(req.validatedParams.id)));
  } catch (e) { next(e); }
});

module.exports = router;
