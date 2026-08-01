const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const articlesRepo = require("../../../src/data/articles.repo");
const { listArticles, getArticleBySlug } = require("../../../src/services/content/articles.service");

const listRow = {
  id: "22222222-2222-2222-2222-222222222222",
  slug: "the-phoenix-year",
  category: "news",
  title_en: "The phoenix year",
  title_zh: "浴火重生的一年",
  excerpt_en: "English excerpt",
  excerpt_zh: "",
  cover_alt_en: "English alt",
  cover_alt_zh: null,
  tags: ["update"],
  published_at: "2023-11-02T00:00:00.000Z",
  is_featured: true,
};

test("resolves each row's locale fields and strips the _en/_zh pairs", async (t) => {
  mock.method(articlesRepo, "listPublished", async () => ({ rows: [listRow], total: 1 }));
  t.after(() => mock.restoreAll());

  const { items } = await listArticles({ locale: "zh-Hant" });

  assert.equal(items[0].title, "浴火重生的一年");
  assert.equal(items[0].title_en, undefined);
  assert.equal(items[0].title_zh, undefined);
});

test("falls back to English per field, not per row", async (t) => {
  mock.method(articlesRepo, "listPublished", async () => ({ rows: [listRow], total: 1 }));
  t.after(() => mock.restoreAll());

  const { items } = await listArticles({ locale: "zh-Hant" });

  // Translated title survives while the empty excerpt and null alt fall back.
  assert.equal(items[0].title, "浴火重生的一年");
  assert.equal(items[0].excerpt, "English excerpt");
  assert.equal(items[0].cover_alt, "English alt");
});

test("passes the clamped paging bounds to the repo and reports them in meta", async (t) => {
  const listPublished = mock.fn(async () => ({ rows: [], total: 0 }));
  mock.method(articlesRepo, "listPublished", listPublished);
  t.after(() => mock.restoreAll());

  const { meta } = await listArticles({ page: 2, limit: 100 });

  const call = listPublished.mock.calls[0].arguments[0];
  assert.equal(call.from, 50, "page 2 at a clamped limit of 50 starts at offset 50");
  assert.equal(call.to, 99);
  assert.deepEqual(meta, { total: 0, page: 2, limit: 50 });
});

test("forwards the category, tag and is_featured filters", async (t) => {
  const listPublished = mock.fn(async () => ({ rows: [], total: 0 }));
  mock.method(articlesRepo, "listPublished", listPublished);
  t.after(() => mock.restoreAll());

  await listArticles({ category: "education", tag: "basics", is_featured: true });

  const call = listPublished.mock.calls[0].arguments[0];
  assert.equal(call.category, "education");
  assert.equal(call.tag, "basics");
  assert.equal(call.isFeatured, true);
});

test("an unknown slug and an unpublished one both raise the same 404", async (t) => {
  mock.method(articlesRepo, "findPublishedBySlug", async () => null);
  t.after(() => mock.restoreAll());

  // The repo already filters status='published', so both cases arrive here as null.
  // Distinguishing them would let anyone confirm a draft exists by probing slugs.
  await assert.rejects(() => getArticleBySlug("does-not-exist", "en"), (error) => {
    assert.equal(error.status, 404);
    return true;
  });
});

test("resolves the body block array for the requested locale", async (t) => {
  mock.method(articlesRepo, "findPublishedBySlug", async () => ({
    ...listRow,
    body_en: [{ type: "paragraph", text: "English body" }],
    body_zh: [{ type: "paragraph", text: "中文內容" }],
  }));
  t.after(() => mock.restoreAll());

  const article = await getArticleBySlug("the-phoenix-year", "zh-Hant");

  assert.deepEqual(article.body, [{ type: "paragraph", text: "中文內容" }]);
  assert.equal(article.body_en, undefined);
});
