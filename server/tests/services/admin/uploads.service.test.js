const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const mediaRepo = require("../../../src/data/media.repo");
const { uploadCoverImage } = require("../../../src/services/admin/uploads.service");

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF", "ascii"),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP", "ascii"),
]);

function stubUpload(t, url = "https://example.test/media/cover.png") {
  const calls = [];
  mock.method(mediaRepo, "uploadPublicObject", async (key, buffer, contentType) => {
    calls.push({ key, size: buffer.length, contentType });
    return url;
  });
  t.after(() => mock.restoreAll());
  return calls;
}

test("uploadCoverImage stores the file and returns its public URL", async (t) => {
  const calls = stubUpload(t);

  const result = await uploadCoverImage(PNG);

  assert.equal(result.url, "https://example.test/media/cover.png");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].contentType, "image/png");
});

test("the content type comes from the bytes, not from a caller-supplied header", async (t) => {
  const calls = stubUpload(t);

  // A caller claiming image/png cannot make an HTML payload into a PNG: the bucket is
  // public, so a stored .html would be served from our own origin as stored XSS.
  const html = Buffer.from("<html><script>alert(1)</script></html>", "utf8");
  await assert.rejects(() => uploadCoverImage(html, "image/png"), { status: 400 });

  // ...and an honest JPEG is typed from its own magic bytes, whatever the header said.
  await uploadCoverImage(JPEG, "image/png");
  assert.equal(calls.at(-1).contentType, "image/jpeg");
  assert.match(calls.at(-1).key, /\.jpg$/);
});

test("each accepted format is recognised from its signature", async (t) => {
  const calls = stubUpload(t);

  await uploadCoverImage(PNG);
  await uploadCoverImage(JPEG);
  await uploadCoverImage(WEBP);

  assert.deepEqual(
    calls.map((call) => call.contentType),
    ["image/png", "image/jpeg", "image/webp"],
  );
});

test("the stored key carries the right extension and is not a caller filename", async (t) => {
  const calls = stubUpload(t);

  await uploadCoverImage(WEBP);

  // Derived server-side: a caller-controlled key is how you get traversal or an
  // overwritten object on a bucket shared with community photos.
  assert.match(calls[0].key, /^covers\//);
  assert.match(calls[0].key, /\.webp$/);
  assert.ok(!calls[0].key.includes(".."));
});

test("two uploads of identical bytes do not collide", async (t) => {
  const calls = stubUpload(t);

  await uploadCoverImage(PNG);
  await uploadCoverImage(PNG);

  assert.notEqual(calls[0].key, calls[1].key);
});

test("an SVG is rejected before anything is stored", async (t) => {
  const calls = stubUpload(t);

  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script/></svg>', "utf8");
  await assert.rejects(() => uploadCoverImage(svg), { status: 400 });

  assert.equal(calls.length, 0);
});

test("an empty body is rejected rather than stored as a zero-byte image", async (t) => {
  stubUpload(t);
  await assert.rejects(() => uploadCoverImage(Buffer.alloc(0)), { status: 400 });
});

test("a file over the bucket limit is rejected before upload", async (t) => {
  const calls = stubUpload(t);
  // Valid PNG magic, so it is the size that rejects it and not the signature check.
  const tooBig = Buffer.concat([PNG, Buffer.alloc(5 * 1024 * 1024)]);

  await assert.rejects(() => uploadCoverImage(tooBig), { status: 413 });
  assert.equal(calls.length, 0);
});
