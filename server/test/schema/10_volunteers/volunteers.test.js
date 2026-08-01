const { describe, it, after } = require("node:test");
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

describe("volunteers", { skip }, () => {
  const { track, cleanup } = tracker();
  after(cleanup);

  const newVolunteer = (overrides = {}) => ({
    email: testEmail("vol"),
    full_name: "Test Volunteer",
    access_token: testToken(),
    ...overrides,
  });

  // ---------------------------------------------------------------- CREATE

  it("creates a volunteer with only an email, a name and a token", async () => {
    const row = track("volunteers", await insert("volunteers", newVolunteer()));

    assert.ok(row.id);
    assert.equal(row.locale, "en", "locale defaults to en");
    assert.equal(row.profile_id, null, "no account yet");
    assert.equal(row.claimed_at, null);
    assert.equal(row.email_verified_at, null);
    assert.ok(row.created_at);
  });

  it("rejects a second volunteer for the same address", async () => {
    const email = testEmail("dupe");
    track("volunteers", await insert("volunteers", newVolunteer({ email })));

    const error = await insertExpectingFailure("volunteers", newVolunteer({ email }));
    assert.equal(error.code, PG.UNIQUE_VIOLATION);
  });

  it("rejects an un-normalised email", async () => {
    // The whole collation model rests on this. Bob@x.com and bob@x.com must not become two
    // volunteers, so the database refuses the write rather than trusting the caller.
    for (const email of ["  Padded@Example.test", "MiXeD@Example.test", "trailing@x.test "]) {
      const error = await insertExpectingFailure("volunteers", newVolunteer({ email }));
      assert.equal(error.code, PG.CHECK_VIOLATION, `should reject ${JSON.stringify(email)}`);
      assert.match(error.message, /email_is_normalised/);
    }
  });

  it("rejects a short access_token", async () => {
    // A guessable token is the whole attack. 31 chars must not reach the column.
    const error = await insertExpectingFailure(
      "volunteers",
      newVolunteer({ access_token: "a".repeat(31) }),
    );
    assert.equal(error.code, PG.CHECK_VIOLATION);
  });

  it("rejects a duplicate access_token", async () => {
    const access_token = testToken();
    track("volunteers", await insert("volunteers", newVolunteer({ access_token })));

    const error = await insertExpectingFailure("volunteers", newVolunteer({ access_token }));
    assert.equal(error.code, PG.UNIQUE_VIOLATION);
  });

  it("rejects an unsupported locale", async () => {
    const error = await insertExpectingFailure("volunteers", newVolunteer({ locale: "fr" }));
    assert.equal(error.code, PG.CHECK_VIOLATION);
  });

  it("rejects a half-claimed row in either direction", async () => {
    // claimed_at without profile_id, or profile_id without claimed_at, are both incoherent.
    const claimedWithoutProfile = await insertExpectingFailure(
      "volunteers",
      newVolunteer({ claimed_at: new Date().toISOString() }),
    );
    assert.equal(claimedWithoutProfile.code, PG.CHECK_VIOLATION);
    assert.match(claimedWithoutProfile.message, /claimed_rows_carry_a_profile/);
  });

  // ------------------------------------------------------------------ READ

  it("reads a volunteer back by access_token", async () => {
    // This is how the tokenised page resolves its visitor - the token IS the identity.
    const created = track("volunteers", await insert("volunteers", newVolunteer()));

    const { data, error } = await db()
      .from("volunteers")
      .select("id, email, full_name")
      .eq("access_token", created.access_token)
      .single();

    assert.equal(error, null);
    assert.equal(data.id, created.id);
  });

  it("reads a volunteer back by normalised email", async () => {
    const created = track("volunteers", await insert("volunteers", newVolunteer()));

    const { data } = await db()
      .from("volunteers")
      .select("id")
      .eq("email", created.email)
      .maybeSingle();

    assert.equal(data.id, created.id);
  });

  // ---------------------------------------------------------------- UPDATE

  it("updates a volunteer and lets the trigger own updated_at", async () => {
    const created = track("volunteers", await insert("volunteers", newVolunteer()));

    const { data, error } = await db()
      .from("volunteers")
      .update({
        full_name: "Renamed Volunteer",
        // Deliberately try to set updated_at by hand. The trigger must overrule it.
        updated_at: "2020-01-01T00:00:00.000Z",
      })
      .eq("id", created.id)
      .select()
      .single();

    assert.equal(error, null);
    assert.equal(data.full_name, "Renamed Volunteer");
    assert.ok(
      new Date(data.updated_at) > new Date("2021-01-01T00:00:00.000Z"),
      "trigger must overwrite a caller-supplied updated_at",
    );
  });

  it("cannot be renamed into another volunteer's address", async () => {
    const taken = track("volunteers", await insert("volunteers", newVolunteer()));
    const other = track("volunteers", await insert("volunteers", newVolunteer()));

    const { error } = await db()
      .from("volunteers")
      .update({ email: taken.email })
      .eq("id", other.id);

    assert.equal(error.code, PG.UNIQUE_VIOLATION);
  });

  // ---------------------------------------------------------------- DELETE

  it("deletes a volunteer", async () => {
    const created = await insert("volunteers", newVolunteer());

    const { error } = await db().from("volunteers").delete().eq("id", created.id);
    assert.equal(error, null);

    const { data } = await db()
      .from("volunteers")
      .select("id")
      .eq("id", created.id)
      .maybeSingle();

    assert.equal(data, null, "row is gone");
  });
});
