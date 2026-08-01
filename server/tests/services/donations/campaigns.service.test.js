const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const campaignsRepo = require("../../../src/data/campaigns.repo");
const {
  listApproved,
  createCampaign,
  moderateCampaign,
  getBySlug,
} = require("../../../src/services/donations/campaigns.service");

test("listApproved only requests approved status", async (t) => {
  mock.method(campaignsRepo, "list", async (opts) => {
    assert.equal(opts.status, "approved");
    return { rows: [{ slug: "ok", status: "approved" }], total: 1 };
  });
  t.after(() => mock.restoreAll());

  const { items, meta } = await listApproved({ page: 1, limit: 12 });
  assert.equal(items.length, 1);
  assert.equal(meta.total, 1);
});

test("createCampaign inserts pending_approval with unique slug", async (t) => {
  mock.method(campaignsRepo, "slugExists", async (slug) => slug === "summer-run");
  mock.method(campaignsRepo, "insert", async (input) => {
    assert.equal(input.status, "pending_approval");
    assert.equal(input.slug, "summer-run-2");
    return { id: "c1", ...input };
  });
  t.after(() => mock.restoreAll());

  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 7);
  const end_date = tomorrow.toISOString().slice(0, 10);

  const campaign = await createCampaign({
    title: "Summer Run",
    story: "A".repeat(24),
    goal_hkd: 5000,
    cover_image_url: "/brand/hero-group.jpg",
    end_date,
  });
  assert.equal(campaign.status, "pending_approval");
});

test("getBySlug hides rejected campaigns", async (t) => {
  mock.method(campaignsRepo, "findBySlug", async () => ({
    slug: "gone",
    status: "rejected",
  }));
  t.after(() => mock.restoreAll());

  await assert.rejects(() => getBySlug("gone"), (err) => err.status === 404);
});

test("moderateCampaign only allows pending → approved|rejected", async (t) => {
  mock.method(campaignsRepo, "findById", async () => ({
    id: "c1",
    status: "pending_approval",
  }));
  mock.method(campaignsRepo, "updateStatus", async (_id, patch) => ({
    id: "c1",
    status: patch.status,
  }));
  t.after(() => mock.restoreAll());

  const approved = await moderateCampaign("c1", "approved");
  assert.equal(approved.status, "approved");
});

test("moderateCampaign rejects already-approved rows", async (t) => {
  mock.method(campaignsRepo, "findById", async () => ({
    id: "c1",
    status: "approved",
  }));
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => moderateCampaign("c1", "rejected"),
    (err) => err.status === 400,
  );
});
