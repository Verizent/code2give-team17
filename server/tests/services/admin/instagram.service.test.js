const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const instagramRepo = require("../../../src/data/instagram.repo");
const instagramService = require("../../../src/services/admin/instagram.service");

const embed = {
  id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
  url: "https://www.instagram.com/p/abc123/",
  caption_en: "A great session",
  caption_zh: "精彩活動",
  display_order: 0,
  is_active: true,
};

test("listEmbeds returns items and meta", async (t) => {
  mock.method(instagramRepo, "listAll", async () => ({ rows: [embed], total: 1 }));
  t.after(() => mock.restoreAll());

  const { items, meta } = await instagramService.listEmbeds({ page: 1, limit: 12 });

  assert.equal(items.length, 1);
  assert.deepEqual(meta, { total: 1, page: 1, limit: 12 });
});

test("listActiveEmbeds returns only active embeds ordered by display_order", async (t) => {
  mock.method(instagramRepo, "listActive", async () => [embed]);
  t.after(() => mock.restoreAll());

  const items = await instagramService.listActiveEmbeds();

  assert.equal(items.length, 1);
  assert.equal(items[0].is_active, true);
});

test("createEmbed rejects non-instagram URLs", async (t) => {
  await assert.rejects(
    () => instagramService.createEmbed({ url: "https://twitter.com/foo" }),
    (err) => { assert.equal(err.status, 400); return true; },
  );
});

test("createEmbed accepts valid instagram post URLs", async (t) => {
  const createFn = mock.fn(async () => embed);
  mock.method(instagramRepo, "create", createFn);
  t.after(() => mock.restoreAll());

  const result = await instagramService.createEmbed({ url: "https://www.instagram.com/p/abc123/" });

  assert.equal(result.url, embed.url);
  assert.equal(createFn.mock.calls.length, 1);
});

test("updateEmbed throws 404 for unknown id", async (t) => {
  mock.method(instagramRepo, "update", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => instagramService.updateEmbed("00000000-0000-0000-0000-000000000000", { is_active: false }),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});

test("deleteEmbed throws 404 for unknown id", async (t) => {
  mock.method(instagramRepo, "remove", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => instagramService.deleteEmbed("00000000-0000-0000-0000-000000000000"),
    (err) => { assert.equal(err.status, 404); return true; },
  );
});
