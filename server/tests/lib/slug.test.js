const test = require("node:test");
const assert = require("node:assert/strict");

const { slugify, uniqueSlug } = require("../../src/lib/slug");

test("lowercases and hyphenates a plain title", () => {
  assert.equal(slugify("So Much Ability"), "so-much-ability");
});

test("strips punctuation rather than encoding it", () => {
  assert.equal(slugify("Our year in review: 2024/25!"), "our-year-in-review-2024-25");
});

test("collapses runs of separators into a single hyphen", () => {
  assert.equal(slugify("Sports  --  Fitness"), "sports-fitness");
});

test("trims leading and trailing hyphens", () => {
  assert.equal(slugify("  Hello  "), "hello");
});

test("caps the slug length at 80 characters", () => {
  const slug = slugify("a".repeat(200));

  assert.ok(slug.length <= 80, `expected <= 80 characters, got ${slug.length}`);
});

// A Traditional Chinese title transliterates to nothing, which would otherwise
// produce an empty slug and a 500 on the unique index in front of an audience.
test("falls back to 'article' when the title has no sluggable characters", () => {
  assert.equal(slugify("無限可能"), "article");
  assert.equal(slugify("!!!"), "article");
  assert.equal(slugify(""), "article");
});

test("uniqueSlug returns the base unchanged when nothing collides", async () => {
  const exists = async () => false;

  assert.equal(await uniqueSlug("our-year-in-review", exists), "our-year-in-review");
});

test("uniqueSlug appends -2 on the first collision", async () => {
  const taken = new Set(["our-year-in-review"]);
  const exists = async (candidate) => taken.has(candidate);

  assert.equal(await uniqueSlug("our-year-in-review", exists), "our-year-in-review-2");
});

test("uniqueSlug keeps counting past a second collision", async () => {
  const taken = new Set(["our-year-in-review", "our-year-in-review-2"]);
  const exists = async (candidate) => taken.has(candidate);

  assert.equal(await uniqueSlug("our-year-in-review", exists), "our-year-in-review-3");
});
