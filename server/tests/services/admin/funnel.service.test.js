const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const donationsRepo = require("../../../src/data/donations.repo");
const signupsRepo = require("../../../src/data/signups.repo");
const interestsRepo = require("../../../src/data/interests.repo");
const { getFunnel, rate } = require("../../../src/services/admin/funnel.service");

test("rate returns 0 when from is 0", () => {
  assert.equal(rate(0, 10), 0);
  assert.equal(rate(100, 25), 25);
});

test("getFunnel returns zeros and empty when DB has no activity", async (t) => {
  mock.method(interestsRepo, "countAll", async () => 0);
  mock.method(signupsRepo, "countAll", async () => 0);
  mock.method(signupsRepo, "countByDiscoverySource", async () => []);
  mock.method(donationsRepo, "sumAmounts", async () => ({ total_hkd: 0, count: 0 }));
  mock.method(donationsRepo, "countByReferralSource", async () => []);
  t.after(() => mock.restoreAll());

  const funnel = await getFunnel();
  assert.equal(funnel.seeded, false);
  assert.equal(funnel.empty, true);
  assert.equal(funnel.stages.every((s) => s.count === 0), true);
  assert.equal(funnel.sources.length, 0);
  assert.match(funnel.note, /zero/i);
});

test("getFunnel uses live counts and form-side sources", async (t) => {
  mock.method(interestsRepo, "countAll", async () => 12);
  mock.method(signupsRepo, "countAll", async () => 5);
  mock.method(signupsRepo, "countByDiscoverySource", async () => [
    { source: "handson", count: 3 },
    { source: "instagram", count: 2 },
  ]);
  mock.method(donationsRepo, "sumAmounts", async () => ({ total_hkd: 4000, count: 4 }));
  mock.method(donationsRepo, "countByReferralSource", async () => [
    { source: "instagram", count: 2 },
    { source: "search", count: 2 },
  ]);
  t.after(() => mock.restoreAll());

  const funnel = await getFunnel();
  assert.equal(funnel.seeded, false);
  assert.equal(funnel.empty, false);
  assert.equal(funnel.stages.find((s) => s.id === "volunteer_intent")?.count, 12);
  assert.equal(funnel.stages.find((s) => s.id === "volunteer")?.count, 5);
  assert.equal(funnel.stages.find((s) => s.id === "donor")?.count, 4);
  assert.ok(funnel.sources.some((s) => s.source === "instagram" && s.volunteers === 2 && s.donors === 2));
  assert.match(funnel.note, /Live counts/i);
});
