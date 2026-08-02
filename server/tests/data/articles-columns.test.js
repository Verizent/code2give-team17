const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  LIST_COLUMNS,
  DETAIL_COLUMNS,
  ADMIN_COLUMNS,
} = require("../../src/data/articles.repo");

/**
 * The admin CMS renders `article.status` and decides between the Publish and Unpublish
 * buttons from it. A column list that omits it does not fail — every row simply arrives
 * with `status: undefined`, so `status !== 'published'` is true for every article and the
 * page offers Publish on things that are already live.
 */
test("admin column list carries status", () => {
  const columns = ADMIN_COLUMNS.split(",").map((column) => column.trim());
  assert.ok(columns.includes("status"), "ADMIN_COLUMNS must select status");
});

test("admin column list is the detail list plus status", () => {
  const detail = DETAIL_COLUMNS.split(",").map((column) => column.trim());
  const admin = ADMIN_COLUMNS.split(",").map((column) => column.trim());

  for (const column of detail) {
    assert.ok(admin.includes(column), `ADMIN_COLUMNS is missing ${column}`);
  }
});

test("public column lists stay free of status", () => {
  // The public queries filter on status='published' instead of selecting it, so the
  // visitor payload never carries a moderation field it has no use for.
  for (const list of [LIST_COLUMNS, DETAIL_COLUMNS]) {
    const columns = list.split(",").map((column) => column.trim());
    assert.ok(!columns.includes("status"));
  }
});

test("no column is selected twice", () => {
  // `DETAIL_COLUMNS` embeds `LIST_COLUMNS`, so appending carelessly is how a column ends
  // up listed twice in the PostgREST select.
  const admin = ADMIN_COLUMNS.split(",").map((column) => column.trim());
  assert.equal(new Set(admin).size, admin.length);
});
