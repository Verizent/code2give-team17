const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const wishlistRepo = require("../../../src/data/wishlist.repo");
const wishlistService = require("../../../src/services/admin/wishlist.service");

/**
 * `wishlist_items.id` is a TEXT primary key with no default — the admin supplies a slug
 * rather than the database minting a uuid. The shared `idParamSchema` is
 * `z.string().uuid()` and would reject every real id here, which is why this domain
 * carries its own param schema.
 */
const item = {
  id: "sports-equipment",
  title_en: "Sports equipment",
  title_zh: "運動器材",
  why_en: "Floor curling sets wear out after a season.",
  why_zh: "地壺球器材一季後便會耗損。",
  needed: 10,
  pledged: 3,
  image_url: "https://example.org/img/sports.jpg",
  is_active: true,
};

test("listItems returns items and meta", async (t) => {
  mock.method(wishlistRepo, "listAll", async () => ({ rows: [item], total: 1 }));
  t.after(() => mock.restoreAll());

  const { items, meta } = await wishlistService.listItems({ page: 1, limit: 12 });

  assert.equal(items.length, 1);
  assert.deepEqual(meta, { total: 1, page: 1, limit: 12 });
});

test("listItems includes inactive items — the admin view is not the public view", async (t) => {
  const hidden = { ...item, id: "archived-item", is_active: false };
  mock.method(wishlistRepo, "listAll", async () => ({ rows: [item, hidden], total: 2 }));
  t.after(() => mock.restoreAll());

  const { items } = await wishlistService.listItems({});

  assert.equal(items.length, 2);
  assert.ok(items.some((row) => row.is_active === false));
});

test("getItem returns the row", async (t) => {
  mock.method(wishlistRepo, "findById", async () => item);
  t.after(() => mock.restoreAll());

  const row = await wishlistService.getItem("sports-equipment");

  assert.equal(row.id, "sports-equipment");
});

test("getItem throws 404 for an unknown id", async (t) => {
  mock.method(wishlistRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => wishlistService.getItem("no-such-item"),
    (err) => {
      assert.equal(err.status, 404);
      return true;
    },
  );
});

test("createItem persists and returns the created row", async (t) => {
  const createFn = mock.fn(async () => item);
  mock.method(wishlistRepo, "create", createFn);
  t.after(() => mock.restoreAll());

  const { pledged, ...body } = item;
  const row = await wishlistService.createItem(body);

  assert.equal(row.id, "sports-equipment");
  assert.equal(createFn.mock.calls.length, 1);
});

test("createItem refuses a body carrying pledged", async (t) => {
  // pledged is owned by the pledge_wishlist_item RPC, which clamps atomically against
  // `needed` and writes a matching wishlist_pledges row. Letting an admin set it here
  // would leave the counter disagreeing with the pledges that actually exist, and
  // nothing would ever reconcile them.
  const createFn = mock.fn(async () => item);
  mock.method(wishlistRepo, "create", createFn);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => wishlistService.createItem({ ...item, pledged: 99 }),
    (err) => {
      assert.equal(err.status, 400);
      return true;
    },
  );
  assert.equal(createFn.mock.calls.length, 0, "must not reach the repo");
});

test("createItem rejects a needed below 1", async (t) => {
  const createFn = mock.fn(async () => item);
  mock.method(wishlistRepo, "create", createFn);
  t.after(() => mock.restoreAll());

  const { pledged, ...body } = item;
  await assert.rejects(
    () => wishlistService.createItem({ ...body, needed: 0 }),
    (err) => {
      assert.equal(err.status, 400);
      return true;
    },
  );
  assert.equal(createFn.mock.calls.length, 0);
});

test("updateItem returns the updated row", async (t) => {
  mock.method(wishlistRepo, "findById", async () => item);
  mock.method(wishlistRepo, "update", async () => ({ ...item, title_en: "Sports kit" }));
  t.after(() => mock.restoreAll());

  const row = await wishlistService.updateItem("sports-equipment", { title_en: "Sports kit" });

  assert.equal(row.title_en, "Sports kit");
});

test("updateItem throws 404 for an unknown id", async (t) => {
  mock.method(wishlistRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => wishlistService.updateItem("no-such-item", { title_en: "x" }),
    (err) => {
      assert.equal(err.status, 404);
      return true;
    },
  );
});

test("updateItem refuses a body carrying pledged", async (t) => {
  const updateFn = mock.fn(async () => item);
  mock.method(wishlistRepo, "findById", async () => item);
  mock.method(wishlistRepo, "update", updateFn);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => wishlistService.updateItem("sports-equipment", { pledged: 0 }),
    (err) => {
      assert.equal(err.status, 400);
      return true;
    },
  );
  assert.equal(updateFn.mock.calls.length, 0, "must not reach the repo");
});

test("updateItem refuses lowering needed below what is already pledged", async (t) => {
  // The item has pledged=3. Allowing needed=2 would render the item over-subscribed,
  // and the public card would show "3 of 2 pledged".
  const updateFn = mock.fn(async () => item);
  mock.method(wishlistRepo, "findById", async () => item);
  mock.method(wishlistRepo, "update", updateFn);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => wishlistService.updateItem("sports-equipment", { needed: 2 }),
    (err) => {
      assert.equal(err.status, 400);
      assert.match(err.message, /pledged/i);
      return true;
    },
  );
  assert.equal(updateFn.mock.calls.length, 0);
});

test("updateItem allows needed exactly equal to pledged", async (t) => {
  // Boundary: 3 of 3 is fully subscribed, not over-subscribed. Rejecting it would stop
  // an admin closing an item at its current level.
  mock.method(wishlistRepo, "findById", async () => item);
  mock.method(wishlistRepo, "update", async () => ({ ...item, needed: 3 }));
  t.after(() => mock.restoreAll());

  const row = await wishlistService.updateItem("sports-equipment", { needed: 3 });

  assert.equal(row.needed, 3);
});

test("updateItem throws 404 when the row disappears between the read and the write", async (t) => {
  // Reachable only by a concurrent delete: findById saw the row, update matched nothing.
  // Worth keeping rather than trusting the earlier existence check, because the two
  // statements are not in one transaction.
  mock.method(wishlistRepo, "findById", async () => item);
  mock.method(wishlistRepo, "update", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => wishlistService.updateItem("sports-equipment", { title_en: "x" }),
    (err) => {
      assert.equal(err.status, 404);
      return true;
    },
  );
});

test("deleteItem returns the removed row", async (t) => {
  mock.method(wishlistRepo, "remove", async () => item);
  t.after(() => mock.restoreAll());

  const row = await wishlistService.deleteItem("sports-equipment");

  assert.equal(row.id, "sports-equipment");
});

test("deleteItem throws 404 for an unknown id", async (t) => {
  mock.method(wishlistRepo, "remove", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => wishlistService.deleteItem("no-such-item"),
    (err) => {
      assert.equal(err.status, 404);
      return true;
    },
  );
});
