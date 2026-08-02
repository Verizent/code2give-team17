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

describe("volunteer_signups", { skip }, () => {
  const { track, cleanup } = tracker();
  after(cleanup);

  let volunteer;
  let opportunity;

  before(async () => {
    volunteer = track(
      "volunteers",
      await insert("volunteers", {
        email: testEmail("signup"),
        full_name: "Signup Fixture",
        access_token: testToken(),
      }),
    );
    opportunity = track(
      "volunteer_opportunities",
      await insert("volunteer_opportunities", {
        title_en: "Mix Media Art Class Assistant",
        programme: "family_support",
        starts_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        capacity: 10,
      }),
    );
  });

  const freshVolunteer = async (label = "extra") =>
    track(
      "volunteers",
      await insert("volunteers", {
        email: testEmail(label),
        full_name: "Extra Volunteer",
        access_token: testToken(),
      }),
    );

  // ---------------------------------------------------------------- CREATE

  it("creates a signup with NO profile_id at all", async () => {
    // The whole point of the identity model: a volunteer with no account can book.
    const row = track(
      "volunteer_signups",
      await insert("volunteer_signups", {
        opportunity_id: opportunity.id,
        volunteer_id: volunteer.id,
      }),
    );

    assert.equal(row.profile_id, null);
    assert.equal(row.status, "applied");
    assert.equal(Number(row.hours_logged), 0);
    assert.equal(row.attended_at, null);
    assert.equal(row.discovery_source, null, "§23: captured after the fact, never as a gate");
  });

  it("rejects a second signup by the same volunteer for the same listing", async () => {
    // This constraint IS the duplicate guard - the service should let it fire and return 409
    // rather than checking first and racing itself.
    const other = await freshVolunteer("dupe");

    track(
      "volunteer_signups",
      await insert("volunteer_signups", {
        opportunity_id: opportunity.id,
        volunteer_id: other.id,
      }),
    );

    const error = await insertExpectingFailure("volunteer_signups", {
      opportunity_id: opportunity.id,
      volunteer_id: other.id,
    });

    assert.equal(error.code, PG.UNIQUE_VIOLATION);
    assert.match(error.message, /one_signup_per_volunteer_per_opportunity/);
  });

  it("rejects a signup for a volunteer or listing that does not exist", async () => {
    const ghost = "00000000-0000-0000-0000-0000000000ff";

    const badVolunteer = await insertExpectingFailure("volunteer_signups", {
      opportunity_id: opportunity.id,
      volunteer_id: ghost,
    });
    assert.equal(badVolunteer.code, PG.FOREIGN_KEY_VIOLATION);

    const badOpportunity = await insertExpectingFailure("volunteer_signups", {
      opportunity_id: ghost,
      volunteer_id: volunteer.id,
    });
    assert.equal(badOpportunity.code, PG.FOREIGN_KEY_VIOLATION);
  });

  it("rejects values outside each closed set", async () => {
    const other = await freshVolunteer("enum");
    const base = { opportunity_id: opportunity.id, volunteer_id: other.id };

    for (const patch of [
      { status: "maybe" },
      { discovery_source: "billboard" },
      { experience_rating: 0 },
      { experience_rating: 6 },
      { hours_logged: -1 },
    ]) {
      const error = await insertExpectingFailure("volunteer_signups", { ...base, ...patch });
      assert.equal(
        error.code,
        PG.CHECK_VIOLATION,
        `should reject ${JSON.stringify(patch)}`,
      );
    }
  });

  it("accepts every §23 discovery_source", async () => {
    for (const discovery_source of [
      "handson",
      "time_auction",
      "love21_site",
      "social",
      "friend_colleague",
      "employer_csr",
      "school",
      "search",
      "other",
    ]) {
      const person = await freshVolunteer(`src-${discovery_source}`);
      const row = track(
        "volunteer_signups",
        await insert("volunteer_signups", {
          opportunity_id: opportunity.id,
          volunteer_id: person.id,
          discovery_source,
        }),
      );
      assert.equal(row.discovery_source, discovery_source);
    }
  });

  // ------------------------------------------------------------------ READ

  it("finds a volunteer's signups by volunteer_id", async () => {
    const person = await freshVolunteer("read");
    const signup = track(
      "volunteer_signups",
      await insert("volunteer_signups", {
        opportunity_id: opportunity.id,
        volunteer_id: person.id,
      }),
    );

    const { data, error } = await db()
      .from("volunteer_signups")
      .select("id, status, volunteer_opportunities(title_en)")
      .eq("volunteer_id", person.id);

    assert.equal(error, null);
    assert.equal(data.length, 1);
    assert.equal(data[0].id, signup.id);
    assert.equal(data[0].volunteer_opportunities.title_en, "Mix Media Art Class Assistant");
  });

  it("counts confirmed bookings for a listing, which is the seats-left input", async () => {
    // seats_left = capacity − spots_filled_handson (HandsOn) − confirmed signups (ours).
    // This asserts the third number, and that 'applied' is not yet counted.
    const listing = track(
      "volunteer_opportunities",
      await insert("volunteer_opportunities", {
        title_en: "Counting fixture",
        programme: "fitness",
        starts_at: new Date(Date.now() + 5 * 86_400_000).toISOString(),
        capacity: 5,
      }),
    );

    for (const status of ["confirmed", "confirmed", "applied", "cancelled"]) {
      const person = await freshVolunteer(`count-${status}-${Math.random()}`);
      track(
        "volunteer_signups",
        await insert("volunteer_signups", {
          opportunity_id: listing.id,
          volunteer_id: person.id,
          status,
        }),
      );
    }

    const { count, error } = await db()
      .from("volunteer_signups")
      .select("id", { count: "exact", head: true })
      .eq("opportunity_id", listing.id)
      .eq("status", "confirmed");

    assert.equal(error, null);
    assert.equal(count, 2);
  });

  // ---------------------------------------------------------------- UPDATE

  it("marks attendance and logs hours", async () => {
    const person = await freshVolunteer("attend");
    const signup = track(
      "volunteer_signups",
      await insert("volunteer_signups", {
        opportunity_id: opportunity.id,
        volunteer_id: person.id,
        status: "confirmed",
      }),
    );

    const { data, error } = await db()
      .from("volunteer_signups")
      .update({
        status: "attended",
        hours_logged: 2.5,
        attended_at: new Date().toISOString(),
      })
      .eq("id", signup.id)
      .select()
      .single();

    assert.equal(error, null);
    assert.equal(data.status, "attended");
    assert.equal(Number(data.hours_logged), 2.5);
  });

  it("records post-attendance feedback, all fields optional", async () => {
    const person = await freshVolunteer("feedback");
    const signup = track(
      "volunteer_signups",
      await insert("volunteer_signups", {
        opportunity_id: opportunity.id,
        volunteer_id: person.id,
        status: "attended",
      }),
    );

    const { data, error } = await db()
      .from("volunteer_signups")
      .update({
        experience_rating: 5,
        would_return: true,
        improvement_note: "More time for the warm-up.",
        feedback_submitted_at: new Date().toISOString(),
      })
      .eq("id", signup.id)
      .select()
      .single();

    assert.equal(error, null);
    assert.equal(data.experience_rating, 5);
    assert.equal(data.would_return, true);
  });

  // ---------------------------------------------------------------- DELETE

  it("deletes a signup without touching the volunteer", async () => {
    const person = await freshVolunteer("del");
    const signup = await insert("volunteer_signups", {
      opportunity_id: opportunity.id,
      volunteer_id: person.id,
    });

    await db().from("volunteer_signups").delete().eq("id", signup.id);

    const { data: gone } = await db()
      .from("volunteer_signups")
      .select("id")
      .eq("id", signup.id)
      .maybeSingle();
    assert.equal(gone, null);

    const { data: stillThere } = await db()
      .from("volunteers")
      .select("id")
      .eq("id", person.id)
      .maybeSingle();
    assert.ok(stillThere, "cancelling a booking must not delete the person");
  });

  it("cascades when the volunteer is deleted", async () => {
    const person = await insert("volunteers", {
      email: testEmail("cascade"),
      full_name: "Cascade Volunteer",
      access_token: testToken(),
    });
    const signup = await insert("volunteer_signups", {
      opportunity_id: opportunity.id,
      volunteer_id: person.id,
    });

    await db().from("volunteers").delete().eq("id", person.id);

    const { data } = await db()
      .from("volunteer_signups")
      .select("id")
      .eq("id", signup.id)
      .maybeSingle();

    assert.equal(data, null, "signups follow their volunteer");
  });

  it("cascades when the opportunity is deleted", async () => {
    const person = await freshVolunteer("cascade-opp");
    const listing = await insert("volunteer_opportunities", {
      title_en: "Doomed listing",
      programme: "nutrition",
      starts_at: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    });
    const signup = await insert("volunteer_signups", {
      opportunity_id: listing.id,
      volunteer_id: person.id,
    });

    await db().from("volunteer_opportunities").delete().eq("id", listing.id);

    const { data } = await db()
      .from("volunteer_signups")
      .select("id")
      .eq("id", signup.id)
      .maybeSingle();

    assert.equal(data, null);
  });
});
