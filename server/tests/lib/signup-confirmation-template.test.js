const { test } = require("node:test");
const assert = require("node:assert/strict");

const { renderSignupConfirmation } = require("../../src/lib/email-templates");

const OPPORTUNITY = {
  title_en: "Saturday Sports Buddy",
  title_zh: "周六運動夥伴",
  location_en: "Love 21 Hub, Kwun Tong",
  location_zh: "Love 21 中心（觀塘）",
  starts_at: "2026-08-08T02:00:00.000Z",
  ends_at: "2026-08-08T05:00:00.000Z",
  programme: "sports",
};

const SIGNUP = { id: "11111111-1111-4111-8111-111111111111" };

test("confirms the spot with the session name, when, and where", () => {
  const out = renderSignupConfirmation(
    { full_name: "Dana", locale: "en" },
    OPPORTUNITY,
    SIGNUP,
  );

  assert.match(out.subject, /Saturday Sports Buddy/);
  assert.match(out.text, /Dana/);
  assert.match(out.text, /Saturday Sports Buddy/);
  assert.match(out.text, /Love 21 Hub, Kwun Tong/);
  assert.ok(out.html.includes("Saturday Sports Buddy"));
});

/**
 * The briefing is the one thing a volunteer needs before turning up, and the success
 * page is easy to close. The email has to carry the link or it is unreachable.
 */
test("links to the briefing for this signup", () => {
  const out = renderSignupConfirmation({ full_name: "Dana" }, OPPORTUNITY, SIGNUP);
  assert.match(out.text, new RegExp(`/volunteer/briefing/${SIGNUP.id}`));
});

test("uses Chinese copy and Chinese fields for a zh-Hant volunteer", () => {
  const out = renderSignupConfirmation(
    { full_name: "陳大文", locale: "zh-Hant" },
    OPPORTUNITY,
    SIGNUP,
  );

  assert.match(out.text, /周六運動夥伴/);
  assert.match(out.text, /Love 21 中心（觀塘）/);
  assert.doesNotMatch(out.subject, /Saturday Sports Buddy/);
});

/**
 * Locale falls back per field, not per row — a listing with an English title but no
 * Chinese one must still render, rather than printing "undefined" at a volunteer.
 */
test("falls back to the English field when the Chinese one is missing", () => {
  const out = renderSignupConfirmation(
    { full_name: "陳大文", locale: "zh-Hant" },
    { ...OPPORTUNITY, title_zh: null, location_zh: "" },
    SIGNUP,
  );

  assert.match(out.text, /Saturday Sports Buddy/);
  assert.match(out.text, /Love 21 Hub, Kwun Tong/);
  assert.doesNotMatch(out.text, /undefined|null/);
});

test("survives an opportunity with no location without printing a blank line", () => {
  const out = renderSignupConfirmation(
    { full_name: "Dana" },
    { ...OPPORTUNITY, location_en: null, location_zh: null },
    SIGNUP,
  );

  assert.doesNotMatch(out.text, /undefined|null/);
  assert.match(out.text, /Saturday Sports Buddy/);
});

test("escapes the volunteer name in the HTML part", () => {
  const out = renderSignupConfirmation(
    { full_name: '<script>alert(1)</script>' },
    OPPORTUNITY,
    SIGNUP,
  );

  assert.doesNotMatch(out.html, /<script>/);
  assert.match(out.html, /&lt;script&gt;/);
});
