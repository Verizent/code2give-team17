const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const communityPostsRepo = require("../../../src/data/community-posts.repo");
const {
  deleteVoice,
  listVoicesByStatus,
} = require("../../../src/services/content/community-posts.service");

function stubRemove(t, result) {
  const calls = [];
  mock.method(communityPostsRepo, "remove", async (id) => {
    calls.push(id);
    return result;
  });
  t.after(() => mock.restoreAll());
  return calls;
}

test("deleteVoice removes the post and returns the deleted row", async (t) => {
  const calls = stubRemove(t, { id: "post-1" });

  const row = await deleteVoice("post-1");

  assert.deepEqual(row, { id: "post-1" });
  assert.deepEqual(calls, ["post-1"]);
});

test("deleting an unknown id is a 404, not a silent success", async (t) => {
  // maybeSingle() returns null for a row that is not there. Returning 204 anyway would
  // tell the CMS a post was removed when nothing was.
  stubRemove(t, null);

  await assert.rejects(() => deleteVoice("missing"), { status: 404 });
});

test("deleteVoice is not restricted by status", async (t) => {
  // A supporter can withdraw consent after their story is approved and public, so the
  // one status that most needs removing is the one already on the Community page.
  const calls = stubRemove(t, { id: "approved-post" });

  await deleteVoice("approved-post");

  assert.deepEqual(calls, ["approved-post"]);
});

function stubListByStatus(t) {
  const calls = [];
  mock.method(communityPostsRepo, "listByStatus", async (options) => {
    calls.push(options);
    return { rows: [], total: 0 };
  });
  t.after(() => mock.restoreAll());
  return calls;
}

test("the admin list defaults to the pending queue", async (t) => {
  const calls = stubListByStatus(t);

  await listVoicesByStatus({});

  assert.equal(calls[0].status, "pending");
});

test("the admin list can ask for approved or rejected posts", async (t) => {
  const calls = stubListByStatus(t);

  await listVoicesByStatus({ status: "approved" });
  await listVoicesByStatus({ status: "rejected" });

  assert.deepEqual(
    calls.map((call) => call.status),
    ["approved", "rejected"],
  );
});

test("the admin list still returns items and meta", async (t) => {
  stubListByStatus(t);

  const result = await listVoicesByStatus({});

  assert.ok(Array.isArray(result.items));
  assert.equal(typeof result.meta.total, "number");
});
