const { test, mock } = require("node:test");
const assert = require("node:assert/strict");

const emailLib = require("../../../src/lib/email");
const {
  sendDonorThankYou,
  trackingUrlFor,
} = require("../../../src/services/donations/donor-thank-you.service");

const ORIGIN = "http://localhost:5173";
const TOKEN = "83f0def4656b02a64f97fb38efb0c35ae1f6575a5a94840824daa9f6ba901a93";

function mockSend(t) {
  const sent = mock.method(emailLib, "sendEmail", async () => ({ mode: "log", delivered: true }));
  t.after(() => mock.restoreAll());
  return sent;
}

const DONOR = {
  email: "mei@example.com",
  full_name: "Mei Chan",
  access_token: TOKEN,
  tracking_opt_in: true,
};
const DONATION = { amount_hkd: 2500, frequency: "once", events_credited: 5 };

test("the email carries the tracking link — the donor's only route back", async (t) => {
  // The token is shown once on the thanks page and §15 has no lookup-by-email, so if this
  // link is missing the donor's giving history is unreachable forever.
  const sent = mockSend(t);

  const result = await sendDonorThankYou({
    donor: DONOR,
    donation: DONATION,
    clientOrigin: ORIGIN,
  });

  const message = sent.mock.calls[0].arguments[0];
  assert.equal(message.to, "mei@example.com");
  assert.ok(message.text.includes(`${ORIGIN}/give/track/${TOKEN}`), "tracking URL must appear");
  assert.ok(message.html.includes(`href="${ORIGIN}/give/track/${TOKEN}"`), "and be clickable");
  assert.deepEqual(result, {
    sent: true,
    to: "mei@example.com",
    tracked: true,
    sessions_listed: 0,
  });
});

test("opting out of tracking withholds the link but still sends the receipt", async (t) => {
  const sent = mockSend(t);

  const result = await sendDonorThankYou({
    donor: { ...DONOR, tracking_opt_in: false },
    donation: DONATION,
    clientOrigin: ORIGIN,
  });

  const message = sent.mock.calls[0].arguments[0];
  assert.equal(message.text.includes("/give/track/"), false, "no link when opted out");
  // The amount is no longer stated anywhere — what survives is the thanks and the Section 88
  // note, which is the receipt content that does not depend on tracking consent.
  assert.match(message.text, /Thank you for your gift to Love 21/);
  assert.match(message.text, /Section 88/);
  assert.equal(result.tracked, false);
  assert.equal(result.sent, true);
});

test("a donor with no token gets a receipt rather than a broken link", async (t) => {
  const sent = mockSend(t);

  await sendDonorThankYou({
    donor: { ...DONOR, access_token: null },
    donation: DONATION,
    clientOrigin: ORIGIN,
  });

  assert.equal(sent.mock.calls[0].arguments[0].text.includes("/give/track/"), false);
});

test("no email address is reported, not thrown — this runs inside the Stripe webhook", async (t) => {
  const sent = mockSend(t);

  const result = await sendDonorThankYou({
    donor: { ...DONOR, email: null },
    donation: DONATION,
    clientOrigin: ORIGIN,
  });

  assert.equal(result.sent, false);
  assert.match(result.reason, /no email/i);
  assert.equal(sent.mock.calls.length, 0, "must not attempt a send");
});

test("session counts read singular at 1 and plural above it", async (t) => {
  const sent = mockSend(t);

  await sendDonorThankYou({
    donor: DONOR,
    donation: { ...DONATION, events_credited: 1 },
    clientOrigin: ORIGIN,
  });
  assert.match(sent.mock.calls[0].arguments[0].text, /the next session we run/);

  await sendDonorThankYou({ donor: DONOR, donation: DONATION, clientOrigin: ORIGIN });
  assert.match(sent.mock.calls[1].arguments[0].text, /the next 5 sessions we run/);
});

test("a recurring gift states its cadence — this reaches the donor's inbox as a record", async (t) => {
  const sent = mockSend(t);

  await sendDonorThankYou({
    donor: DONOR,
    donation: { ...DONATION, frequency: "weekly" },
    clientOrigin: ORIGIN,
  });
  assert.match(sent.mock.calls[0].arguments[0].text, /every week/);

  await sendDonorThankYou({
    donor: DONOR,
    donation: { ...DONATION, frequency: "monthly" },
    clientOrigin: ORIGIN,
  });
  assert.match(sent.mock.calls[1].arguments[0].text, /every month/);
});

test("Traditional Chinese donors get Chinese copy with the same link", async (t) => {
  const sent = mockSend(t);

  await sendDonorThankYou({
    donor: { ...DONOR, locale: "zh-Hant" },
    donation: DONATION,
    clientOrigin: ORIGIN,
  });

  const message = sent.mock.calls[0].arguments[0];
  assert.match(message.subject, /感謝/);
  assert.ok(message.text.includes(`${ORIGIN}/give/track/${TOKEN}`));
});

const SESSIONS = [
  {
    id: "s1",
    title_en: "Healthy cooking workshop",
    title_zh: "健康烹飪工作坊",
    location_en: "Yau Ma Tei Kitchen",
    location_zh: "油麻地廚房",
    starts_at: "2026-08-09T10:00:00+00:00",
  },
  {
    id: "s2",
    title_en: "Floor curling drop-in",
    location_en: "Kwun Tong Studio",
    starts_at: "2026-08-12T02:30:00+00:00",
  },
];

test("the email names every session the gift funded, in Hong Kong time", async (t) => {
  const sent = mockSend(t);

  await sendDonorThankYou({
    donor: DONOR,
    donation: { ...DONATION, events_credited: 2 },
    clientOrigin: ORIGIN,
    sessions: SESSIONS,
  });

  const { text } = sent.mock.calls[0].arguments[0];
  assert.match(text, /It supports these 2 sessions:/);
  assert.match(text, /Healthy cooking workshop/);
  assert.match(text, /Floor curling drop-in/);
  assert.match(text, /Yau Ma Tei Kitchen/);
  // 10:00 UTC is an 18:00 class in Hong Kong. Formatting in the server's own zone would put
  // the wrong evening in the donor's inbox.
  assert.match(text, /Sun 9 Aug · 18:00 · Yau Ma Tei Kitchen/);
  assert.match(text, /Wed 12 Aug · 10:30 · Kwun Tong Studio/);
});

test("the email states no donation amount", async (t) => {
  // Deliberate: the donor knows what they paid and Stripe already receipted it. This email is
  // about what the money does.
  const sent = mockSend(t);

  await sendDonorThankYou({
    donor: DONOR,
    donation: DONATION,
    clientOrigin: ORIGIN,
    sessions: SESSIONS,
  });

  const { text } = sent.mock.calls[0].arguments[0];
  assert.equal(/HK\$2,500|HK\$2500/.test(text), false, "the gift amount must not appear");
  // The Section 88 line legitimately contains HK$100 — a threshold, not this donation.
  assert.match(text, /HK\$100 or more are tax-deductible/);
});

test("with no sessions allocated the email falls back to the count", async (t) => {
  // Allocation comes up short when too few sessions sit in the eligibility window. Promising
  // a list that is not there would be worse than saying the number.
  const sent = mockSend(t);

  await sendDonorThankYou({
    donor: DONOR,
    donation: DONATION,
    clientOrigin: ORIGIN,
    sessions: [],
  });

  const { text } = sent.mock.calls[0].arguments[0];
  assert.match(text, /the next 5 sessions we run/);
  assert.equal(text.includes("  • "), false, "no empty bullet block");
});

test("Chinese copy uses the Chinese session titles", async (t) => {
  const sent = mockSend(t);

  await sendDonorThankYou({
    donor: { ...DONOR, locale: "zh-Hant" },
    donation: { ...DONATION, events_credited: 2 },
    clientOrigin: ORIGIN,
    sessions: SESSIONS,
  });

  const { text } = sent.mock.calls[0].arguments[0];
  assert.match(text, /健康烹飪工作坊/);
  assert.match(text, /油麻地廚房/);
  // s2 has no zh title — falls back per FIELD, not per row.
  assert.match(text, /Floor curling drop-in/);
});

test("trackingUrlFor returns null rather than a URL ending in undefined", () => {
  assert.equal(trackingUrlFor({}, ORIGIN), null);
  assert.equal(trackingUrlFor({ access_token: TOKEN }, ORIGIN), `${ORIGIN}/give/track/${TOKEN}`);
});
