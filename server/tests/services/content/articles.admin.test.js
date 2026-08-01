const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const articlesRepo = require("../../../src/data/articles.repo");
const {
  createArticle,
  publishArticle,
  textToParagraphBlocks,
} = require("../../../src/services/content/articles.service");

test("textToParagraphBlocks splits on blank lines", () => {
  const blocks = textToParagraphBlocks("Hello\n\nWorld");
  assert.deepEqual(blocks, [
    { type: "paragraph", text: "Hello" },
    { type: "paragraph", text: "World" },
  ]);
});

test("createArticle derives slug and stores draft", async (t) => {
  mock.method(articlesRepo, "slugExists", async () => false);
  mock.method(articlesRepo, "insert", async (row) => ({
    id: "11111111-1111-4111-8111-111111111111",
    ...row,
  }));
  t.after(() => mock.restoreAll());

  const article = await createArticle({
    category: "news",
    title_en: "Hello World",
    body_en: [{ type: "paragraph", text: "Body copy here." }],
  });

  assert.equal(article.slug, "hello-world");
  assert.equal(article.status, "draft");
  assert.equal(article.published_at, null);
  assert.ok(article.reading_time_minutes >= 1);
});

test("publishArticle sets published status", async (t) => {
  mock.method(articlesRepo, "findById", async () => ({
    id: "11111111-1111-4111-8111-111111111111",
    status: "draft",
    published_at: null,
  }));
  mock.method(articlesRepo, "update", async (_id, patch) => ({
    id: "11111111-1111-4111-8111-111111111111",
    status: patch.status,
    published_at: patch.published_at,
  }));
  t.after(() => mock.restoreAll());

  const article = await publishArticle("11111111-1111-4111-8111-111111111111");
  assert.equal(article.status, "published");
  assert.ok(article.published_at);
});
