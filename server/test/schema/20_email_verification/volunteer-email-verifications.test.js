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

const minutesFromNow = (m) => new Date(Date.now() + m * 60_000).toISOString();

describe("volunteer_email_verifications", { skip }, () => {
  const { track, cleanup } = tracker();
  after(cleanup);

  const newVerification = (overrides = {}) => ({
    email: testEmail("verify"),
    code_hash: "a".repeat(64), // stands in for an HMAC; the code itself is never stored
    expires_at: minutesFromNow(15),
    ...overrides,
  });

  // ---------------------------------------------------------------- CREATE

  it("creates a pending verification", async () => {
    const row = track(
      "volunteer_email_verifications",
      await insert("volunteer_email_verifications", newVerification()),
    );

    assert.equal(row.attempts, 0);
    assert.equal(row.consumed_at, null);
    assert.equal(row.verification_token, null, "no token until it is confirmed");
    assert.equal(
      Object.hasOwn(row, "code"),
      false,
      "the code itself must never be a column",
    );
  });

  it("rejects an un-normalised email", async () => {
    // Lookups are by address, so a mismatch here means a verification silently cannot be found.
    const error = await insertExpectingFailure(
      "volunteer_email_verifications",
      newVerification({ email: "MiXeD@Example.test" }),
    );
    assert.equal(error.code, PG.CHECK_VIOLATION);
    assert.match(error.message, /email_is_normalised/);
  });

  it("refuses a token on a row that was never consumed", async () => {
    // A token is proof of a completed confirmation. It cannot exist without one.
    const error = await insertExpectingFailure(
      "volunteer_email_verifications",
      newVerification({ verification_token: testToken() }),
    );
    assert.equal(error.code, PG.CHECK_VIOLATION);
    assert.match(error.message, /token_only_on_consumed_rows/);
  });

  it("refuses a short verification token", async () => {
    const error = await insertExpectingFailure(
      "volunteer_email_verifications",
      newVerification({
        consumed_at: new Date().toISOString(),
        verification_token: "short",
      }),
    );
    assert.equal(error.code, PG.CHECK_VIOLATION);
  });

  it("refuses a duplicate verification token", async () => {
    const verification_token = testToken();
    const consumed_at = new Date().toISOString();

    track(
      "volunteer_email_verifications",
      await insert(
        "volunteer_email_verifications",
        newVerification({ consumed_at, verification_token }),
      ),
    );

    const error = await insertExpectingFailure(
      "volunteer_email_verifications",
      newVerification({ consumed_at, verification_token }),
    );
    assert.equal(error.code, PG.UNIQUE_VIOLATION);
  });

  // ------------------------------------------------------------------ READ

  it("finds the most recent verification for an address", async () => {
    const email = testEmail("verify-latest");

    const first = track(
      "volunteer_email_verifications",
      await insert("volunteer_email_verifications", newVerification({ email })),
    );
    await new Promise((r) => setTimeout(r, 10));
    const second = track(
      "volunteer_email_verifications",
      await insert("volunteer_email_verifications", newVerification({ email })),
    );

    const { data, error } = await db()
      .from("volunteer_email_verifications")
      .select("id")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    assert.equal(error, null);
    assert.equal(data.id, second.id);
    assert.notEqual(data.id, first.id);
  });

  // ---------------------------------------------------------------- UPDATE

  it("counts a failed attempt", async () => {
    const created = track(
      "volunteer_email_verifications",
      await insert("volunteer_email_verifications", newVerification()),
    );

    const { data, error } = await db()
      .from("volunteer_email_verifications")
      .update({ attempts: created.attempts + 1 })
      .eq("id", created.id)
      .select()
      .single();

    assert.equal(error, null);
    assert.equal(data.attempts, 1);
  });

  it("consumes a verification exactly once under a concurrency guard", async () => {
    // The service consumes with `.is("consumed_at", null)`. Two concurrent confirmations must
    // not both succeed - the second matches no row and comes back empty.
    const created = track(
      "volunteer_email_verifications",
      await insert("volunteer_email_verifications", newVerification()),
    );

    const consume = () =>
      db()
        .from("volunteer_email_verifications")
        .update({
          consumed_at: new Date().toISOString(),
          verification_token: testToken(),
          verification_token_expires_at: minutesFromNow(30),
        })
        .eq("id", created.id)
        .is("consumed_at", null)
        .select()
        .maybeSingle();

    const first = await consume();
    assert.equal(first.error, null);
    assert.ok(first.data, "the first confirmation wins");

    const second = await consume();
    assert.equal(second.error, null);
    assert.equal(second.data, null, "the second matches no row");
  });

  // ---------------------------------------------------------------- DELETE

  it("deletes a verification, which is always safe", async () => {
    // These rows are disposable: expired and consumed ones carry no value.
    const created = await insert("volunteer_email_verifications", newVerification());

    await db().from("volunteer_email_verifications").delete().eq("id", created.id);

    const { data } = await db()
      .from("volunteer_email_verifications")
      .select("id")
      .eq("id", created.id)
      .maybeSingle();
    assert.equal(data, null);
  });

  it("does not cascade from volunteers - it keys on an address, not a row", async () => {
    const email = testEmail("verify-orphan");
    const person = await insert("volunteers", {
      email,
      full_name: "Verifier",
      access_token: testToken(),
    });
    const verification = track(
      "volunteer_email_verifications",
      await insert("volunteer_email_verifications", newVerification({ email })),
    );

    await db().from("volunteers").delete().eq("id", person.id);

    const { data } = await db()
      .from("volunteer_email_verifications")
      .select("id")
      .eq("id", verification.id)
      .maybeSingle();

    assert.ok(
      data,
      "verifications survive the volunteer: they prove an address, not a relationship",
    );
  });
});
