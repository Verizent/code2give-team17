const { test, mock } = require("node:test");
const assert = require("node:assert/strict");
const proofsRepo = require("../../../src/data/proofs.repo");
const socialDraftsRepo = require("../../../src/data/social-drafts.repo");
const { approve, buildFanout } = require("../../../src/services/admin/proofs.service");

const PROOF_ID = "a1000000-0000-4000-8000-000000000001";

test("buildFanout includes bilingual Instagram drafts", () => {
  const fanout = buildFanout({
    id: PROOF_ID,
    title: "Saturday bocce",
    consent: "partial",
    members_blurred: 2,
  });
  assert.equal(fanout.drafts.length, 3);
  assert.ok(fanout.drafts.some((d) => d.channel === "instagram" && d.lang === "zh-Hant"));
});

test("approve persists fanout and inserts social drafts once", async (t) => {
  mock.method(proofsRepo, "findById", async () => ({
    id: PROOF_ID,
    title: "Saturday bocce",
    programme: "sports",
    consent: "consented",
    members_visible: 4,
    members_blurred: 0,
    thumb_url: "/brand/hero-group.jpg",
    status: "pending",
    approved_at: null,
    fanout: null,
  }));
  mock.method(proofsRepo, "updateApproval", async (_id, patch) => ({
    id: PROOF_ID,
    title: "Saturday bocce",
    programme: "sports",
    consent: "consented",
    members_visible: 4,
    members_blurred: 0,
    thumb_url: "/brand/hero-group.jpg",
    status: patch.status,
    approved_at: patch.approved_at,
    fanout: patch.fanout,
  }));
  mock.method(socialDraftsRepo, "countByProofId", async () => 0);
  let inserted = [];
  mock.method(socialDraftsRepo, "insertMany", async (rows) => {
    inserted = rows;
    return rows.map((r, i) => ({ id: `d${i}`, ...r }));
  });
  t.after(() => mock.restoreAll());

  const proof = await approve(PROOF_ID);
  assert.equal(proof.status, "approved");
  assert.ok(proof.fanout);
  assert.equal(proof.thumb, "/brand/hero-group.jpg");
  assert.equal(inserted.length, 3);
  assert.ok(inserted.every((r) => r.proof_id === PROOF_ID));
});
