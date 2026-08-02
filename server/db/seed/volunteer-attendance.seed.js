// DEMO-ONLY: marks attendance on volunteer signups that were never registered at the
//            time — real version needs staff marking a class roll (§19, §26).
//
// Run with: npm run seed:volunteer-attendance
//
// Deliberately narrow. It writes ONLY `attended_at` and `hours_logged`, and ONLY onto
// volunteer_signups rows that already exist. It inserts nothing, deletes nothing, and
// touches no other table — so no teammate sees a record appear that they did not create.
// Both columns are null on every row today, so nothing is overwritten either.
//
// `status` is deliberately left alone. The app's own markAttended() also sets
// status='attended', but that value feeds spot accounting and badge awards elsewhere, and
// flipping 29 rows into a state other features react to is a wider blast radius than this
// seed is allowed. Analytics reads `attended_at`, never `status`.
//
// Idempotent: attendance is decided by hashing each signup's own id, so a second run
// writes the same rows the same values.

require("dotenv").config({ quiet: true });

const { getSupabase } = require("../../src/config/supabase");

/** Share of signups that turned up. Never 100% — no-shows are the interesting part. */
const ATTENDANCE_RATE = 0.75;

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

function hashToInt(value) {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

async function main() {
  const supabase = getSupabase();

  const { data: opportunities, error: oppError } = await supabase
    .from("volunteer_opportunities")
    .select("id, starts_at, ends_at");

  if (oppError) throw new Error(`Reading opportunities failed: ${oppError.message}`);

  const startsAt = new Map((opportunities ?? []).map((row) => [row.id, row.starts_at]));

  const { data: signups, error: signupError } = await supabase
    .from("volunteer_signups")
    .select("id, opportunity_id, attended_at");

  if (signupError) throw new Error(`Reading signups failed: ${signupError.message}`);

  const now = new Date();
  let attended = 0;
  let skippedFuture = 0;

  for (const signup of signups ?? []) {
    const startedAt = startsAt.get(signup.opportunity_id);
    // A session that has not run yet cannot have been attended. Writing one would make
    // the range filter report attendance in a window that has not happened.
    if (!startedAt || new Date(startedAt) > now) {
      skippedFuture += 1;
      continue;
    }

    const random = makeRandom(hashToInt(signup.id));
    if (random() > ATTENDANCE_RATE) continue;

    const { error } = await supabase
      .from("volunteer_signups")
      .update({
        attended_at: startedAt,
        hours_logged: 2 + Math.round(random() * 4),
      })
      .eq("id", signup.id);

    if (error) throw new Error(`Updating signup ${signup.id} failed: ${error.message}`);
    attended += 1;
  }

  console.log(`Marked ${attended} of ${signups?.length ?? 0} signups as attended`);
  console.log(`Skipped ${skippedFuture} whose session has not happened yet`);
  console.log("");
  console.log("DEMO-ONLY: this attendance was generated, not recorded by staff.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
