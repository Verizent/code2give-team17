const test = require("node:test");
const assert = require("node:assert/strict");

const { blockSchema, bodySchema } = require("../../src/schemas/blocks.schema");

const accepts = (block) => blockSchema.safeParse(block).success;

// The accessibility gate. This is a charity for people with disabilities, and an
// unlabelled image is the failure the client is best equipped to spot — so the schema
// makes it impossible to save rather than something a checklist catches later (§21).
test("rejects an image block with no alt text at all", () => {
  assert.equal(accepts({ type: "image", url: "https://example.test/a.jpg" }), false);
});

test("rejects an image block whose alt is an empty string", () => {
  assert.equal(accepts({ type: "image", url: "https://example.test/a.jpg", alt: "" }), false);
});

test("accepts an image block carrying real alt text", () => {
  const block = {
    type: "image",
    url: "https://example.test/a.jpg",
    alt: "A volunteer and a member playing floor curling",
  };

  assert.equal(accepts(block), true);
});

test("accepts an optional caption alongside alt", () => {
  const block = {
    type: "image",
    url: "https://example.test/a.jpg",
    alt: "A coach demonstrating a plank",
    caption: "Training at San Po Kong",
  };

  assert.equal(accepts(block), true);
});

test("accepts headings at level 2 and 3", () => {
  assert.equal(accepts({ type: "heading", level: 2, text: "Our year" }), true);
  assert.equal(accepts({ type: "heading", level: 3, text: "Sports" }), true);
});

// h1 belongs to the page title, and h4+ is a hierarchy no article template renders.
test("rejects headings outside level 2 and 3", () => {
  assert.equal(accepts({ type: "heading", level: 1, text: "Our year" }), false);
  assert.equal(accepts({ type: "heading", level: 4, text: "Our year" }), false);
});

test("requires text on a paragraph", () => {
  assert.equal(accepts({ type: "paragraph" }), false);
  assert.equal(accepts({ type: "paragraph", text: "Inline **markdown** only." }), true);
});

test("accepts stat, mythFact and quote blocks", () => {
  assert.equal(
    accepts({ type: "stat", value: "6,859", label: "sessions offered", sublabel: "2024–25" }),
    true,
  );
  assert.equal(accepts({ type: "mythFact", myth: "A myth", fact: "The fact" }), true);
  assert.equal(
    accepts({ type: "quote", text: "She can run again.", attribution: "A parent" }),
    true,
  );
});

test("accepts an instagram embed and rejects an unknown provider", () => {
  assert.equal(accepts({ type: "embed", provider: "instagram", postId: "abc123" }), true);
  assert.equal(accepts({ type: "embed", provider: "tiktok", postId: "abc123" }), false);
});

test("rejects a block type outside the union", () => {
  assert.equal(accepts({ type: "rawHtml", html: "<script>alert(1)</script>" }), false);
});

test("bodySchema accepts an empty array and a mixed-block body", () => {
  assert.equal(bodySchema.safeParse([]).success, true);
  assert.equal(
    bodySchema.safeParse([
      { type: "paragraph", text: "Opening." },
      { type: "stat", value: "490", label: "families supported" },
    ]).success,
    true,
  );
});

test("bodySchema rejects a body containing one invalid block", () => {
  const body = [
    { type: "paragraph", text: "Fine." },
    { type: "image", url: "https://example.test/a.jpg" },
  ];

  assert.equal(bodySchema.safeParse(body).success, false);
});
