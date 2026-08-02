const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const mediaRepo = require("../../../src/data/media.repo");
const {
  detectImageType,
  buildObjectKey,
  uploadCommunityPhoto,
  MAX_UPLOAD_BYTES,
  isOwnMediaUrl,
} = require("../../../src/services/content/media.service");

/** Smallest byte prefixes that a real file of each type starts with. */
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP = Buffer.concat([
  Buffer.from("RIFF"),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from("WEBP"),
]);

test("detectImageType recognises JPEG, PNG and WebP from their magic bytes", () => {
  assert.equal(detectImageType(JPEG), "image/jpeg");
  assert.equal(detectImageType(PNG), "image/png");
  assert.equal(detectImageType(WEBP), "image/webp");
});

test("detectImageType rejects SVG even though it is an image", () => {
  // SVG can carry <script>, and the media bucket is public — an accepted SVG
  // would be stored XSS served from the bucket origin.
  assert.equal(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg">')), null);
  assert.equal(detectImageType(Buffer.from('<?xml version="1.0"?><svg>')), null);
});

test("detectImageType rejects a text file renamed to .png", () => {
  // The filename and Content-Type are both attacker-controlled; only the bytes are not.
  assert.equal(detectImageType(Buffer.from("this is not an image, it is prose")), null);
});

test("detectImageType rejects a buffer too short to carry a signature", () => {
  assert.equal(detectImageType(Buffer.alloc(0)), null);
  assert.equal(detectImageType(Buffer.from([0xff, 0xd8])), null);
});

test("detectImageType does not mistake a RIFF container that is not WebP", () => {
  // A .wav is also RIFF; only the WEBP fourcc at offset 8 makes it an image.
  const wav = Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.from([0x24, 0x00, 0x00, 0x00]),
    Buffer.from("WAVE"),
  ]);
  assert.equal(detectImageType(wav), null);
});

test("buildObjectKey derives the extension from the sniffed type, not from any caller input", () => {
  assert.match(buildObjectKey("image/jpeg"), /^community\/[0-9a-f-]{36}\.jpg$/);
  assert.match(buildObjectKey("image/png"), /^community\/[0-9a-f-]{36}\.png$/);
  assert.match(buildObjectKey("image/webp"), /^community\/[0-9a-f-]{36}\.webp$/);
});

test("buildObjectKey produces a distinct key per call so an upload can never overwrite another", () => {
  const keys = new Set(Array.from({ length: 50 }, () => buildObjectKey("image/png")));
  assert.equal(keys.size, 50);
});

test("uploadCommunityPhoto stores the bytes and returns the repo's public URL", async (t) => {
  let received;
  mock.method(mediaRepo, "uploadPublicObject", async (key, buffer, contentType) => {
    received = { key, buffer, contentType };
    return "https://example.supabase.co/storage/v1/object/public/media/" + key;
  });
  t.after(() => mock.restoreAll());

  const url = await uploadCommunityPhoto(PNG);

  assert.equal(received.contentType, "image/png");
  assert.equal(received.buffer, PNG);
  assert.match(received.key, /^community\/[0-9a-f-]{36}\.png$/);
  assert.ok(url.endsWith(received.key));
});

test("uploadCommunityPhoto refuses a payload over the size ceiling before touching storage", async (t) => {
  let called = false;
  mock.method(mediaRepo, "uploadPublicObject", async () => {
    called = true;
    return "unreachable";
  });
  t.after(() => mock.restoreAll());

  const oversize = Buffer.concat([PNG, Buffer.alloc(MAX_UPLOAD_BYTES)]);

  await assert.rejects(() => uploadCommunityPhoto(oversize), { status: 400 });
  assert.equal(called, false, "storage must not be written when the payload is too large");
});

test("uploadCommunityPhoto refuses a non-image payload before touching storage", async (t) => {
  let called = false;
  mock.method(mediaRepo, "uploadPublicObject", async () => {
    called = true;
    return "unreachable";
  });
  t.after(() => mock.restoreAll());

  await assert.rejects(() => uploadCommunityPhoto(Buffer.from("<svg><script/></svg>")), {
    status: 400,
  });
  assert.equal(called, false, "storage must not be written for a rejected type");
});

test("uploadCommunityPhoto refuses an empty body", async (t) => {
  mock.method(mediaRepo, "uploadPublicObject", async () => "unreachable");
  t.after(() => mock.restoreAll());

  await assert.rejects(() => uploadCommunityPhoto(Buffer.alloc(0)), { status: 400 });
});

test("isOwnMediaUrl accepts only URLs the upload endpoint could have produced", () => {
  const previous = process.env.SUPABASE_URL;
  process.env.SUPABASE_URL = "https://proj.supabase.co";
  const base = "https://proj.supabase.co/storage/v1/object/public/media/community/";

  assert.equal(isOwnMediaUrl(`${base}0ef03983-a5bf-4307-add5-f276164c1717.png`), true);

  // Skipping the upload endpoint and posting a URL directly would otherwise bypass
  // every size and MIME check the endpoint exists to enforce.
  assert.equal(isOwnMediaUrl("https://evil.example.com/tracker.gif"), false);
  // A lookalike host that merely starts with ours.
  assert.equal(isOwnMediaUrl("https://proj.supabase.co.evil.com/storage/v1/object/public/media/community/a.png"), false);
  // Right host, wrong bucket or prefix.
  assert.equal(isOwnMediaUrl("https://proj.supabase.co/storage/v1/object/public/avatars/a.png"), false);
  assert.equal(isOwnMediaUrl("javascript:alert(1)"), false);
  assert.equal(isOwnMediaUrl(""), false);
  assert.equal(isOwnMediaUrl(undefined), false);

  process.env.SUPABASE_URL = previous;
});
