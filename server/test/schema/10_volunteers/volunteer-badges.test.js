const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const {
  skip,
  db,
  uid,
  testEmail,
  testToken,
  tracker,
  insert,
  insertExpectingFailure,
  PG,
} = require("../_helpers");

describe("volunteer_badges", { skip }, () => {
  const { track, cleanup } = tracker();
  after(cleanup);

  let badge;
  // See badges.test.js: drawn from a wide space so a concurrent run of this suite in another
  // shell cannot collide on the unique (criteria_type, threshold) pair.
  let nextThreshold = 1_000_000 + Math.floor(Math.random() * 2_000_000_000);

  const newBadgeRow = () => ({
    code: `test-award-${uid()}`,
    name_en: "Award Fixture",
    criteria_type: "signup_count",
    threshold: (nextThreshold += 1),
  });

  before(async () => {
    badge = track("badges", await insert("badges", newBadgeRow()));
  });

  const freshVolunteer = async (label) =>
    track(
      "volunteers",
      await insert("volunteers", {
        email: testEmail(label),
        full_name: "Badge Earner",
        access_token: testToken(),
      }),
    );

  // ---------------------------------------------------------------- CREATE

  it("awards a badge to a volunteer with no account", async () => {
    const person = await freshVolunteer("award");
    const row = track(
      "volunteer_badges",
      await insert("volunteer_badges", {
        volunteer_id: person.id,
        badge_id: badge.id,
      }),
    );

    assert.ok(row.awarded_at, "awarded_at defaults to now()");
  });

  it("refuses to award the same badge twice", async () => {
    // This is what makes badge evaluation safely RE-RUNNABLE. Marking attendance twice must not
    // award twice, so the engine can attempt the insert and swallow the duplicate rather than
    // reading-then-writing and racing itself.
    const person = await freshVolunteer("award-twice");

    track(
      "volunteer_badges",
      await insert("volunteer_badges", { volunteer_id: person.id, badge_id: badge.id }),
    );

    const error = await insertExpectingFailure("volunteer_badges", {
      volunteer_id: person.id,
      badge_id: badge.id,
    });

    assert.equal(error.code, PG.UNIQUE_VIOLATION);
    assert.match(error.message, /one_award_per_badge_per_volunteer/);
  });

  it("lets two volunteers hold the same badge", async () => {
    const a = await freshVolunteer("award-a");
    const b = await freshVolunteer("award-b");

    track(
      "volunteer_badges",
      await insert("volunteer_badges", { volunteer_id: a.id, badge_id: badge.id }),
    );
    track(
      "volunteer_badges",
      await insert("volunteer_badges", { volunteer_id: b.id, badge_id: badge.id }),
    );

    const { count } = await db()
      .from("volunteer_badges")
      .select("id", { count: "exact", head: true })
      .eq("badge_id", badge.id)
      .in("volunteer_id", [a.id, b.id]);

    assert.equal(count, 2);
  });

  it("rejects an award for a volunteer or badge that does not exist", async () => {
    const ghost = "00000000-0000-0000-0000-0000000000ff";
    const person = await freshVolunteer("award-fk");

    const badVolunteer = await insertExpectingFailure("volunteer_badges", {
      volunteer_id: ghost,
      badge_id: badge.id,
    });
    assert.equal(badVolunteer.code, PG.FOREIGN_KEY_VIOLATION);

    const badBadge = await insertExpectingFailure("volunteer_badges", {
      volunteer_id: person.id,
      badge_id: ghost,
    });
    assert.equal(badBadge.code, PG.FOREIGN_KEY_VIOLATION);
  });

  // ------------------------------------------------------------------ READ

  it("reads a volunteer's badges with their definitions", async () => {
    const person = await freshVolunteer("award-read");
    track(
      "volunteer_badges",
      await insert("volunteer_badges", { volunteer_id: person.id, badge_id: badge.id }),
    );

    const { data, error } = await db()
      .from("volunteer_badges")
      .select("awarded_at, badges(code, name_en, criteria_type)")
      .eq("volunteer_id", person.id);

    assert.equal(error, null);
    assert.equal(data.length, 1);
    assert.equal(data[0].badges.code, badge.code);
  });

  // ---------------------------------------------------------------- DELETE

  it("revokes an award", async () => {
    const person = await freshVolunteer("award-revoke");
    const award = await insert("volunteer_badges", {
      volunteer_id: person.id,
      badge_id: badge.id,
    });

    await db().from("volunteer_badges").delete().eq("id", award.id);

    const { data } = await db()
      .from("volunteer_badges")
      .select("id")
      .eq("id", award.id)
      .maybeSingle();
    assert.equal(data, null);
  });

  it("cascades from both sides", async () => {
    const person = await insert("volunteers", {
      email: testEmail("award-cascade"),
      full_name: "Cascade",
      access_token: testToken(),
    });
    const throwaway = await insert("badges", newBadgeRow());

    const fromVolunteer = await insert("volunteer_badges", {
      volunteer_id: person.id,
      badge_id: badge.id,
    });
    const fromBadge = await insert("volunteer_badges", {
      volunteer_id: person.id,
      badge_id: throwaway.id,
    });

    await db().from("badges").delete().eq("id", throwaway.id);
    const { data: badgeGone } = await db()
      .from("volunteer_badges")
      .select("id")
      .eq("id", fromBadge.id)
      .maybeSingle();
    assert.equal(badgeGone, null, "deleting a definition removes its awards");

    await db().from("volunteers").delete().eq("id", person.id);
    const { data: volunteerGone } = await db()
      .from("volunteer_badges")
      .select("id")
      .eq("id", fromVolunteer.id)
      .maybeSingle();
    assert.equal(volunteerGone, null, "deleting a volunteer removes their awards");
  });
});
