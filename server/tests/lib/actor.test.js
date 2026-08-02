const { test } = require("node:test");
const assert = require("node:assert/strict");

const { actorFromAuth } = require("../../src/lib/actor");

const AUTH = Object.freeze({
  userId: "11111111-1111-4111-8111-111111111111",
  email: "volunteer@example.com",
  role: "volunteer",
  profile: { id: "11111111-1111-4111-8111-111111111111", role: "volunteer" },
});

test("maps request.auth.userId onto the id the volunteer services expect", () => {
  // The whole point of this helper. resolveVolunteer/cancelSignup read `user.id`;
  // the auth layer publishes `userId`. Without the rename the services silently see
  // undefined and treat a signed-in caller as a stranger.
  const actor = actorFromAuth(AUTH);

  assert.equal(actor.id, AUTH.userId);
  assert.equal(actor.email, AUTH.email);
});

test("returns null for an anonymous caller", () => {
  // optionalAuth leaves request.auth undefined for a visitor with no token. The
  // services accept `null` and branch on it, so undefined must not reach them.
  assert.equal(actorFromAuth(undefined), null);
  assert.equal(actorFromAuth(null), null);
});

test("does not carry role or profile onto the actor", () => {
  // A volunteer service must never be able to reach for `user.role` — authorisation
  // is the middleware's job, and an actor carrying a role invites a service-level
  // check that bypasses requireRole.
  const actor = actorFromAuth(AUTH);

  assert.deepEqual(Object.keys(actor).sort(), ["email", "id"]);
});

test("tolerates an auth object with no email", () => {
  // A phone-auth account has no address. cancelSignup falls back to a profile_id
  // lookup, so a null email must be passed through rather than crashing here.
  const actor = actorFromAuth({ userId: "abc", email: null, role: "volunteer" });

  assert.equal(actor.id, "abc");
  assert.equal(actor.email, null);
});
