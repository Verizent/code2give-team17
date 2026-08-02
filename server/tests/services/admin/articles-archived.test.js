const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const articlesRepo = require("../../../src/data/articles.repo");
const { listAdminArticles } = require("../../../src/services/admin/articles.service");

/**
 * Delete is a soft delete — it sets status='archived' rather than dropping the row, so a
 * mis-click is recoverable. That only reads as "deleted" if the CMS list then stops
 * showing it; otherwise the article sits in the list exactly as before and the button
 * looks broken.
 */
function captureListAll(t, rows = []) {
  const calls = [];
  mock.method(articlesRepo, "listAll", async (options) => {
    calls.push(options);
    return { rows, total: rows.length };
  });
  t.after(() => mock.restoreAll());
  return calls;
}

test("the admin list hides archived articles by default", async (t) => {
  const calls = captureListAll(t);

  await listAdminArticles({});

  assert.equal(calls[0].excludeStatus, "archived");
});

test("an explicit status filter is still honoured", async (t) => {
  const calls = captureListAll(t);

  await listAdminArticles({ status: "draft" });

  assert.equal(calls[0].status, "draft");
  // Nothing to exclude: the caller named exactly one status, so the exclusion would be
  // either redundant or contradictory.
  assert.equal(calls[0].excludeStatus, undefined);
});

test("asking for archived on purpose returns them", async (t) => {
  const calls = captureListAll(t);

  await listAdminArticles({ status: "archived" });

  assert.equal(calls[0].status, "archived");
  assert.equal(calls[0].excludeStatus, undefined);
});
