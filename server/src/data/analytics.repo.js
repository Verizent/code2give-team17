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
  const { data, error } = await getSupabase().from("donations").select(DONATION_COLUMNS);

  assertOk(error);
  return data ?? [];
}

/**
 * @returns {Promise<object[]>}
 */
async function listSessions() {
  const { data, error } = await getSupabase().from("sessions").select(SESSION_COLUMNS);

  assertOk(error);
  return data ?? [];
}

/**
 * @returns {Promise<object[]>}
 */
async function listSignupFeedback() {
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
};
