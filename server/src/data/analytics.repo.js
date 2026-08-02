const { getSupabase } = require("../config/supabase");
const { assertOk } = require("./supabase-error");

// DEMO-ONLY: donors.source / volunteers.source do not exist yet — stubbed counts
//            until the migration lands (§19, §26). Flip SOURCE_COLUMN_EXISTS to true
//            in the same commit as the migration; the live queries below are already
//            written and need no other change.
const SOURCE_COLUMN_EXISTS = false;

const STUB_DONOR_SOURCES = [
  { source: "instagram" },
  { source: "instagram" },
  { source: "friend" },
  { source: "search" },
  { source: null },
];

const STUB_VOLUNTEER_SOURCES = [
  { source: "friend" },
  { source: "friend" },
  { source: "instagram" },
  { source: "school" },
  { source: "handson" },
  { source: null },
];

// DEMO-ONLY: generated supporter history so the tab demos populated without writing to
//            the shared Supabase project — real version needs recorded data (§19, §26).
//            Chosen over running db/seed/analytics.seed.js because that seed upserts 24
//            invented donors into `donors`, which teammates would then see listed in the
//            donations UI with no explanation. Flip to false to read the real tables; the
//            queries below are untouched and need no other change.
const USE_STUB_ANALYTICS = true;

const STUB_PROGRAMMES = ["family", "fitness", "nutrition", "sports", "where_needed"];

/**
 * Deterministic PRNG (mulberry32), matching db/seed/analytics.seed.js.
 *
 * Math.random would make the figures change between one request and the next, so the
 * numbers a judge sees during the demo would differ from the rehearsal.
 *
 * @param {number} seed
 */
function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** @param {string} value */
function hashToInt(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Midnight UTC on the FIRST of the month, `months` before the current month.
 *
 * Pinned to a day boundary rather than `Date.now()` so two calls within the same day
 * produce byte-identical timestamps — a determinism test compares whole payloads.
 *
 * The 1st, not the 15th: for `months = 0` the 15th is a future date for the first half
 * of every month. `donorRetention` correctly refuses to count a gift dated after now, so
 * those donors silently vanished from the current window while still appearing in the
 * month chart — the two panels disagreed. The 1st of the current month is always in the
 * past.
 *
 * @param {number} months
 */
function monthStart(months) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1)).toISOString();
}

/**
 * 30 donors across two 12-month windows.
 *
 * Cohorts are assigned by index rather than by chance so the retention rate is a fixed
 * property of this function: 18 donors gave in the prior window and 8 of them gave again,
 * which is ~44% and sits inside the published 40–45% sector band. A stub that flattered
 * the number would make the benchmark on the tile meaningless.
 *
 * Current-window gifts are spread across the last six months by `index % 6` so every
 * month of the chart has at least one gift — a chart with a hole in it reads as broken
 * rather than as a quiet month.
 */
function stubDonations() {
  const rows = [];
  const push = (donorId, monthsBack, frequency, amount) => {
    rows.push({
      donor_id: donorId,
      amount_hkd: amount,
      status: "succeeded",
      created_at: monthStart(monthsBack),
      frequency,
    });
  };

  for (let i = 0; i < 30; i += 1) {
    const donorId = `stub-donor-${String(i + 1).padStart(2, "0")}`;
    const random = makeRandom(hashToInt(donorId));
    const amount = () => [100, 250, 500, 1000, 2000][Math.floor(random() * 5)];
    const recentMonth = i % 6;

    if (i < 18) {
      // Gave last year.
      push(donorId, 13 + Math.floor(random() * 10), "once", amount());
    }
    if (i < 8) {
      // ...and came back. These are the retained cohort.
      push(donorId, recentMonth, random() < 0.5 ? "monthly" : "once", amount());
    }
    if (i >= 18) {
      // Acquired this year.
      push(donorId, recentMonth, random() < 0.35 ? "monthly" : "once", amount());
    }
  }

  return rows;
}

/**
 * 45 sessions, nine per programme, filled 55–95%.
 *
 * Never uniformly full: a chart where every bar is complete reads as fabricated, and the
 * gap between places offered and attendance is the insight the programme panel exists to
 * show.
 */
function stubSessions() {
  const rows = [];

  for (const programme of STUB_PROGRAMMES) {
    for (let i = 0; i < 9; i += 1) {
      const random = makeRandom(hashToInt(`${programme}-${i}`));
      const capacity = 8 + Math.floor(random() * 17);
      const fill = 0.55 + random() * 0.4;
      rows.push({
        programme,
        capacity,
        attendance_count: Math.max(1, Math.round(capacity * fill)),
      });
    }
  }

  return rows;
}

/**
 * 40 signups, roughly 70% of which left feedback.
 *
 * Not all of them — a 100% response rate does not happen, and the response count on the
 * tile is there to show how thin the sample is.
 */
function stubSignupFeedback() {
  const rows = [];

  for (let i = 0; i < 40; i += 1) {
    const random = makeRandom(hashToInt(`stub-signup-${i}`));
    const answered = random() < 0.7;

    if (!answered) {
      rows.push({ experience_rating: null, would_return: null, feedback_submitted_at: null });
      continue;
    }

    const rating = [3, 4, 4, 5, 5, 5][Math.floor(random() * 6)];
    rows.push({
      experience_rating: rating,
      would_return: rating >= 4,
      feedback_submitted_at: monthStart(i % 6),
    });
  }

  return rows;
}

const DONATION_COLUMNS = ["donor_id", "amount_hkd", "status", "created_at", "frequency"].join(", ");
const SESSION_COLUMNS = ["programme", "capacity", "attendance_count"].join(", ");
const SIGNUP_FEEDBACK_COLUMNS = [
  "experience_rating",
  "would_return",
  "feedback_submitted_at",
].join(", ");

/**
 * Every donation, including `pending` ones.
 *
 * The status filter is deliberately NOT applied here: "only settled money counts" is a
 * business rule, and pushing it into the query would make it untestable without a
 * database. The service filters, and a unit test pins that a pending gift cannot create
 * a retained or repeat donor.
 *
 * @returns {Promise<object[]>}
 */
async function listDonations() {
  if (USE_STUB_ANALYTICS) return stubDonations();

  const { data, error } = await getSupabase().from("donations").select(DONATION_COLUMNS);

  assertOk(error);
  return data ?? [];
}

/**
 * @returns {Promise<object[]>}
 */
async function listSessions() {
  if (USE_STUB_ANALYTICS) return stubSessions();

  const { data, error } = await getSupabase().from("sessions").select(SESSION_COLUMNS);

  assertOk(error);
  return data ?? [];
}

/**
 * @returns {Promise<object[]>}
 */
async function listSignupFeedback() {
  if (USE_STUB_ANALYTICS) return stubSignupFeedback();

  const { data, error } = await getSupabase()
    .from("volunteer_signups")
    .select(SIGNUP_FEEDBACK_COLUMNS);

  assertOk(error);
  return data ?? [];
}

/**
 * "Where did you find us", per person, for donors and volunteers.
 *
 * `available: false` tells the client to label the numbers as placeholders rather than
 * render them as findings.
 *
 * @returns {Promise<{ donors: object[], volunteers: object[], available: boolean }>}
 */
async function listAcquisitionSources() {
  if (!SOURCE_COLUMN_EXISTS) {
    return { donors: STUB_DONOR_SOURCES, volunteers: STUB_VOLUNTEER_SOURCES, available: false };
  }

  const supabase = getSupabase();

  const [donorsResult, volunteersResult] = await Promise.all([
    supabase.from("donors").select("id, source"),
    supabase.from("volunteers").select("id, source"),
  ]);

  assertOk(donorsResult.error);
  assertOk(volunteersResult.error);

  return {
    donors: donorsResult.data ?? [],
    volunteers: volunteersResult.data ?? [],
    available: true,
  };
}

module.exports = {
  listDonations,
  listSessions,
  listSignupFeedback,
  listAcquisitionSources,
  // Exported so the stub test suite can skip itself rather than fail when someone flips
  // the flag off — those tests need no database, and must not start needing one.
  USE_STUB_ANALYTICS,
};
