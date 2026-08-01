const { test } = require("node:test");
const assert = require("node:assert/strict");

const { creditFor, COST_PER_EVENT_HKD, MAX_EVENTS_SHOWN } = require("../../src/lib/donation-credit");

test("credits ceil(amount / cost), floored at 1", () => {
  // The 510 case is the whole point of this table: it is what makes the formula `ceil`.
  // A refactor to Math.floor or integer division silently turns it into 5, and nothing
  // else in the suite would notice.
  const cases = [
    [1, 1],
    [30, 1],
    [99, 1],
    [100, 1],
    [101, 2],
    [200, 2],
    [250, 3],
    [510, 6],
    [1000, 10],
    [10000, 100],
  ];

  for (const [amountHkd, expected] of cases) {
    assert.equal(creditFor(amountHkd), expected, `HKD ${amountHkd} should credit ${expected}`);
  }
});

test("credits are uncapped — only the rendered list is limited", () => {
  const credited = creditFor(10000);
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
  // donor was already told.
  assert.equal(creditFor(510, 50), 11);
  assert.equal(creditFor(510, COST_PER_EVENT_HKD), 6);
});
