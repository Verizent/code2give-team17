const test = require("node:test");
const assert = require("node:assert/strict");

const { readingTime } = require("../../src/lib/reading-time");

const words = (count) => Array.from({ length: count }, () => "word").join(" ");

test("returns 1 for an empty body rather than 0", () => {
  assert.equal(readingTime([]), 1);
});

test("returns 1 for a body far shorter than one minute", () => {
  assert.equal(readingTime([{ type: "paragraph", text: "Three short words" }]), 1);
});

test("counts roughly 200 words per minute", () => {
  assert.equal(readingTime([{ type: "paragraph", text: words(400) }]), 2);
});

test("sums text across multiple blocks", () => {
  const blocks = [
    { type: "paragraph", text: words(200) },
    { type: "paragraph", text: words(200) },
  ];

  assert.equal(readingTime(blocks), 2);
});

test("counts heading and quote text as well as paragraphs", () => {
  const blocks = [
    { type: "heading", level: 2, text: words(100) },
    { type: "quote", text: words(100) },
  ];

  assert.equal(readingTime(blocks), 1);
});

test("ignores blocks that carry no readable body text", () => {
  const blocks = [
    { type: "paragraph", text: words(200) },
    { type: "image", url: "https://example.test/a.jpg", alt: "A volunteer and a member" },
    { type: "embed", provider: "instagram", postId: "abc123" },
  ];

  assert.equal(readingTime(blocks), 1);
});

test("tolerates a missing or non-array body", () => {
  assert.equal(readingTime(undefined), 1);
  assert.equal(readingTime(null), 1);
});
