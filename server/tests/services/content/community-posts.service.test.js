const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const communityPostsRepo = require("../../../src/data/community-posts.repo");
const {
  listVoices,
  submitVoice,
  listVoicesByStatus,
  moderateVoice,
} = require("../../../src/services/content/community-posts.service");

const approvedRow = {
  id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  author_name: "Rachel L.",
  relationship: "volunteer",
  story: "A story long enough to pass the minimum length check.",
  photo_url: null,
  submitted_at: "2026-07-20T02:31:00.000Z",
};

const pendingRow = {
  ...approvedRow,
  id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  contact_email: "rachel@example.com",
  status: "pending",
  moderation_note: null,
  moderated_at: null,
  moderated_by: null,
};

test("listVoices returns items and paging meta", async (t) => {
  mock.method(communityPostsRepo, "listApproved", async () => ({ rows: [approvedRow], total: 1 }));
  t.after(() => mock.restoreAll());

  const { items, meta } = await listVoices({ page: 1, limit: 12 });

  assert.equal(items.length, 1);
  assert.equal(items[0].id, approvedRow.id);
  assert.deepEqual(meta, { total: 1, page: 1, limit: 12 });
});

test("submitVoice with a truthy honeypot returns fake 201 and skips the DB", async (t) => {
  const createFn = mock.fn(async () => approvedRow);
  mock.method(communityPostsRepo, "create", createFn);
  t.after(() => mock.restoreAll());

  const result = await submitVoice({
    author_name: "Bot",
    relationship: "other",
    story: "A".repeat(40),
    consent_given: true,
    website: "https://spam.example.com",
  });

  assert.equal(createFn.mock.calls.length, 0, "repo.create must not be called");
  assert.equal(result.id, null);
  assert.ok(result.submitted_at, "fake 201 must include a submitted_at timestamp");
});

test("submitVoice without honeypot inserts and returns id + submitted_at", async (t) => {
  mock.method(communityPostsRepo, "create", async () => ({
    id: approvedRow.id,
    submitted_at: approvedRow.submitted_at,
  }));
  t.after(() => mock.restoreAll());

  const result = await submitVoice({
    author_name: "Rachel L.",
    relationship: "volunteer",
    story: "A story long enough to pass the minimum length check.",
    consent_given: true,
  });

  assert.equal(result.id, approvedRow.id);
  assert.ok(result.submitted_at);
});

test("submitVoice strips the website field before passing to repo", async (t) => {
  const createFn = mock.fn(async () => ({ id: approvedRow.id, submitted_at: approvedRow.submitted_at }));
  mock.method(communityPostsRepo, "create", createFn);
  t.after(() => mock.restoreAll());

  await submitVoice({
    author_name: "Rachel L.",
    relationship: "volunteer",
    story: "A story long enough to pass the minimum length check.",
    consent_given: true,
    website: "",
  });

  const passedData = createFn.mock.calls[0].arguments[0];
  assert.equal("website" in passedData, false, "website must not reach the repo");
});

test("listVoicesByStatus returns the admin queue with paging meta", async (t) => {
  mock.method(communityPostsRepo, "listByStatus", async () => ({ rows: [pendingRow], total: 1 }));
  t.after(() => mock.restoreAll());

  const { items, meta } = await listVoicesByStatus({ page: 1, limit: 20 });

  assert.equal(items.length, 1);
  assert.equal(items[0].contact_email, "rachel@example.com");
  assert.deepEqual(meta, { total: 1, page: 1, limit: 20 });
});

test("moderateVoice returns the updated row on success", async (t) => {
  const approved = { ...pendingRow, status: "approved", moderated_at: "2026-08-01T10:00:00.000Z" };
  mock.method(communityPostsRepo, "moderate", async () => approved);
  t.after(() => mock.restoreAll());

  const row = await moderateVoice(pendingRow.id, { status: "approved" });

  assert.equal(row.status, "approved");
});

test("moderateVoice throws 404 when the id does not exist", async (t) => {
  mock.method(communityPostsRepo, "moderate", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => moderateVoice("00000000-0000-0000-0000-000000000000", { status: "approved" }),
    (error) => {
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test("submitVoice attributes submitted_by to actor.userId when signed in", async (t) => {
  const createFn = mock.fn(async () => ({ id: approvedRow.id, submitted_at: approvedRow.submitted_at }));
  mock.method(communityPostsRepo, "create", createFn);
  t.after(() => mock.restoreAll());

  await submitVoice(
    {
      author_name: "Rachel L.",
      relationship: "volunteer",
      story: "A story long enough to pass the minimum length check.",
      consent_given: true,
    },
    { userId: "11111111-1111-1111-1111-111111111111", role: "volunteer" },
  );

  const passedData = createFn.mock.calls[0].arguments[0];
  assert.equal(
    passedData.submitted_by,
    "11111111-1111-1111-1111-111111111111",
    "signed-in submissions must record the submitting profile id",
  );
});

test("submitVoice writes submitted_by = null when actor is absent", async (t) => {
  const createFn = mock.fn(async () => ({ id: approvedRow.id, submitted_at: approvedRow.submitted_at }));
  mock.method(communityPostsRepo, "create", createFn);
  t.after(() => mock.restoreAll());

  await submitVoice({
    author_name: "Rachel L.",
    relationship: "volunteer",
    story: "A story long enough to pass the minimum length check.",
    consent_given: true,
  });

  const passedData = createFn.mock.calls[0].arguments[0];
  assert.equal(
    passedData.submitted_by,
    null,
    "anonymous submissions must record submitted_by as null, not undefined",
  );
});

test("submitVoice honeypot short-circuit ignores the actor argument", async (t) => {
  const createFn = mock.fn(async () => approvedRow);
  mock.method(communityPostsRepo, "create", createFn);
  t.after(() => mock.restoreAll());

  const result = await submitVoice(
    {
      author_name: "Bot",
      relationship: "other",
      story: "A".repeat(40),
      consent_given: true,
      website: "https://spam.example.com",
    },
    { userId: "22222222-2222-2222-2222-222222222222", role: "admin" },
  );

  assert.equal(createFn.mock.calls.length, 0, "honeypot must skip the DB even for signed-in callers");
  assert.equal(result.id, null);
});

test("submitVoice files a submission as pending by default", async (t) => {
  let received;
  mock.method(communityPostsRepo, "create", async (data) => {
    received = data;
    return { id: "1", submitted_at: "now" };
  });
  t.after(() => {
    mock.restoreAll();
    delete process.env.VOICES_AUTO_APPROVE;
  });

  delete process.env.VOICES_AUTO_APPROVE;
  await submitVoice({ author_name: "A", relationship: "parent", story: "x", consent_given: true });

  // No status passed at all — the column default decides, which is 'pending'.
  assert.equal(received.status, undefined);
});

test("submitVoice can auto-approve when the demo flag is on", async (t) => {
  let received;
  mock.method(communityPostsRepo, "create", async (data) => {
    received = data;
    return { id: "1", submitted_at: "now" };
  });
  t.after(() => {
    mock.restoreAll();
    delete process.env.VOICES_AUTO_APPROVE;
  });

  process.env.VOICES_AUTO_APPROVE = "true";
  await submitVoice({ author_name: "A", relationship: "parent", story: "x", consent_given: true });

  assert.equal(received.status, "approved");
});

test("submitVoice treats any value other than 'true' as moderation on", async (t) => {
  let received;
  mock.method(communityPostsRepo, "create", async (data) => {
    received = data;
    return { id: "1", submitted_at: "now" };
  });
  t.after(() => {
    mock.restoreAll();
    delete process.env.VOICES_AUTO_APPROVE;
  });

  // "false" must not read as truthy — that is how a demo flag ships to production on.
  process.env.VOICES_AUTO_APPROVE = "false";
  await submitVoice({ author_name: "A", relationship: "parent", story: "x", consent_given: true });

  assert.equal(received.status, undefined);
});
