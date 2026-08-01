const test = require("node:test");
const assert = require("node:assert/strict");

const { createArticleSchema, updateArticleSchema } = require("../../src/schemas/article.schema");

const valid = Object.freeze({
  category: "education",
  title_en: "What trisomy 21 actually is",
});

const accepts = (input) => createArticleSchema.safeParse(input).success;

test("accepts the minimum: a category and an English title", () => {
  assert.equal(accepts(valid), true);
});

test("requires an English title even when a Chinese one is present", () => {
  assert.equal(accepts({ category: "news", title_zh: "無限可能" }), false);
});

test("accepts the three real categories and rejects 'voice'", () => {
  assert.equal(accepts({ ...valid, category: "news" }), true);
  assert.equal(accepts({ ...valid, category: "education" }), true);
  assert.equal(accepts({ ...valid, category: "report" }), true);
  // Voices live in community_posts, which carries the moderation state the tab
  // depends on. Two tables feeding one tab would make the frontend guess (§21).
  assert.equal(accepts({ ...valid, category: "voice" }), false);
});

test("validates the body through the block union", () => {
  assert.equal(accepts({ ...valid, body_en: [{ type: "paragraph", text: "Opening." }] }), true);
  assert.equal(
    accepts({ ...valid, body_en: [{ type: "image", url: "https://example.test/a.jpg" }] }),
    false,
  );
});

// Bodies are strict where queries are stripped: an unknown field in a body really is
// a mistake, and silently ignoring it means an editor save that appears to work.
test("rejects an unknown field rather than ignoring it", () => {
  assert.equal(accepts({ ...valid, ttile_en: "typo" }), false);
});

test("rejects fields the server derives and the client must never set", () => {
  assert.equal(accepts({ ...valid, slug: "hand-picked" }), false);
  assert.equal(accepts({ ...valid, status: "published" }), false);
  assert.equal(accepts({ ...valid, reading_time_minutes: 99 }), false);
  assert.equal(accepts({ ...valid, published_at: "2026-08-01T00:00:00.000Z" }), false);
});

test("updateArticleSchema allows a partial body", () => {
  assert.equal(updateArticleSchema.safeParse({ title_en: "A new title" }).success, true);
  assert.equal(updateArticleSchema.safeParse({}).success, true);
});

test("updateArticleSchema stays strict about unknown fields", () => {
  assert.equal(updateArticleSchema.safeParse({ ttile_en: "typo" }).success, false);
});

// Changing the slug must be deliberate, because it moves a public URL — but it is
// permitted on update, unlike on create where it is always derived (§7).
test("updateArticleSchema permits an explicit slug", () => {
  assert.equal(updateArticleSchema.safeParse({ slug: "a-deliberate-slug" }).success, true);
});
