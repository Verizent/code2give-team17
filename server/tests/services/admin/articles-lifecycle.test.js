// Addressing an article by id, and the publish/unpublish transitions.
//
// The admin surface addresses articles by id rather than slug because `slug` is editable
// through updateArticleSchema: a PATCH that changes the slug destroys the identifier the
// request was addressed by. A retry after a timeout then cannot tell "already renamed"
// from "never existed". An id is immutable, which is what an addressing key must be.

const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const articlesRepo = require("../../../src/data/articles.repo");
const {
  getAdminArticle,
  updateAdminArticle,
  publishAdminArticle,
  unpublishAdminArticle,
} = require("../../../src/services/admin/articles.service");

const ID = "a1b2c3d4-0010-4a11-8b22-000000000010";

/** A tiny in-memory table keyed by id, so a rename can be observed through it. */
function stubTable(t, initial) {
  const rows = new Map([[initial.id, { ...initial }]]);

  mock.method(articlesRepo, "findById", async (id) => {
    const row = rows.get(id);
    return row ? { ...row } : null;
  });
  mock.method(articlesRepo, "updateById", async (id, patch) => {
    const row = rows.get(id);
    if (!row) return null;
    Object.assign(row, patch);
    return { ...row };
  });
  t.after(() => mock.restoreAll());

  return rows;
}

test("renaming an article changes its slug but the same id still finds it", async (t) => {
  stubTable(t, { id: ID, slug: "old-slug", title_en: "Old", status: "draft" });

  const renamed = await updateAdminArticle(ID, { slug: "new-slug", title_en: "New" });
  assert.equal(renamed.slug, "new-slug");

  // The whole point of keying on id: the identifier survives its own rename.
  const found = await getAdminArticle(ID);
  assert.equal(found.slug, "new-slug");
  assert.equal(found.title_en, "New");
});

test("a title change alone never re-derives the slug — renaming must not move a public URL", async (t) => {
  stubTable(t, { id: ID, slug: "keep-me", title_en: "Old", status: "draft" });

  const updated = await updateAdminArticle(ID, { title_en: "A Completely Different Title" });

  assert.equal(updated.slug, "keep-me");
});

test("publish sets status and stamps published_at in the same call", async (t) => {
  stubTable(t, { id: ID, slug: "s", status: "draft", published_at: null });

  const published = await publishAdminArticle(ID);

  assert.equal(published.status, "published");
  assert.ok(published.published_at, "published_at was not stamped");
  // A row claiming to be published with no publication date would force every reader
  // downstream to defend against it. The two move together or not at all.
  assert.ok(!Number.isNaN(new Date(published.published_at).getTime()));
});

test("publishing an already-published article does not move published_at", async (t) => {
  const first = "2026-01-01T00:00:00.000Z";
  stubTable(t, { id: ID, slug: "s", status: "published", published_at: first });

  const again = await publishAdminArticle(ID);

  assert.equal(again.published_at, first);
});

test("unpublish returns the article to draft but keeps published_at", async (t) => {
  const first = "2026-01-01T00:00:00.000Z";
  stubTable(t, { id: ID, slug: "s", status: "published", published_at: first });

  const drafted = await unpublishAdminArticle(ID);

  assert.equal(drafted.status, "draft");
  // Kept on purpose: it records when the article first went live. Clearing it would make
  // a later re-publish look like a first publication.
  assert.equal(drafted.published_at, first);
});

test("publishing an article that does not exist is a 404, not a silent no-op", async (t) => {
  mock.method(articlesRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(() => publishAdminArticle("missing"), { status: 404 });
});

test("getAdminArticle reports the id it could not find", async (t) => {
  mock.method(articlesRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(() => getAdminArticle("missing"), { status: 404 });
});
