const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const articlesRepo = require("../../../src/data/articles.repo");
const adminArticlesService = require("../../../src/services/admin/articles.service");

const fullRow = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  slug: "the-phoenix-year",
  category: "news",
  title_en: "The phoenix year",
  title_zh: "浴火重生的一年",
  excerpt_en: "English excerpt",
  excerpt_zh: "中文摘要",
  status: "published",
  is_featured: false,
  published_at: "2026-07-01T00:00:00.000Z",
  reading_time_minutes: 3,
  body_en: [{ type: "paragraph", text: "Body" }],
  body_zh: null,
  tags: ["update"],
};

test("listAdminArticles returns items and meta without locale resolution", async (t) => {
  mock.method(articlesRepo, "listAll", async () => ({ rows: [fullRow], total: 1 }));
  t.after(() => mock.restoreAll());

  const { items, meta } = await adminArticlesService.listAdminArticles({ page: 1, limit: 12 });

  assert.equal(items.length, 1);
  assert.equal(items[0].title_en, "The phoenix year", "admin list must return raw _en/_zh columns");
  assert.equal(items[0].title_zh, "浴火重生的一年");
  assert.deepEqual(meta, { total: 1, page: 1, limit: 12 });
});

test("getAdminArticle returns full row including body for any status", async (t) => {
  mock.method(articlesRepo, "findBySlug", async () => fullRow);
  t.after(() => mock.restoreAll());

  const article = await adminArticlesService.getAdminArticle("the-phoenix-year");

  assert.equal(article.slug, "the-phoenix-year");
  assert.ok(article.body_en, "body_en must be present in admin detail");
});

test("getAdminArticle throws 404 for unknown slug", async (t) => {
  mock.method(articlesRepo, "findBySlug", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => adminArticlesService.getAdminArticle("nope"),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

test("createAdminArticle derives slug and reading_time from body", async (t) => {
  const created = { ...fullRow, slug: "the-phoenix-year", reading_time_minutes: 1 };
  const createFn = mock.fn(async () => created);
  mock.method(articlesRepo, "create", createFn);
  mock.method(articlesRepo, "slugExists", async () => false);
  t.after(() => mock.restoreAll());

  const result = await adminArticlesService.createAdminArticle({
    title_en: "The phoenix year",
    category: "news",
    body_en: [{ type: "paragraph", text: "Hello world" }],
  });

  const passedData = createFn.mock.calls[0].arguments[0];
  assert.ok(passedData.slug, "slug must be derived");
  assert.ok(passedData.reading_time_minutes >= 0, "reading_time_minutes must be derived");
  assert.equal(result.slug, "the-phoenix-year");
});

test("updateAdminArticle never re-derives slug from title change", async (t) => {
  const updateFn = mock.fn(async () => ({ ...fullRow, title_en: "New title" }));
  mock.method(articlesRepo, "update", updateFn);
  t.after(() => mock.restoreAll());

  await adminArticlesService.updateAdminArticle("the-phoenix-year", { title_en: "New title" });

  const passedData = updateFn.mock.calls[0].arguments[1];
  assert.equal(passedData.slug, undefined, "slug must not be re-derived on update");
});

test("deleteAdminArticle soft-deletes by setting status to archived", async (t) => {
  const updateFn = mock.fn(async () => ({ ...fullRow, status: "archived" }));
  mock.method(articlesRepo, "update", updateFn);
  t.after(() => mock.restoreAll());

  await adminArticlesService.deleteAdminArticle("the-phoenix-year");

  const passedData = updateFn.mock.calls[0].arguments[1];
  assert.equal(passedData.status, "archived");
});
