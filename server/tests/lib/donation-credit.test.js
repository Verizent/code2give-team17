const { test } = require("node:test");
const assert = require("node:assert/strict");

const { creditFor, COST_PER_EVENT_HKD, MAX_EVENTS_SHOWN } = require("../../src/lib/donation-credit");

test("credits ceil(amount / cost), floored at 1", () => {
  // With COST_PER_EVENT_HKD = 500. The 501 case is the ceil-vs-floor tripwire —
  // Math.floor would give 1 and nothing else in the suite would notice.
  const cases = [
    [1, 1],
    [30, 1],
    [499, 1],
    [500, 1],
    [501, 2],
    [1000, 2],
    [1001, 3],
    [2500, 5],
    [10000, 20],
    [50000, 100],
  ];

  for (const [amountHkd, expected] of cases) {
    assert.equal(creditFor(amountHkd), expected, `HKD ${amountHkd} should credit ${expected}`);
  }
});

test("credits are uncapped — only the rendered list is limited", () => {
  const credited = creditFor(50000);
  assert.equal(credited, 100);
  assert.ok(credited > MAX_EVENTS_SHOWN, "the number must exceed the display cap, not be clamped to it");
});

test("a non-positive or non-finite amount still credits at least 1", () => {
  for (const amount of [0, -50, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(creditFor(amount), 1);
  }
});

test("an explicit cost override replays a historical snapshot", () => {
  // cost_per_event_at_donation exists so revising the constant never rewrites what a
  // donor was already told. A donation made under the old 100 divisor keeps returning
  // its original credit count when replayed with the snapshot.
  assert.equal(creditFor(510, 100), 6, "historical (100 divisor) still resolves to 6");
  assert.equal(creditFor(2500, COST_PER_EVENT_HKD), 5, "current 500 divisor");
});
