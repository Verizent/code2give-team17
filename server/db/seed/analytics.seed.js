// DEMO-ONLY: invented supporter activity for the demo — real version needs actual
//            recorded data (§19, §26). Every figure the Analytics tab shows after this
//            runs is fabricated. Nothing here describes real Love 21 supporters.
//
// Run with: npm run seed:analytics
//
// Deliberately NOT part of `npm run seed`. That seed is content (articles, Voices,
// impact figures) and is safe to run in front of anyone. This one invents donation and
// attendance history, so it must be an explicit, separate decision.
//
// UPSERTS AND UPDATES ONLY — never truncates or deletes. Idempotent: every generated
// row has a deterministic natural key and every number comes from a seeded PRNG, so a
// second run overwrites its own rows with identical values and touches nothing else.

require("dotenv").config({ quiet: true });

const crypto = require("node:crypto");
const { getSupabase } = require("../../src/config/supabase");

const MONTHS = 12;
const SEED_EMAIL_DOMAIN = "seed-analytics.love21.local";
/** Marks every donation this script owns, so a re-run updates rather than duplicates. */
const SEED_SESSION_PREFIX = "seed-analytics";

/**
 * Deterministic PRNG (mulberry32).
 *
 * Math.random would make the seed non-idempotent: a second run would write different
 * attendance numbers over the first, and the demo would silently change between
 * rehearsal and performance.
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

/** Stable per-row seed so each entity keeps its own numbers across runs. */
function hashToInt(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function monthsAgo(months, dayOfMonth = 15) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, dayOfMonth));
  return d.toISOString();
}

/**
 * A cohort of donors with a realistic retention shape.
 *
 * Roughly 45% of the oldest cohort keeps giving into the current year, which is the
 * published sector benchmark — the point of the tab is to compare against it, so seeding
 * a wildly better number would make the metric meaningless.
 */
function buildDonors() {
  const donors = [];
  for (let i = 0; i < 24; i += 1) {
    const email = `donor${String(i + 1).padStart(2, "0")}@${SEED_EMAIL_DOMAIN}`;
    donors.push({
      email,
      full_name: `Seed Donor ${i + 1}`,
      locale: "en",
      tracking_opt_in: i % 3 !== 0,
      access_token: seedAccessToken(email),
    });
  }
  return donors;
}

/**
 * DEMO-ONLY: a *predictable* access token, derived from the address — real donors get
 * `lib/tokens.generateAccessToken()`, which is a CSPRNG, and must keep doing so (§19).
 *
 * Derived rather than random because the column is NOT NULL and UNIQUE, so a random
 * value would be rewritten on every re-run and break the idempotency this seed promises.
 * Safe only because these 24 addresses are fabricated and hold no real donor's history;
 * never reuse this helper for a real supporter. 64 hex chars clears the
 * `length(access_token) >= 32` check.
 *
 * @param {string} email
 */
function seedAccessToken(email) {
  return crypto.createHash("sha256").update(`${SEED_SESSION_PREFIX}:${email}`).digest("hex");
}

/**
 * Donations for one donor, spread across the 24-month span.
 *
 * Index decides the behaviour so the cohort composition is fixed rather than drifting:
 * lapsed donors gave only in the prior year, retained donors gave in both, and new
 * donors only in the current year.
 */
function buildDonationsFor(donor, index) {
  const random = makeRandom(hashToInt(donor.email));
  const rows = [];

  const isPrior = index < 16; // 16 donors gave last year
  const isRetained = index < 7; // 7 of those gave again — ~44%
  const isNew = index >= 16;

  const amount = () => [100, 250, 500, 1000][Math.floor(random() * 4)];
  const push = (monthsBack, frequency) => {
    rows.push({
      amount_hkd: amount(),
      frequency,
      status: "succeeded",
      created_at: monthsAgo(monthsBack, 5 + Math.floor(random() * 20)),
      tracking_opt_in: donor.tracking_opt_in,
      is_anonymous: random() < 0.15,
    });
  };

  if (isPrior) {
    push(MONTHS + 2 + Math.floor(random() * 9), "once");
  }

  if (isRetained) {
    // Monthly givers are the ones who come back — that is the whole argument for
    // recurring, and the tab should show it rather than flatten it.
    const monthly = random() < 0.5;
    push(Math.floor(random() * MONTHS), monthly ? "monthly" : "once");
    if (monthly) push(Math.floor(random() * MONTHS), "monthly");
  }

  if (isNew) {
    push(Math.floor(random() * MONTHS), random() < 0.3 ? "monthly" : "once");
  }

  return rows;
}

async function upsertDonors(supabase, donors) {
  const { data, error } = await supabase
    .from("donors")
    .upsert(donors, { onConflict: "email", ignoreDuplicates: false })
    .select("id, email");

  if (error) throw new Error(`Seeding donors failed: ${error.message}`);
  return data ?? [];
}

async function upsertDonations(supabase, rows) {
  const { data, error } = await supabase
    .from("donations")
    .upsert(rows, { onConflict: "stripe_session_id", ignoreDuplicates: false })
    .select("id");

  if (error) throw new Error(`Seeding donations failed: ${error.message}`);
  return data?.length ?? 0;
}

/**
 * Fills attendance on sessions that have already happened.
 *
 * Future sessions are left null on purpose: a session that has not run yet has no
 * attendance, and writing one would make the capacity-fill metric count places that
 * nobody has had the chance to take.
 */
async function fillSessionAttendance(supabase) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("sessions")
    .select("id, capacity, starts_at")
    .lt("starts_at", nowIso);

  if (error) throw new Error(`Reading sessions failed: ${error.message}`);

  let updated = 0;
  for (const session of data ?? []) {
    const capacity = Number(session.capacity) || 0;
    if (capacity <= 0) continue;

    const random = makeRandom(hashToInt(session.id));
    // 55–95% fill. Never 100% across the board — a chart where every bar is full reads
    // as fabricated, which it is, and the banner should be the only thing saying so.
    const ratio = 0.55 + random() * 0.4;
    const attendance = Math.max(1, Math.round(capacity * ratio));

    const { error: updateError } = await supabase
      .from("sessions")
      .update({ attendance_count: attendance, attendance_source: "seed" })
      .eq("id", session.id);

    if (updateError) throw new Error(`Updating session ${session.id} failed: ${updateError.message}`);
    updated += 1;
  }

  return updated;
}

/**
 * Adds feedback to roughly 70% of signups.
 *
 * Not all of them: a 100% response rate is not a thing that happens, and the
 * "responses" count on the tile is meant to show how thin the sample is.
 */
async function fillSignupFeedback(supabase) {
  const { data, error } = await supabase.from("volunteer_signups").select("id");

  if (error) throw new Error(`Reading volunteer_signups failed: ${error.message}`);

  let updated = 0;
  for (const signup of data ?? []) {
    const random = makeRandom(hashToInt(signup.id));
    if (random() > 0.7) continue;

    const rating = [3, 4, 4, 5, 5, 5][Math.floor(random() * 6)];

    const { error: updateError } = await supabase
      .from("volunteer_signups")
      .update({
        experience_rating: rating,
        would_return: rating >= 4,
        feedback_submitted_at: monthsAgo(Math.floor(random() * 6)),
      })
      .eq("id", signup.id);

    if (updateError) throw new Error(`Updating signup ${signup.id} failed: ${updateError.message}`);
    updated += 1;
  }

  return updated;
}

async function main() {
  const supabase = getSupabase();

  const donorRows = await upsertDonors(supabase, buildDonors());
  const byEmail = new Map(donorRows.map((row) => [row.email, row.id]));

  const donations = [];
  buildDonors().forEach((donor, index) => {
    const donorId = byEmail.get(donor.email);
    if (!donorId) return;

    buildDonationsFor(donor, index).forEach((row, giftIndex) => {
      donations.push({
        ...row,
        donor_id: donorId,
        // Deterministic natural key — this is what makes a re-run an update.
        stripe_session_id: `${SEED_SESSION_PREFIX}-${donor.email}-${giftIndex}`,
      });
    });
  });

  const donationCount = await upsertDonations(supabase, donations);
  const sessionCount = await fillSessionAttendance(supabase);
  const signupCount = await fillSignupFeedback(supabase);

  console.log(`Seeded ${donorRows.length} donors`);
  console.log(`Seeded ${donationCount} donations across ${MONTHS * 2} months`);
  console.log(`Filled attendance on ${sessionCount} past sessions`);
  console.log(`Added feedback to ${signupCount} volunteer signups`);
  console.log("");
  console.log("DEMO-ONLY: every figure above is invented. The Analytics tab labels it.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
