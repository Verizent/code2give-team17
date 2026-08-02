const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const campaignsRepo = require("../../../src/data/campaigns.repo");
const donationsRepo = require("../../../src/data/donations.repo");
const {
  listApproved,
  createCampaign,
  moderateCampaign,
  getBySlug,
  updateCampaign,
  deleteCampaign,
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

test("getBySlug returns rejected campaigns for creator status", async (t) => {
  mock.method(campaignsRepo, "findBySlug", async () => ({
    slug: "gone",
    status: "rejected",
  }));
  t.after(() => mock.restoreAll());

  const campaign = await getBySlug("gone");
  assert.equal(campaign.status, "rejected");
});

test("getBySlug 404s when the slug is missing", async (t) => {
  mock.method(campaignsRepo, "findBySlug", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(() => getBySlug("missing"), (err) => err.status === 404);
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

test("deleteCampaign refuses to orphan donations", async (t) => {
  // `donations_campaign_id_fkey` is ON DELETE SET NULL, so Postgres raises nothing here —
  // it quietly nulls the link and the money loses its attribution for good. The database
  // will not stop this, so the service has to.
  mock.method(campaignsRepo, "findById", async () => ({ id: "c1", title: "Summer Run" }));
  mock.method(donationsRepo, "countByCampaign", async () => 3);
  const remove = mock.method(campaignsRepo, "remove", async () => ({ id: "c1" }));
  t.after(() => mock.restoreAll());

  await assert.rejects(() => deleteCampaign("c1"), (err) => err.status === 409);
  assert.equal(remove.mock.callCount(), 0, "must not delete a funded fundraiser");
});

test("deleteCampaign removes a fundraiser that has taken no money", async (t) => {
  mock.method(campaignsRepo, "findById", async () => ({ id: "c1" }));
  mock.method(donationsRepo, "countByCampaign", async () => 0);
  const remove = mock.method(campaignsRepo, "remove", async () => ({ id: "c1" }));
  t.after(() => mock.restoreAll());

  await deleteCampaign("c1");

  assert.equal(remove.mock.callCount(), 1);
  assert.equal(remove.mock.calls[0].arguments[0], "c1");
});

test("deleteCampaign 404s on an unknown id", async (t) => {
  mock.method(campaignsRepo, "findById", async () => null);
  const countByCampaign = mock.method(donationsRepo, "countByCampaign", async () => 0);
  t.after(() => mock.restoreAll());

  await assert.rejects(() => deleteCampaign("nope"), (err) => err.status === 404);
  assert.equal(countByCampaign.mock.callCount(), 0, "existence is checked first");
});

test("updateCampaign 404s on an unknown id", async (t) => {
  mock.method(campaignsRepo, "findById", async () => null);
  t.after(() => mock.restoreAll());

  await assert.rejects(
    () => updateCampaign("nope", { title: "Renamed" }),
    (err) => err.status === 404,
  );
});

test("updateCampaign forwards only the fields it was given", async (t) => {
  // A patch that quietly widened to every column would reset story/goal to undefined.
  mock.method(campaignsRepo, "findById", async () => ({ id: "c1", title: "Old" }));
  const update = mock.method(campaignsRepo, "update", async (_id, patch) => ({
    id: "c1",
    ...patch,
  }));
  t.after(() => mock.restoreAll());

  await updateCampaign("c1", { title: "New title" });

  assert.deepEqual(update.mock.calls[0].arguments[1], { title: "New title" });
});

test("updateCampaign rejects an empty patch rather than reporting a no-op success", async (t) => {
  mock.method(campaignsRepo, "findById", async () => ({ id: "c1" }));
  const update = mock.method(campaignsRepo, "update", async () => ({ id: "c1" }));
  t.after(() => mock.restoreAll());

  await assert.rejects(() => updateCampaign("c1", {}), (err) => err.status === 400);
  assert.equal(update.mock.callCount(), 0);
});
