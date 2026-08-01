const express = require("express");
const { validate } = require("../middleware/validate");
const { articleListQuerySchema, slugParamSchema, localeQuerySchema } = require("../schemas/query.schema");
const articlesService = require("../services/content/articles.service");

const router = express.Router();

router.get("/", validate({ query: articleListQuerySchema }), async (request, response, next) => {
  try {
    response.json(await articlesService.listArticles(request.validatedQuery));
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:slug",
  validate({ params: slugParamSchema, query: localeQuerySchema }),
  async (request, response, next) => {
    try {
      const article = await articlesService.getArticleBySlug(
        request.validatedParams.slug,
        request.validatedQuery.locale,
      );
      response.json(article);
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
