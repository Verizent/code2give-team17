const test = require("node:test");
const assert = require("node:assert/strict");

const { createCommunityPostSchema } = require("../../src/schemas/community-post.schema");

const valid = Object.freeze({
  author_name: "A Parent",
  relationship: "parent",
  story:
    "My daughter joined the sports programme last year and the change in her confidence has been remarkable to watch.",
  consent_given: true,
});

const accepts = (input) => createCommunityPostSchema.safeParse(input).success;

test("accepts a complete submission", () => {
  assert.equal(accepts(valid), true);
});

// The DB carries `check (consent_given)` as well; this is the same guarantee one
// layer earlier, so a submission without consent never reaches the insert.
test("rejects a submission where consent is false", () => {
  assert.equal(accepts({ ...valid, consent_given: false }), false);
});

test("rejects a submission with consent missing entirely", () => {
  const { consent_given, ...withoutConsent } = valid;

  assert.equal(accepts(withoutConsent), false);
});

test("rejects a story below the minimum length", () => {
  assert.equal(accepts({ ...valid, story: "Too short." }), false);
});

test("requires an author name and a relationship", () => {
  assert.equal(accepts({ ...valid, author_name: "" }), false);
  assert.equal(accepts({ ...valid, relationship: "" }), false);
});

test("accepts an absent contact email and rejects a malformed one", () => {
  assert.equal(accepts(valid), true);
  assert.equal(accepts({ ...valid, contact_email: "a-parent@example.test" }), true);
  assert.equal(accepts({ ...valid, contact_email: "not-an-email" }), false);
});

// A 400 would tell a bot exactly which field caught it. The schema accepts the
// honeypot and the service drops the row silently instead — this looks like a
// validation bug and someone will try to "fix" it, which is why it is pinned here.
test("ACCEPTS a populated honeypot rather than rejecting it", () => {
  assert.equal(accepts({ ...valid, website: "http://spam.example.test" }), true);
});

test("accepts an empty honeypot, which is what a real submitter sends", () => {
  assert.equal(accepts({ ...valid, website: "" }), true);
});

// The wall filters by activity type, so a submission that cannot carry one can never
// appear under any tab — it is stuck in "All" no matter what it is about.
test("accepts an activity type from the wall's filter set", () => {
  assert.equal(accepts({ ...valid, activity_type: "sport" }), true);
  assert.equal(accepts({ ...valid, activity_type: "csr" }), true);
});

test("rejects an activity type the wall has no tab for", () => {
  // A value with no tab would render a card that no filter can ever reach.
  assert.equal(accepts({ ...valid, activity_type: "gardening" }), false);
  assert.equal(accepts({ ...valid, activity_type: "" }), false);
});

test("activity type stays optional", () => {
  // Rows predating the column, and the older client, must keep working.
  assert.equal(accepts(valid), true);
});
