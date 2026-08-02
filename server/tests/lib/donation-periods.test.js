const { test } = require("node:test");
const assert = require("node:assert/strict");

const {
  lastDayOfMonth,
  editionForDonation,
  selectionStart,
  editionLabel,
} = require("../../src/lib/donation-periods");

/** @param {Date} date */
const iso = (date) => date.toISOString().slice(0, 10);

test("lastDayOfMonth handles short months — 'the 31st' is not a date", () => {
  assert.equal(iso(lastDayOfMonth(new Date("2026-08-03T00:00:00Z"))), "2026-08-31");
  assert.equal(iso(lastDayOfMonth(new Date("2026-09-03T00:00:00Z"))), "2026-09-30");
  assert.equal(iso(lastDayOfMonth(new Date("2026-02-03T00:00:00Z"))), "2026-02-28");
  assert.equal(iso(lastDayOfMonth(new Date("2028-02-03T00:00:00Z"))), "2028-02-29", "leap year");
});

test("gifts on the 1st–15th send at EOM, covering [15th, EOM)", () => {
  for (const day of ["01", "10", "14", "15"]) {
    const edition = editionForDonation(`2026-08-${day}T12:00:00Z`);
    assert.equal(iso(edition.sendDate), "2026-08-31");
    assert.equal(iso(edition.windowStart), "2026-08-15");
    assert.equal(iso(edition.windowEnd), "2026-08-31");
  }
});

test("gifts on the 16th–EOM send on the 15th next month, covering [EOM, 15th)", () => {
  for (const day of ["16", "20", "31"]) {
    const edition = editionForDonation(`2026-08-${day}T12:00:00Z`);
    assert.equal(iso(edition.sendDate), "2026-09-15");
    assert.equal(iso(edition.windowStart), "2026-08-31");
    assert.equal(iso(edition.windowEnd), "2026-09-15");
  }
});

test("consecutive editions tile — contiguous, never overlapping, across short months", () => {
  // windowEnd is exclusive and equals sendDate, so an edition never reports on an event
  // happening the day it sends. The next edition picks that day up.
  const anchors = [
    "2026-08-05", "2026-08-20", // Aug: 31 days
    "2026-09-05", "2026-09-20", // Sep: 30 days
    "2026-02-05", "2026-02-20", // Feb: 28 days
  ];

  for (const anchor of anchors) {
    const edition = editionForDonation(`${anchor}T00:00:00Z`);
    assert.ok(edition.windowStart < edition.windowEnd, `${anchor}: window must be non-empty`);
    assert.equal(
      iso(edition.windowEnd),
      iso(edition.sendDate),
      `${anchor}: the send day itself is never covered`,
    );
  }

  // The Aug 31 edition ends where the Sep 15 edition begins — no gap, no double-count.
  const first = editionForDonation("2026-08-05T00:00:00Z");
  const second = editionForDonation("2026-08-20T00:00:00Z");
  assert.equal(iso(first.windowEnd), iso(second.windowStart));
});

test("an event may never predate its donation — the 14th/13th case", () => {
  // The regression test for a "just send at the next boundary" refactor, which would put a
  // gift made on the 14th into the 15 Aug edition covering 31 Jul – 14 Aug, and thank the
  // donor for an event that ran the day before they gave.
  const donatedAt = "2026-08-14T09:00:00Z";
  const start = selectionStart(donatedAt);

  assert.ok(
    start > new Date("2026-08-13T23:59:59Z"),
    "selection must start after an event dated the 13th",
  );
  assert.equal(iso(start), "2026-08-16", "the +2 day floor wins over a window opening on the 15th");
});

test("selection floor takes the later of window start and donation + 2 days", () => {
  // Early in the half-month the window binds; in the last two days the floor binds.
  const cases = [
    ["2026-08-01", "2026-08-15"], // window wins
    ["2026-08-10", "2026-08-15"], // window wins
    ["2026-08-14", "2026-08-16"], // floor wins
    ["2026-08-15", "2026-08-17"], // floor wins
  ];

  for (const [donatedOn, expected] of cases) {
    assert.equal(
      iso(selectionStart(`${donatedOn}T00:00:00Z`)),
      expected,
      `gift on ${donatedOn}`,
    );
  }
});

test("selectionStart never resolves before the gift, for every day of a month", () => {
  // Covers the helper, NOT the production invariant. `selectionStart` is currently unused —
  // allocation.service.js enforces "no event predates the gift" via its rolling +7d floor,
  // and the test for that lives in tests/services/donations/allocation.service.test.js.
  // Retitled so a green run here is not mistaken for the live guarantee being covered.
  for (let day = 1; day <= 31; day += 1) {
    const donatedAt = new Date(Date.UTC(2026, 7, day));
    assert.ok(
      selectionStart(donatedAt) > donatedAt,
      `gift on 2026-08-${String(day).padStart(2, "0")} must not credit an earlier event`,
    );
  }
});

test("editionLabel names the covered range, not the send day", () => {
  assert.equal(editionLabel(editionForDonation("2026-08-05T00:00:00Z")), "15 Aug – 30 Aug");
  assert.equal(editionLabel(editionForDonation("2026-08-20T00:00:00Z")), "31 Aug – 14 Sep");
});
