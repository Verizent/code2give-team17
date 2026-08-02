const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  computeGarden,
  computeConversion,
} = require("../../../src/services/me/impact.service");

test("computeGarden grows with gifts, funded classes, and hours", () => {
  const empty = computeGarden({
    giftCount: 0,
    fundedClasses: 0,
    hoursTotal: 0,
    totalGiven: 0,
  });
  assert.equal(empty.level, 1);

  const mid = computeGarden({
    giftCount: 1,
    fundedClasses: 0,
    hoursTotal: 3,
    totalGiven: 500,
    sessionCount: 1,
  });
  assert.ok(mid.level >= 3);
  assert.ok(mid.level <= 5);

  const grown = computeGarden({
    giftCount: 3,
    fundedClasses: 2,
    hoursTotal: 12,
    totalGiven: 5000,
  });
  assert.ok(grown.level >= 4);
  assert.ok(grown.level <= 5);
});

test("computeConversion suggests monthly after 12 volunteer hours", () => {
  const cta = computeConversion([], 12);
  assert.equal(cta?.id, "hours_to_monthly");
  assert.equal(cta?.kind, "monthly");
});

test("computeConversion skips monthly CTA when already monthly", () => {
  const cta = computeConversion(
    [{ frequency: "monthly", amount_hkd: 500, status: "completed" }],
    20,
  );
  assert.equal(cta, null);
});

test("computeConversion offers first gift after volunteering", () => {
  const cta = computeConversion([], 3);
  assert.equal(cta?.id, "volunteer_to_give");
});
