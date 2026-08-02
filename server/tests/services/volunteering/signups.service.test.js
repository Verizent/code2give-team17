const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const volunteersRepo = require("../../../src/data/volunteers.repo");
const signupsRepo = require("../../../src/data/volunteer-signups.repo");
const opportunitiesService = require("../../../src/services/volunteering/opportunities.service");
const emailVerification = require("../../../src/services/volunteering/email-verification.service");
const emailLib = require("../../../src/lib/email");
const signupsService = require("../../../src/services/volunteering/signups.service");

const OPPORTUNITY_ID = "a1111111-1111-4111-8111-111111111111";
const TOKEN = "t".repeat(32);

const BODY = () => ({
  opportunity_id: OPPORTUNITY_ID,
  full_name: "Dana Volunteer",
  email: "dana@example.test",
  verification_token: TOKEN,
});

/**
 * POST /api/volunteer/signups is unauthenticated by design — a guest must be able to
 * sign up. Without a proof of email ownership that also meant anyone could sign up any
 * address: the owner was never told, and the confirmation went to a stranger's inbox.
 * A whole verification module existed for this and was simply never called.
 */
function stubHappyPath(t, { assertToken } = {}) {
  mock.method(opportunitiesService, "assertSeatAvailable", async () => ({
    row: { id: OPPORTUNITY_ID, capacity: 10, spots_filled: 0 },
    localFilled: 0,
  }));
  mock.method(opportunitiesService, "syncStatusAfterSignup", async () => {});
  mock.method(opportunitiesService, "getOpportunityById", async () => ({ id: OPPORTUNITY_ID }));
  mock.method(volunteersRepo, "findByEmail", async () => ({
    id: "vol-1",
    email: "dana@example.test",
    full_name: "Dana Volunteer",
    email_verified_at: null,
  }));
  mock.method(volunteersRepo, "markEmailVerified", async (id) => ({ id }));
  // resolveVolunteer links the profile on a signed-in call; unstubbed it reaches Supabase.
  mock.method(volunteersRepo, "claim", async (id, profileId) => ({
    id,
    profile_id: profileId,
    email: "dana@example.test",
    full_name: "Dana Volunteer",
    email_verified_at: null,
  }));
  mock.method(signupsRepo, "createSignup", async (values) => ({ id: "signup-1", ...values }));
  mock.method(
    emailVerification,
    "assertVerificationTokenForEmail",
    assertToken ?? (async () => {}),
  );
  t.after(() => mock.restoreAll());
}

test("createSignup proves email ownership before taking a seat", async (t) => {
  const assertToken = mock.fn(async () => {});
  stubHappyPath(t, { assertToken });

  await signupsService.createSignup(BODY(), null);

  assert.equal(assertToken.mock.callCount(), 1);
  assert.deepEqual(assertToken.mock.calls[0].arguments, [TOKEN, "dana@example.test"]);
});

test("createSignup refuses a token issued for a different address", async (t) => {
  const assertToken = mock.fn(async () => {
    const error = new Error("Verification token does not match this email");
    error.status = 400;
    throw error;
  });
  stubHappyPath(t, { assertToken });
  const createSignup = mock.fn(async () => ({ id: "signup-1" }));
  mock.method(signupsRepo, "createSignup", createSignup);

  await assert.rejects(() => signupsService.createSignup(BODY(), null), /does not match/);
  assert.equal(createSignup.mock.callCount(), 0, "no seat is taken when the proof fails");
});

/**
 * Ordering matters: the check must run before the seat is claimed, or a stream of
 * unverified requests can exhaust a session's capacity and then fail.
 */
test("createSignup checks the token before writing the signup row", async (t) => {
  const order = [];
  stubHappyPath(t, {
    assertToken: async () => {
      order.push("verify");
    },
  });
  mock.method(signupsRepo, "createSignup", async (values) => {
    order.push("create");
    return { id: "signup-1", ...values };
  });

  await signupsService.createSignup(BODY(), null);

  assert.deepEqual(order, ["verify", "create"]);
});

test("createSignup stamps email_verified_at on the volunteer", async (t) => {
  const markEmailVerified = mock.fn(async (id) => ({ id }));
  stubHappyPath(t);
  mock.method(volunteersRepo, "markEmailVerified", markEmailVerified);

  await signupsService.createSignup(BODY(), null);

  assert.equal(markEmailVerified.mock.callCount(), 1);
  assert.equal(markEmailVerified.mock.calls[0].arguments[0], "vol-1");
});

test("createSignup does not re-stamp an already verified volunteer", async (t) => {
  stubHappyPath(t);
  mock.method(volunteersRepo, "findByEmail", async () => ({
    id: "vol-1",
    email: "dana@example.test",
    full_name: "Dana Volunteer",
    email_verified_at: "2026-08-01T00:00:00.000Z",
  }));
  const markEmailVerified = mock.fn(async (id) => ({ id }));
  mock.method(volunteersRepo, "markEmailVerified", markEmailVerified);

  await signupsService.createSignup(BODY(), null);

  assert.equal(markEmailVerified.mock.callCount(), 0);
});

test("createSignup accepts a signed-in caller using their own address without a token", async (t) => {
  const assertToken = mock.fn(async () => {});
  stubHappyPath(t, { assertToken });

  const body = BODY();
  delete body.verification_token;
  await signupsService.createSignup(body, { id: "profile-1", email: "Dana@Example.TEST" });

  assert.equal(assertToken.mock.callCount(), 0, "auth already proved this address");
});

/**
 * Being signed in says nothing about an address that is not yours. Without this, anyone
 * with an account could sign up any address — the same hole, one login away.
 */
test("createSignup still demands a token when a signed-in caller uses someone else's address", async (t) => {
  const assertToken = mock.fn(async () => {});
  stubHappyPath(t, { assertToken });

  await signupsService.createSignup(BODY(), { id: "profile-1", email: "other@example.test" });

  assert.equal(assertToken.mock.callCount(), 1);
});

/**
 * Until this existed a volunteer got nothing at all between signing up and turning up.
 * The only email in the track fired after attendance — by which point the session had
 * already happened.
 */
test("createSignup emails a confirmation to the volunteer", async (t) => {
  stubHappyPath(t);
  const sendEmail = mock.fn(async () => ({ mode: "smtp", delivered: true }));
  mock.method(emailLib, "sendEmail", sendEmail);

  await signupsService.createSignup(BODY(), null);

  assert.equal(sendEmail.mock.callCount(), 1);
  const [message] = sendEmail.mock.calls[0].arguments;
  assert.equal(message.to, "dana@example.test");
  assert.match(message.subject, /confirmed/i);
  assert.ok(message.text.length > 0);
});

/**
 * The spot is already taken by this point. Losing the email is a nuisance; losing the
 * signup because the mail server was down would be much worse.
 */
test("createSignup still returns the signup when the confirmation cannot be sent", async (t) => {
  stubHappyPath(t);
  mock.method(emailLib, "sendEmail", async () => {
    throw new Error("535 auth failed");
  });
  mock.method(console, "error", () => {});

  const result = await signupsService.createSignup(BODY(), null);

  assert.equal(result.signup.id, "signup-1");
});
