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

test("extractShortcode reads the post id from a canonical permalink", () => {
  const { extractShortcode } = instagramService;
  assert.equal(extractShortcode("https://www.instagram.com/p/DClgUbuyVp2/"), "DClgUbuyVp2");
  assert.equal(extractShortcode("https://instagram.com/p/DbHz2e1jOoh/"), "DbHz2e1jOoh");
});

test("extractShortcode tolerates the shapes a person actually pastes", () => {
  const { extractShortcode } = instagramService;
  // No trailing slash, and the share-sheet tracking parameters Instagram appends.
  assert.equal(extractShortcode("https://www.instagram.com/p/DbDCZ9OgRt7"), "DbDCZ9OgRt7");
  assert.equal(
    extractShortcode("https://www.instagram.com/p/DaUYPKJCQAy/?img_index=1&igsh=abc123"),
    "DaUYPKJCQAy",
  );
});

test("extractShortcode refuses anything that is not a post permalink", () => {
  const { extractShortcode } = instagramService;
  // A profile URL is the most likely wrong paste — there is no post to embed.
  assert.equal(extractShortcode("https://www.instagram.com/love21foundation/"), null);
  assert.equal(extractShortcode("https://example.com/p/DClgUbuyVp2/"), null);
  // Lookalike host: a prefix test would accept this.
  assert.equal(extractShortcode("https://instagram.com.evil.com/p/DClgUbuyVp2/"), null);
  assert.equal(extractShortcode("javascript:alert(1)"), null);
  assert.equal(extractShortcode(""), null);
  assert.equal(extractShortcode(undefined), null);
});

test("listActiveEmbeds collapses the bilingual caption for the requested locale", async (t) => {
  mock.method(instagramRepo, "listActive", async () => [embed]);
  t.after(() => mock.restoreAll());

  const [en] = await instagramService.listActiveEmbeds("en");
  assert.equal(en.caption, "A great session");
  // Raw bilingual columns must not reach a public response.
  assert.equal(en.caption_en, undefined);
  assert.equal(en.caption_zh, undefined);

  const [zh] = await instagramService.listActiveEmbeds("zh-Hant");
  assert.equal(zh.caption, "精彩活動");
});

test("listActiveEmbeds falls back to English when the translation is missing", async (t) => {
  mock.method(instagramRepo, "listActive", async () => [{ ...embed, caption_zh: "" }]);
  t.after(() => mock.restoreAll());

  const [row] = await instagramService.listActiveEmbeds("zh-Hant");
  // Rendering an empty caption is the dishonest option.
  assert.equal(row.caption, "A great session");
});

test("listActiveEmbeds hands the client a shortcode so it never parses URLs itself", async (t) => {
  mock.method(instagramRepo, "listActive", async () => [
    { ...embed, url: "https://www.instagram.com/p/DClgUbuyVp2/?igsh=xyz" },
  ]);
  t.after(() => mock.restoreAll());

  const [row] = await instagramService.listActiveEmbeds("en");
  assert.equal(row.shortcode, "DClgUbuyVp2");
});

test("listActiveEmbeds drops a row whose url is not a usable permalink", async (t) => {
  // A bad row must not render an iframe pointed at instagram.com/p/null/.
  mock.method(instagramRepo, "listActive", async () => [
    { ...embed, id: "bad", url: "https://www.instagram.com/love21foundation/" },
    { ...embed, id: "good", url: "https://www.instagram.com/p/DbDCZ9OgRt7/" },
  ]);
  t.after(() => mock.restoreAll());

  const rows = await instagramService.listActiveEmbeds("en");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].shortcode, "DbDCZ9OgRt7");
});
