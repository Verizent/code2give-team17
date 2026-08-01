const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");
const {
  skip,
  db,
  uid,
  tracker,
  insert,
  insertExpectingFailure,
  PG,
} = require("../_helpers");

describe("badges", { skip }, () => {
  const { track, cleanup } = tracker();
  after(cleanup);

  // (criteria_type, threshold) is unique, so thresholds must not collide with a seeded badge OR
  // with a CONCURRENT RUN of this same suite in another shell. The base is drawn from a ~2e9
  // space rather than a narrow window, which makes an overlap between two simultaneous runs
  // vanishingly unlikely. `threshold` is int4, so the ceiling below stays clear of 2147483647.
  let nextThreshold = 1_000_000 + Math.floor(Math.random() * 2_000_000_000);
  const uniqueThreshold = () => (nextThreshold += 1);

  const newBadge = (overrides = {}) => ({
    code: `test-badge-${uid()}`,
    name_en: "Test Badge",
    criteria_type: "signup_count",
    threshold: uniqueThreshold(),
    ...overrides,
  });

  // ---------------------------------------------------------------- CREATE

  it("creates a badge definition", async () => {
    const row = track("badges", await insert("badges", newBadge()));

    assert.ok(row.id);
    assert.equal(row.sort_order, 0);
    assert.equal(row.name_zh, null);
  });

  it("accepts every criteria_type", async () => {
    for (const criteria_type of ["signup_count", "hours", "programme_variety", "streak"]) {
      const row = track("badges", await insert("badges", newBadge({ criteria_type })));
      assert.equal(row.criteria_type, criteria_type);
    }
  });

  it("rejects an unknown criteria_type", async () => {
    const error = await insertExpectingFailure(
      "badges",
      newBadge({ criteria_type: "most_enthusiastic" }),
    );
    assert.equal(error.code, PG.CHECK_VIOLATION);
  });

  it("rejects a threshold of zero or below", async () => {
    for (const threshold of [0, -5]) {
      const error = await insertExpectingFailure("badges", newBadge({ threshold }));
      assert.equal(error.code, PG.CHECK_VIOLATION);
    }
  });

  it("rejects a duplicate code", async () => {
    // code is the stable seed key - seeding must be able to rely on it.
    const code = `test-badge-${uid()}`;
    track("badges", await insert("badges", newBadge({ code })));

    const error = await insertExpectingFailure("badges", newBadge({ code }));
    assert.equal(error.code, PG.UNIQUE_VIOLATION);
  });

  it("rejects a duplicate criteria_type + threshold pair", async () => {
    // Two badges for "10 signups" would both fire and read as a bug to the volunteer.
    const threshold = uniqueThreshold();
    track("badges", await insert("badges", newBadge({ criteria_type: "hours", threshold })));

    const error = await insertExpectingFailure(
      "badges",
      newBadge({ criteria_type: "hours", threshold }),
    );
    assert.equal(error.code, PG.UNIQUE_VIOLATION);
    assert.match(error.message, /one_badge_per_criteria_threshold/);
  });

  // ------------------------------------------------------------------ READ

  it("finds a badge by its stable code", async () => {
    const created = track("badges", await insert("badges", newBadge()));

    const { data, error } = await db()
      .from("badges")
      .select("id, name_en")
      .eq("code", created.code)
      .single();

    assert.equal(error, null);
    assert.equal(data.id, created.id);
  });

  // ---------------------------------------------------------------- UPDATE

  it("renames a badge bilingually without changing its code", async () => {
    const created = track("badges", await insert("badges", newBadge()));

    const { data, error } = await db()
      .from("badges")
      .update({
        name_en: "First Session",
        name_zh: "首次服務",
        description_en: "Recognition for a first completed session.",
      })
      .eq("id", created.id)
      .select()
      .single();

    assert.equal(error, null);
    assert.equal(data.name_zh, "首次服務");
    assert.equal(data.code, created.code, "the seed key is stable across renames");
  });

  // ---------------------------------------------------------------- DELETE

  it("deletes a badge", async () => {
    const created = await insert("badges", newBadge());

    await db().from("badges").delete().eq("id", created.id);

    const { data } = await db()
      .from("badges")
      .select("id")
      .eq("id", created.id)
      .maybeSingle();
    assert.equal(data, null);
  });
});
