const test = require("node:test");
const assert = require("node:assert/strict");

const { parsePaging, buildMeta } = require("../../src/lib/pagination");

test("defaults to page 1 and limit 12", () => {
  const paging = parsePaging({});

  assert.equal(paging.page, 1);
  assert.equal(paging.limit, 12);
});

test("page 1 spans the inclusive range 0 to 11", () => {
  const paging = parsePaging({ page: 1, limit: 12 });

  assert.equal(paging.from, 0);
  assert.equal(paging.to, 11);
});

// The off-by-one here is invisible until someone loads page 2 and sees a
// repeated or missing row, which is exactly why it is worth a test.
test("page 2 spans the inclusive range 12 to 23, skipping nothing", () => {
  const paging = parsePaging({ page: 2, limit: 12 });

  assert.equal(paging.from, 12);
  assert.equal(paging.to, 23);
});

test("consecutive pages do not overlap or leave a gap", () => {
  const first = parsePaging({ page: 1, limit: 10 });
  const second = parsePaging({ page: 2, limit: 10 });

  assert.equal(second.from, first.to + 1);
});

test("clamps a limit above 50 down to 50 rather than rejecting it", () => {
  assert.equal(parsePaging({ limit: 500 }).limit, 50);
});

test("clamps a limit below 1 up to 1", () => {
  assert.equal(parsePaging({ limit: 0 }).limit, 1);
});

test("clamps a page below 1 up to 1", () => {
  assert.equal(parsePaging({ page: 0 }).page, 1);
  assert.equal(parsePaging({ page: -3 }).page, 1);
});

test("coerces numeric strings from the query string", () => {
  const paging = parsePaging({ page: "3", limit: "20" });

  assert.equal(paging.page, 3);
  assert.equal(paging.limit, 20);
});

test("falls back to the defaults when values are not numeric", () => {
  const paging = parsePaging({ page: "abc", limit: "xyz" });

  assert.equal(paging.page, 1);
  assert.equal(paging.limit, 12);
});

test("buildMeta returns exactly total, page and limit", () => {
  const meta = buildMeta(37, parsePaging({ page: 2, limit: 12 }));

  assert.deepEqual(meta, { total: 37, page: 2, limit: 12 });
});
