const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const REPO = path.join(__dirname, "../../src/data/donations.repo.js");

/**
 * Asserts on source text rather than behaviour, for the same reason
 * `tests/routes/admin-mount.test.js` does: what this defends against is a future edit,
 * and the failure it guards is invisible at runtime.
 *
 * `findByStripeSession` feeds the Stripe webhook. Repos here use explicit column lists
 * (never `select('*')`), so a field the webhook reads but the list omits comes back
 * `undefined` — no error, no null, just a branch that never runs. That is exactly how
 * fundraiser crediting shipped broken: `campaign_id` was missing from this list, so
 * `if (donation.campaign_id)` was never true and `raised_hkd` stayed at zero while the
 * money sat in Stripe.
 *
 * Service unit tests cannot catch this. They stub the repo and hand back an object that
 * already has every field, so the stub is more generous than the real query.
 */

/** Fields `services/donations/webhook.service.js` reads off the donation row. */
const REQUIRED_BY_WEBHOOK = [
  "id",
  "amount_hkd",
  "status",
  "tracking_opt_in",
  "campaign_id",
  "created_at",
];

function findByStripeSessionSelect() {
  const source = fs.readFileSync(REPO, "utf8");
  const fn = source.slice(source.indexOf("async function findByStripeSession"));
  const body = fn.slice(0, fn.indexOf("\n}"));
  const select = body.match(/\.select\(\s*(?:\n\s*)?"([^"]+)"/);
  assert.ok(select, "could not locate the .select() in findByStripeSession — has it moved?");
  return select[1].split(",").map((c) => c.trim());
}

test("findByStripeSession selects every column the Stripe webhook reads", () => {
  const selected = findByStripeSessionSelect();

  const missing = REQUIRED_BY_WEBHOOK.filter((c) => !selected.includes(c));

  assert.deepEqual(
    missing,
    [],
    `findByStripeSession omits ${missing.join(", ")}. The webhook reads these off the row; ` +
      "an omitted column arrives as undefined and the branch using it silently never runs.",
  );
});

test("findByStripeSession does not reach for select('*')", () => {
  const selected = findByStripeSessionSelect();
  assert.ok(!selected.includes("*"), "explicit column lists only — see the repo conventions");
});
