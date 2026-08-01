const { test } = require("node:test");
const assert = require("node:assert/strict");

const { envelope } = require("../../src/lib/envelope");

test("wraps a single resource under data with no meta key", () => {
  const result = envelope({ slug: "a-year-of-rebuilding" });

  assert.deepEqual(result, { data: { slug: "a-year-of-rebuilding" } });
  assert.ok(!("meta" in result));
});

test("keeps meta beside data rather than nesting it", () => {
  const result = envelope([{ slug: "one" }], { total: 14, page: 1, limit: 12 });

  assert.deepEqual(result, {
    data: [{ slug: "one" }],
    meta: { total: 14, page: 1, limit: 12 },
  });
});

test("never emits an error key on success", () => {
  assert.ok(!("error" in envelope({ slug: "one" })));
});

// An empty collection is data, not absence — the News tab with no results must render
// its empty state, so `data` stays an array rather than collapsing to null.
test("preserves an empty collection as an empty array", () => {
  const result = envelope([], { total: 0, page: 1, limit: 12 });

  assert.deepEqual(result.data, []);
  assert.equal(result.meta.total, 0);
});

test("preserves null as a value rather than dropping the data key", () => {
  assert.deepEqual(envelope(null), { data: null });
});
