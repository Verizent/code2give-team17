const express = require("express");
const { validate } = require("../../middleware/validate");
const { listQuerySchema, slugParamSchema } = require("../../schemas/query.schema");
const { envelope } = require("../../lib/envelope");
const adminArticlesService = require("../../services/admin/articles.service");

const router = express.Router();

router.get("/", validate({ query: listQuerySchema }), async (req, res, next) => {
  try {
    const { items, meta } = await adminArticlesService.listAdminArticles(req.validatedQuery);
    res.json(envelope(items, meta));
  } catch (e) { next(e); }
});

router.get("/:slug", validate({ params: slugParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminArticlesService.getAdminArticle(req.validatedParams.slug)));
  } catch (e) { next(e); }
});

router.post("/", async (req, res, next) => {
  try {
    const row = await adminArticlesService.createAdminArticle(req.body);
    res.status(201).json(envelope(row));
  } catch (e) { next(e); }
});

router.patch("/:slug", validate({ params: slugParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminArticlesService.updateAdminArticle(req.validatedParams.slug, req.body)));
  } catch (e) { next(e); }
});

router.delete("/:slug", validate({ params: slugParamSchema }), async (req, res, next) => {
  try {
    res.json(envelope(await adminArticlesService.deleteAdminArticle(req.validatedParams.slug)));
  } catch (e) { next(e); }
});

module.exports = router;
