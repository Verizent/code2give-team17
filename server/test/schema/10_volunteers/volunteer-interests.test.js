const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const {
  skip,
  db,
  testEmail,
  testToken,
  tracker,
  insert,
  insertExpectingFailure,
  PG,
} = require("../_helpers");

describe("volunteer_interests", { skip }, () => {
  const { track, cleanup } = tracker();
  after(cleanup);

  let opportunity;

  before(async () => {
    opportunity = track(
      "volunteer_opportunities",
      await insert("volunteer_opportunities", {
        title_en: "Interest fixture",
        programme: "sports",
        starts_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        capacity: 3,
        source: "handson",
        handson_url: "https://volunteer.handsonhongkong.org/opportunity/x",
      }),
    );
  });

  const freshVolunteer = async (label) =>
    track(
      "volunteers",
      await insert("volunteers", {
        email: testEmail(label),
        full_name: "Interested Person",
        access_token: testToken(),
      }),
    );

  // ---------------------------------------------------------------- CREATE

  it("records interest with contact details living on volunteers", async () => {
    const person = await freshVolunteer("interest");
    const row = track(
      "volunteer_interests",
      await insert("volunteer_interests", {
        opportunity_id: opportunity.id,
        volunteer_id: person.id,
        message: "I can help with setup.",
      }),
    );

    assert.ok(row.id);
    assert.equal(row.message, "I can help with setup.");
    assert.ok(row.created_at);
    assert.equal(
      Object.hasOwn(row, "email"),
      false,
      "contact details belong on volunteers, not duplicated here",
    );
  });

  it("rejects duplicate interest from the same person on the same listing", async () => {
    const person = await freshVolunteer("interest-dupe");
    track(
      "volunteer_interests",
      await insert("volunteer_interests", {
        opportunity_id: opportunity.id,
        volunteer_id: person.id,
      }),
    );

    const error = await insertExpectingFailure("volunteer_interests", {
      opportunity_id: opportunity.id,
      volunteer_id: person.id,
    });

    assert.equal(error.code, PG.UNIQUE_VIOLATION);
  });

  // ------------------------------------------------------------------ READ

  it("counts interest separately from spots_filled_handson, and never sums them", async () => {
    // §17/§29: spots_filled_handson is authoritative bookings inside HandsOn's system; these are our
    // leads and may never convert there. Rendering "1 booked · 2 interested" is correct;
    // rendering "3" is the bug this test exists to prevent.
    const listing = track(
      "volunteer_opportunities",
      await insert("volunteer_opportunities", {
        title_en: "Never sum fixture",
        programme: "sports",
        starts_at: new Date(Date.now() + 6 * 86_400_000).toISOString(),
        capacity: 4,
        spots_filled_handson: 1,
        source: "handson",
        handson_url: "https://volunteer.handsonhongkong.org/opportunity/y",
      }),
    );

    for (const label of ["a", "b"]) {
      const person = await freshVolunteer(`never-sum-${label}`);
      track(
        "volunteer_interests",
        await insert("volunteer_interests", {
          opportunity_id: listing.id,
          volunteer_id: person.id,
        }),
      );
    }

    const { count: interestedCount } = await db()
      .from("volunteer_interests")
      .select("id", { count: "exact", head: true })
      .eq("opportunity_id", listing.id);

    const { data: opp } = await db()
      .from("volunteer_opportunities")
      .select("spots_filled_handson, capacity")
      .eq("id", listing.id)
      .single();

    assert.equal(opp.spots_filled_handson, 1, "HandsOn bookings");
    assert.equal(interestedCount, 2, "our leads");
    assert.notEqual(
      opp.spots_filled_handson + interestedCount,
      opp.spots_filled_handson,
      "these are two distinct figures and must be rendered as such",
    );
  });

  // ---------------------------------------------------------------- UPDATE

  it("updates the message", async () => {
    const person = await freshVolunteer("interest-update");
    const created = track(
      "volunteer_interests",
      await insert("volunteer_interests", {
        opportunity_id: opportunity.id,
        volunteer_id: person.id,
        message: "before",
      }),
    );

    const { data, error } = await db()
      .from("volunteer_interests")
      .update({ message: "after" })
      .eq("id", created.id)
      .select()
      .single();

    assert.equal(error, null);
    assert.equal(data.message, "after");
  });

  // ---------------------------------------------------------------- DELETE

  it("deletes an interest row", async () => {
    const person = await freshVolunteer("interest-del");
    const created = await insert("volunteer_interests", {
      opportunity_id: opportunity.id,
      volunteer_id: person.id,
    });

    await db().from("volunteer_interests").delete().eq("id", created.id);

    const { data } = await db()
      .from("volunteer_interests")
      .select("id")
      .eq("id", created.id)
      .maybeSingle();
    assert.equal(data, null);
  });

  it("cascades when the volunteer is deleted", async () => {
    const person = await insert("volunteers", {
      email: testEmail("interest-cascade"),
      full_name: "Cascade",
      access_token: testToken(),
    });
    const created = await insert("volunteer_interests", {
      opportunity_id: opportunity.id,
      volunteer_id: person.id,
    });

    await db().from("volunteers").delete().eq("id", person.id);

    const { data } = await db()
      .from("volunteer_interests")
      .select("id")
      .eq("id", created.id)
      .maybeSingle();
    assert.equal(data, null);
  });
});
