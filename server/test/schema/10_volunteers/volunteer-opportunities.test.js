const { describe, it, after } = require("node:test");
const assert = require("node:assert/strict");
const {
  skip,
  db,
  tracker,
  insert,
  insertExpectingFailure,
  PG,
} = require("../_helpers");

const hoursFromNow = (h) => new Date(Date.now() + h * 3_600_000).toISOString();

describe("volunteer_opportunities", { skip }, () => {
  const { track, cleanup } = tracker();
  after(cleanup);

  const newOpportunity = (overrides = {}) => ({
    title_en: "K-pop Dance Class Assistant",
    programme: "sports",
    starts_at: hoursFromNow(24 * 7),
    ...overrides,
  });

  // ---------------------------------------------------------------- CREATE

  it("creates an internal listing with sensible defaults", async () => {
    const row = track(
      "volunteer_opportunities",
      await insert("volunteer_opportunities", newOpportunity()),
    );

    assert.equal(row.status, "open");
    assert.equal(row.source, "internal");
    assert.equal(row.capacity, 1, "§5: these listings typically carry one spot");
    assert.equal(row.spots_filled, 0);
    assert.equal(row.min_age, 16, "§5: HandsOn states a 16+ minimum");
    assert.deepEqual(row.skills, []);
    assert.equal(row.handson_url, null);
  });

  it("creates a bilingual listing", async () => {
    const row = track(
      "volunteer_opportunities",
      await insert(
        "volunteer_opportunities",
        newOpportunity({
          title_zh: "K-pop 舞蹈班助教",
          description_zh: "協助導師帶領課堂",
          location_zh: "新蒲崗",
        }),
      ),
    );

    assert.equal(row.title_zh, "K-pop 舞蹈班助教");
  });

  it("rejects a handson listing with no handson_url", async () => {
    // Provenance is not optional: a dual-registration listing with no link to the remote
    // listing cannot be reconciled or linked out to.
    const error = await insertExpectingFailure(
      "volunteer_opportunities",
      newOpportunity({ source: "handson" }),
    );

    assert.equal(error.code, PG.CHECK_VIOLATION);
    assert.match(error.message, /handson_rows_carry_provenance/);
  });

  it("accepts a handson listing that carries its url", async () => {
    const row = track(
      "volunteer_opportunities",
      await insert(
        "volunteer_opportunities",
        newOpportunity({
          source: "handson",
          handson_url: "https://volunteer.handsonhongkong.org/opportunity/a0CQ90000DFXgKwMQL",
          handson_opportunity_id: "a0CQ90000DFXgKwMQL",
          capacity: 1,
          spots_filled: 1,
          last_synced_at: new Date().toISOString(),
        }),
      ),
    );

    assert.equal(row.source, "handson");
    assert.equal(row.spots_filled, 1);
  });

  it("rejects an end before its start", async () => {
    const error = await insertExpectingFailure(
      "volunteer_opportunities",
      newOpportunity({ starts_at: hoursFromNow(48), ends_at: hoursFromNow(24) }),
    );

    assert.equal(error.code, PG.CHECK_VIOLATION);
    assert.match(error.message, /ends_after_starts/);
  });

  it("rejects values outside each closed set", async () => {
    const cases = [
      { programme: "underwater_basket_weaving" },
      { status: "pending" },
      { source: "time_auction" },
      { capacity: 0 },
      { spots_filled: -1 },
    ];

    for (const patch of cases) {
      const error = await insertExpectingFailure(
        "volunteer_opportunities",
        newOpportunity(patch),
      );
      assert.equal(
        error.code,
        PG.CHECK_VIOLATION,
        `should reject ${JSON.stringify(patch)}`,
      );
    }
  });

  it("accepts every valid programme", async () => {
    for (const programme of [
      "sports",
      "fitness",
      "nutrition",
      "family_support",
      "community_education",
    ]) {
      const row = track(
        "volunteer_opportunities",
        await insert("volunteer_opportunities", newOpportunity({ programme })),
      );
      assert.equal(row.programme, programme);
    }
  });

  // ------------------------------------------------------------------ READ

  it("lists open listings in date order", async () => {
    const later = track(
      "volunteer_opportunities",
      await insert("volunteer_opportunities", newOpportunity({ starts_at: hoursFromNow(240) })),
    );
    const sooner = track(
      "volunteer_opportunities",
      await insert("volunteer_opportunities", newOpportunity({ starts_at: hoursFromNow(120) })),
    );

    const { data, error } = await db()
      .from("volunteer_opportunities")
      .select("id, starts_at")
      .in("id", [later.id, sooner.id])
      .eq("status", "open")
      .order("starts_at", { ascending: true });

    assert.equal(error, null);
    assert.deepEqual(
      data.map((r) => r.id),
      [sooner.id, later.id],
    );
  });

  // ---------------------------------------------------------------- UPDATE

  it("refreshes spots_filled and last_synced_at, as a manual HandsOn sync would", async () => {
    // spots_filled holds HandsOn's count only. Our own bookings live in volunteer_signups, so
    // this write never has to reason about them and cannot clobber them.
    const created = track(
      "volunteer_opportunities",
      await insert(
        "volunteer_opportunities",
        newOpportunity({
          source: "handson",
          handson_url: "https://volunteer.handsonhongkong.org/opportunity/x",
          capacity: 4,
        }),
      ),
    );

    const syncedAt = new Date().toISOString();
    const { data, error } = await db()
      .from("volunteer_opportunities")
      .update({ spots_filled: 3, last_synced_at: syncedAt })
      .eq("id", created.id)
      .select()
      .single();

    assert.equal(error, null);
    assert.equal(data.spots_filled, 3);
    assert.ok(new Date(data.updated_at) >= new Date(created.updated_at));
  });

  it("allows spots_filled to exceed capacity", async () => {
    // Deliberate. If HandsOn oversells or capacity is revised down, the sync write must still
    // land - a CHECK here would freeze the number stale on a failure we do not control.
    // Overbooking is a derived status, not a write barrier.
    const created = track(
      "volunteer_opportunities",
      await insert("volunteer_opportunities", newOpportunity({ capacity: 1 })),
    );

    const { data, error } = await db()
      .from("volunteer_opportunities")
      .update({ spots_filled: 5 })
      .eq("id", created.id)
      .select()
      .single();

    assert.equal(error, null, "the schema must not block an oversell");
    assert.equal(data.spots_filled, 5);
  });

  it("cancels a listing", async () => {
    const created = track(
      "volunteer_opportunities",
      await insert("volunteer_opportunities", newOpportunity()),
    );

    const { data } = await db()
      .from("volunteer_opportunities")
      .update({ status: "cancelled" })
      .eq("id", created.id)
      .select()
      .single();

    assert.equal(data.status, "cancelled");
  });

  // ---------------------------------------------------------------- DELETE

  it("deletes a listing", async () => {
    const created = await insert("volunteer_opportunities", newOpportunity());

    const { error } = await db()
      .from("volunteer_opportunities")
      .delete()
      .eq("id", created.id);
    assert.equal(error, null);

    const { data } = await db()
      .from("volunteer_opportunities")
      .select("id")
      .eq("id", created.id)
      .maybeSingle();
    assert.equal(data, null);
  });
});
