const { test } = require("node:test");
const assert = require("node:assert/strict");

const handsonAdmin = require("../../../src/services/admin/handson.service");

// DEMO-ONLY: HandsOn admin sync wraps a seeded stub — real integration needs
// partner credentials (§17). Reflected here as a contract test: `mock` mode
// returns a completed report; `live` mode throws.

test("returns a completed sync report in stub mode", async () => {
  process.env.HANDSON_MODE = "mock";
  const report = await handsonAdmin.runSync();
  assert.equal(report.status, "completed");
  assert.equal(report.mode, "stub");
  assert.ok(report.started_at);
  assert.ok(report.completed_at);
});

test("throws when HANDSON_MODE is live because the real integration is not implemented", async () => {
  process.env.HANDSON_MODE = "live";
  await assert.rejects(
    () => handsonAdmin.runSync(),
    (error) => {
      assert.equal(error.status, 400);
      return true;
    },
  );
  process.env.HANDSON_MODE = "mock";
});
