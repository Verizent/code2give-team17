const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  createCampaignSchema,
  updateCampaignSchema,
  adminCampaignListQuerySchema,
} = require("../../src/schemas/campaign.schema");

test("updateCampaignSchema inherits the create rules rather than restating them", () => {
  // The two drifted apart when the update schema was hand-copied: tightening a rule on
  // create left the PATCH path permissive, and nothing failed to say so.
  assert.equal(updateCampaignSchema.safeParse({ title: "abc" }).success, false);
  assert.equal(createCampaignSchema.safeParse({ title: "abc" }).success, false);
  assert.equal(updateCampaignSchema.safeParse({ title: "A real title" }).success, true);
});

test("updateCampaignSchema stays strict about server-derived fields", () => {
  // Silently dropping these is the failure mode: the caller sees 200 and believes the
  // slug moved or the total was set.
  for (const field of ["slug", "status", "raised_hkd", "id"]) {
    assert.equal(
      updateCampaignSchema.safeParse({ [field]: "x" }).success,
      false,
      `${field} must be rejected, not ignored`,
    );
  }
});

test("updateCampaignSchema allows a partial patch", () => {
  assert.equal(updateCampaignSchema.safeParse({ goal_hkd: 5000 }).success, true);
});

test("the admin queue rejects an unknown status instead of returning an empty page", () => {
  // Previously read straight off req.query, so `?status=pending` (not a real value) filtered
  // to zero rows and reported total 0 with no error — indistinguishable from an empty queue.
  assert.equal(adminCampaignListQuerySchema.safeParse({ status: "pending" }).success, false);
  assert.equal(adminCampaignListQuerySchema.safeParse({ status: "nonsense" }).success, false);
});

test("the admin queue accepts the real statuses and the all sentinel", () => {
  for (const status of ["pending_approval", "approved", "rejected", "all"]) {
    assert.equal(
      adminCampaignListQuerySchema.safeParse({ status }).success,
      true,
      `${status} must be accepted`,
    );
  }
  // Absent is legal — the service defaults to the pending queue.
  assert.equal(adminCampaignListQuerySchema.safeParse({}).success, true);
});
