const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const mediaRepo = require("../../../src/data/media.repo");
const { uploadCoverImage } = require("../../../src/services/admin/uploads.service");

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);

function stubUpload(t, url = "https://example.test/media/cover.png") {
  const calls = [];
  mock.method(mediaRepo, "uploadPublicObject", async (path, body, contentType) => {
    calls.push({ path, size: body.length, contentType });
    return url;
  });
  t.after(() => mock.restoreAll());
  return calls;
}

test("uploadCoverImage stores the file and returns its public URL", async (t) => {
  const calls = stubUpload(t);

  const result = await uploadCoverImage(PNG, "image/png");

  assert.equal(result.url, "https://example.test/media/cover.png");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].contentType, "image/png");
});

test("the stored path carries the right extension and is not the caller's filename", async (t) => {
  const calls = stubUpload(t);

  await uploadCoverImage(PNG, "image/webp");

  // Derived from the mime type, never from a client-supplied name: a caller-controlled
  // path is how you get directory traversal or an overwritten object.
  assert.match(calls[0].path, /\.webp$/);
  assert.ok(!calls[0].path.includes(".."));
});

test("two uploads of identical bytes do not collide", async (t) => {
  const calls = stubUpload(t);

  await uploadCoverImage(PNG, "image/png");
  await uploadCoverImage(PNG, "image/png");

  assert.notEqual(calls[0].path, calls[1].path);
});

test("a disallowed content type is rejected before anything is stored", async (t) => {
  const calls = stubUpload(t);

  await assert.rejects(() => uploadCoverImage(PNG, "image/svg+xml"), { status: 400 });
  await assert.rejects(() => uploadCoverImage(PNG, "text/html"), { status: 400 });

  // SVG and HTML can carry script. The bucket rejects them too, but failing here means
  // the bytes never leave the process.
  assert.equal(calls.length, 0);
});

test("an empty body is rejected rather than stored as a zero-byte image", async (t) => {
  stubUpload(t);
  await assert.rejects(() => uploadCoverImage(Buffer.alloc(0), "image/png"), { status: 400 });
});

test("a file over the bucket limit is rejected before upload", async (t) => {
  const calls = stubUpload(t);
  const tooBig = Buffer.alloc(5 * 1024 * 1024 + 1);

  await assert.rejects(() => uploadCoverImage(tooBig, "image/png"), { status: 413 });
  assert.equal(calls.length, 0);
});
